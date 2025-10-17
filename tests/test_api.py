from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a deep copy of original participants to restore after each test
    original = {k: v.copy() for k, v in activities.items()}
    yield
    # restore participants lists
    for k in activities:
        activities[k]["participants"] = original[k]["participants"].copy()


def test_get_activities():
    client = TestClient(app)
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_availability():
    client = TestClient(app)
    activity = "Chess Club"
    email = "testuser@mergington.edu"

    # ensure not already in participants
    assert email not in activities[activity]["participants"]

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"].startswith("Signed up")

    # now the participant should be present
    assert email in activities[activity]["participants"]


def test_duplicate_signup_returns_400():
    client = TestClient(app)
    activity = "Chess Club"
    existing = activities[activity]["participants"][0]

    resp = client.post(f"/activities/{activity}/signup?email={existing}")
    assert resp.status_code == 400


def test_unregister_participant():
    client = TestClient(app)
    activity = "Programming Class"
    participant = activities[activity]["participants"][0]

    resp = client.delete(f"/activities/{activity}/participants?email={participant}")
    assert resp.status_code == 200
    assert participant not in activities[activity]["participants"]


def test_unregister_nonexistent_returns_404():
    client = TestClient(app)
    activity = "Programming Class"
    fake = "notfound@mergington.edu"

    resp = client.delete(f"/activities/{activity}/participants?email={fake}")
    assert resp.status_code == 404

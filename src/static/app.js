document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset the activity select so options don't duplicate on repeated fetches
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants markup
        let participantsHTML = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const items = details.participants
            .map((p) => `<li data-email="${String(p)}">${String(p)} <button class=\"delete-participant\" data-email=\"${String(p)}\" data-activity=\"${name}\" title=\"Remove participant\">&times;</button></li>`)
            .join("");
          participantsHTML = `
            <div class="participants">
              <h5>Participants</h5>
              <ul class="participants-list">
                ${items}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `<div class="participants-empty">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Attach event listeners for delete buttons
        const deleteButtons = activityCard.querySelectorAll('.delete-participant');
        deleteButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const email = btn.dataset.email;
            const activityName = btn.dataset.activity;

            if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

            try {
              const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
              const result = await resp.json();

              if (resp.ok) {
                // Refresh activities list
                fetchActivities();
              } else {
                console.error('Failed to unregister:', result);
                alert(result.detail || 'Failed to unregister participant');
              }
            } catch (err) {
              console.error('Error unregistering participant:', err);
              alert('Error unregistering participant');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh the activities list so availability and participants update immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

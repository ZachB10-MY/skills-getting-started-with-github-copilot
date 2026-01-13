document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const serveTip = document.getElementById("serve-tip");

  // If the page is opened via file://, show a helpful hint and stop early
  if (location.protocol === "file:") {
    activitiesList.innerHTML = `<p class="error">This page must be served over HTTP. See the tip below to start a simple local server.</p>`;
    if (serveTip) serveTip.classList.remove("hidden");
    return;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        const participants = details.participants || [];
        let participantsHTML = "";
        if (participants.length) {
          participantsHTML = `<div class="participants-section"><strong>Participants (${participants.length}):</strong><ul class="participants-list">` +
            participants
              .map((email) => {
                const local = email.split("@")[0] || "";
                const initials = local
                  .split(/[\.\-_]/)
                  .map((s) => (s ? s[0] : ""))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return `<li class="participant-item"><span class="avatar" aria-hidden="true">${initials}</span><span class="participant-email">${email}</span></li>`;
              })
              .join("") +
            `</ul></div>`;
        } else {
          participantsHTML = `<div class="participants-section no-participants">No participants yet.</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      // Helpful messages for common problems
      activitiesList.innerHTML =
        `<p class="error">Failed to load activities. Check that the backend is running and accessible at <code>/activities</code>.</p>
         <p class="info">Quick test: <code>curl -v http://localhost:5000/activities</code> (adjust port if needed)</p>`;
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

document.addEventListener("DOMContentLoaded", () => {
  const updateButton = document.querySelector(".btn--primary");
  const currentUsernameInput = document.querySelector('input[value="admin"]');
  const newUsernameInput = document.querySelector('input[type="text"]:not([readonly])');
  const currentEmailInput = document.querySelector('input[type="email"][readonly]');
  const newEmailInput = document.querySelector('input[type="email"]:not([readonly])');
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Load saved settings if they exist
  const savedSettings = JSON.parse(localStorage.getItem("userSettings")) || {};
  if (savedSettings.username && newUsernameInput) {
    newUsernameInput.value = savedSettings.username;
  }
  if (savedSettings.email && newEmailInput) {
    newEmailInput.value = savedSettings.email;
  }

  if (!updateButton) return;

  updateButton.addEventListener("click", (event) => {
    event.preventDefault();

    // Validate password change if provided
    if (newPasswordInput && newPasswordInput.value) {
      if (!currentPasswordInput || !currentPasswordInput.value) {
        alert("⚠️ Please enter your current password to change it.");
        return;
      }
      if (newPasswordInput.value !== confirmPasswordInput.value) {
        alert("⚠️ New passwords do not match.");
        return;
      }
      if (newPasswordInput.value.length < 6) {
        alert("⚠️ New password must be at least 6 characters long.");
        return;
      }
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:999;";

    // Create modal
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;z-index:1000;";
    modal.innerHTML = `
      <div class="modal__content" style="background:white;padding:2em;border-radius:8px;max-width:400px;text-align:center;">
        <div class="loader" style="display:block;margin:0 auto 1em;"></div>
        <p id="modalText">Updating Settings...</p>
      </div>
    `;

    // Add both to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Save settings to localStorage
    const settingsToSave = {};
    if (newUsernameInput && newUsernameInput.value) {
      settingsToSave.username = newUsernameInput.value;
    }
    if (newEmailInput && newEmailInput.value) {
      settingsToSave.email = newEmailInput.value;
    }
    if (newPasswordInput && newPasswordInput.value) {
      // In a real app, you'd hash this password. For demo, we store it.
      settingsToSave.password = newPasswordInput.value;
    }
    
    localStorage.setItem("userSettings", JSON.stringify(settingsToSave));

    // Simulate loading (1.5 seconds)
    setTimeout(() => {
      modal.innerHTML = `
        <div class="modal__content" style="background:white;padding:2em;border-radius:8px;max-width:400px;text-align:center;">
          <div style="font-size:3em;margin-bottom:0.5em;">✅</div>
          <h2 style="margin:0.5em 0;">Settings Updated Successfully!</h2>
          <p>Your preferences have been saved.</p>
          <button id="okButton" class="btn btn--success" style="margin-top:1em;">OK</button>
          <small style="display:block;margin-top:1em;color:#666;">You can also press any key to return</small>
        </div>
      `;

      const okButton = document.getElementById("okButton");
      const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
        // Reload page to show updated values
        window.location.reload();
      };

      okButton.addEventListener("click", closeModal);

      // Allow any key press to close
      const keyHandler = (e) => {
        closeModal();
        document.removeEventListener("keydown", keyHandler);
      };
      document.addEventListener("keydown", keyHandler);
    }, 1500);
  });
});

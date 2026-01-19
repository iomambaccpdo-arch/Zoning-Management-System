// Dynamic Settings Page - Load and Update Current User Profile
document.addEventListener("DOMContentLoaded", () => {
  // Get current logged-in user
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    alert("⚠️ No user session found. Please log in again.");
    window.location.href = "login.html";
    return;
  }

  // Get all users to find the full user profile
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userProfile = users.find(u => 
    (u.username && u.username === currentUser.username) ||
    (u.email && u.email === currentUser.email)
  );

  if (!userProfile) {
    alert("⚠️ User profile not found. Please contact administrator.");
    return;
  }

  // Populate readonly fields with current user info
  document.getElementById('userName').value = userProfile.name || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || currentUser.name || '';
  document.getElementById('userDesignation').value = userProfile.designation || '';
  document.getElementById('userSection').value = userProfile.section || '';
  document.getElementById('userRole').value = userProfile.role || currentUser.role || '';
  document.getElementById('currentUsername').value = userProfile.username || currentUser.username || '';
  document.getElementById('currentEmail').value = userProfile.email || currentUser.email || '';

  // Pre-fill new fields with current values (user can edit)
  document.getElementById('newUsername').value = userProfile.username || currentUser.username || '';
  document.getElementById('newEmail').value = userProfile.email || currentUser.email || '';

  // Update button handler
  const updateBtn = document.getElementById('updateSettingsBtn');
  if (updateBtn) {
    updateBtn.addEventListener('click', handleUpdateSettings);
  }

  function handleUpdateSettings(e) {
    e.preventDefault();

    const newUsername = document.getElementById('newUsername').value.trim();
    const newEmail = document.getElementById('newEmail').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!newUsername || !newEmail) {
      alert("⚠️ Username and Email are required.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert("⚠️ Please enter a valid email address.");
      return;
    }

    // Check if password change is requested
    if (newPassword) {
      if (!currentPassword) {
        alert("⚠️ Please enter your current password to change it.");
        return;
      }
      
      // Verify current password
      if (userProfile.password !== currentPassword) {
        alert("⚠️ Current password is incorrect.");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("⚠️ New passwords do not match.");
        return;
      }

      if (newPassword.length < 6) {
        alert("⚠️ New password must be at least 6 characters long.");
        return;
      }
    }

    // Check if username or email already exists (excluding current user)
    const usernameExists = users.some(u => 
      u.username === newUsername && u.username !== userProfile.username
    );
    const emailExists = users.some(u => 
      u.email === newEmail && u.email !== userProfile.email
    );

    if (usernameExists) {
      alert("⚠️ Username already exists. Please choose a different username.");
      return;
    }

    if (emailExists) {
      alert("⚠️ Email already exists. Please choose a different email.");
      return;
    }

    // Show loading modal
    showLoadingModal();

    // Simulate processing delay
    setTimeout(() => {
      // Update user in users array
      const userIndex = users.findIndex(u => 
        (u.username && u.username === userProfile.username) ||
        (u.email && u.email === userProfile.email)
      );

      if (userIndex !== -1) {
        // Update user profile
        users[userIndex].username = newUsername;
        users[userIndex].email = newEmail;
        
        if (newPassword) {
          users[userIndex].password = newPassword;
        }

        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));

        // Update current session
        const updatedSession = {
          ...currentUser,
          username: newUsername,
          email: newEmail,
          name: userProfile.name || currentUser.name,
          role: userProfile.role || currentUser.role,
          designation: userProfile.designation || currentUser.designation,
          section: userProfile.section || currentUser.section,
          updatedAt: new Date().toISOString()
        };

        // Update session storage (check which one was used)
        if (localStorage.getItem('currentUser')) {
          localStorage.setItem('currentUser', JSON.stringify(updatedSession));
        } else if (sessionStorage.getItem('currentUser')) {
          sessionStorage.setItem('currentUser', JSON.stringify(updatedSession));
        }

        // Show success modal
        showSuccessModal();
      } else {
        showErrorModal("User profile not found in database.");
      }
    }, 1500);
  }

  function showLoadingModal() {
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:999;";

    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.id = "settingsModal";
    modal.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;z-index:1000;";
    modal.innerHTML = `
      <div class="modal__content" style="background:white;padding:2em;border-radius:8px;max-width:400px;text-align:center;">
        <div class="loader" style="display:block;margin:0 auto 1em;"></div>
        <p id="modalText">Updating Settings...</p>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    window.settingsOverlay = overlay;
    window.settingsModal = modal;
  }

  function showSuccessModal() {
    if (window.settingsModal) {
      window.settingsModal.innerHTML = `
        <div class="modal__content" style="background:white;padding:2em;border-radius:8px;max-width:400px;text-align:center;">
          <div style="font-size:3em;margin-bottom:0.5em;">✅</div>
          <h2 style="margin:0.5em 0;">Settings Updated Successfully!</h2>
          <p>Your profile has been updated.</p>
          <button id="okButton" class="btn btn--success" style="margin-top:1em;">OK</button>
          <small style="display:block;margin-top:1em;color:#666;">You can also press any key to return</small>
        </div>
      `;

      const okButton = document.getElementById("okButton");
      const closeModal = () => {
        if (window.settingsOverlay) document.body.removeChild(window.settingsOverlay);
        if (window.settingsModal) document.body.removeChild(window.settingsModal);
        // Reload page to show updated values
        window.location.reload();
      };

      okButton.addEventListener("click", closeModal);

      const keyHandler = (e) => {
        closeModal();
        document.removeEventListener("keydown", keyHandler);
      };
      document.addEventListener("keydown", keyHandler);
    }
  }

  function showErrorModal(message) {
    if (window.settingsModal) {
      window.settingsModal.innerHTML = `
        <div class="modal__content" style="background:white;padding:2em;border-radius:8px;max-width:400px;text-align:center;">
          <div style="font-size:3em;margin-bottom:0.5em;">⚠️</div>
          <h2 style="margin:0.5em 0;">Error</h2>
          <p>${message}</p>
          <button id="okButton" class="btn btn--primary" style="margin-top:1em;">OK</button>
        </div>
      `;

      const okButton = document.getElementById("okButton");
      okButton.addEventListener("click", () => {
        if (window.settingsOverlay) document.body.removeChild(window.settingsOverlay);
        if (window.settingsModal) document.body.removeChild(window.settingsModal);
      });
    }
  }
});


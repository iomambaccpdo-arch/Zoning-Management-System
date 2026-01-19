// === Create User Logic with Modal & Redirect ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const modal = document.getElementById("successModal");
  const modalText = document.getElementById("modalText");
  const okButton = document.getElementById("okButton");
  const loader = document.querySelector(".loader");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Show modal with loader
    modal.classList.remove("hidden");
    modalText.textContent = "Creating User...";
    okButton.classList.add("hidden");
    loader.style.display = "block";

    // Simulate user creation delay
    setTimeout(() => {
      // Collect form values and validate
      const firstName = document.getElementById('createFirstName').value.trim();
      const lastName = document.getElementById('createLastName').value.trim();
      const username = document.getElementById('createUsername').value.trim();
      const email = document.getElementById('createEmail').value.trim();
      const designation = document.getElementById('createDesignation').value;
      const section = document.getElementById('createSection').value;
      const role = document.getElementById('createRole').value;
      const password = document.getElementById('createPassword').value;
      const confirmPassword = document.getElementById('createConfirmPassword').value;

      if (password !== confirmPassword) {
        loader.style.display = 'none';
        modalText.textContent = '⚠️ Passwords do not match.';
        okButton.classList.remove('hidden');
        okButton.textContent = 'OK';
        okButton.addEventListener('click', () => { modal.classList.add('hidden'); okButton.textContent = 'OK'; });
        return;
      }

        // Build user object (ID will be computed dynamically on the accounts list)
        const user = {
          firstName,
          lastName,
          name: (firstName + ' ' + lastName).trim(),
          username,
          email,
          designation,
          section,
          role,
          // Note: storing plain password for demo only; in real apps never store plaintext passwords
          password,
          createdAt: new Date().toISOString()
        };

      // Save to localStorage users array
      const users = JSON.parse(localStorage.getItem('users')) || [];
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));

      loader.style.display = "none";
      modalText.textContent = "✅ User Created Successfully!";
      okButton.classList.remove("hidden");

      // Allow pressing any key to confirm
      document.addEventListener("keydown", redirectToDashboard);
    }, 2000);
  });

  // Click OK to redirect
  okButton.addEventListener("click", redirectToDashboard);

  // Redirect function
  function redirectToDashboard() {
    window.location.href = "accounts.html";
  }
});

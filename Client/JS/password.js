function togglePassword(id, el) {
  const input = document.getElementById(id);
  if (input.type === "password") {
    input.type = "text";
    el.textContent = "🙈";
  } else {
    input.type = "password";
    el.textContent = "👁️";
  }
}

function checkStrength(password) {
  const bar = document.querySelector(".strength-bar");
  const text = document.querySelector(".strength-text");
  const container = document.getElementById("passwordStrength");

  let strength = 0;
  if (password.length > 5) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  container.classList.remove("strength-weak", "strength-medium", "strength-strong");

  if (strength <= 1) {
    container.classList.add("strength-weak");
    text.textContent = "Weak";
  } else if (strength === 2 || strength === 3) {
    container.classList.add("strength-medium");
    text.textContent = "Medium";
  } else {
    container.classList.add("strength-strong");
    text.textContent = "Strong";
  }
}

function matchPasswords() {
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmPassword").value;
  const matchText = document.getElementById("passwordMatch");

  if (confirmPass.length === 0) {
    matchText.textContent = "";
    matchText.className = "password-match-text";
    return;
  }

  if (newPass === confirmPass) {
    matchText.textContent = "✅ Passwords match";
    matchText.className = "password-match-text match";
  } else {
    matchText.textContent = "❌ Passwords do not match";
    matchText.className = "password-match-text nomatch";
  }
}

// Automatically wire .toggle-eye controls (skip those with inline onclick to avoid double-binding)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-eye').forEach(el => {
    if (el.hasAttribute('onclick')) return; // already wired inline in some pages
    const targetId = el.dataset.target;
    if (!targetId) return;
    const input = document.getElementById(targetId);
    if (!input) return;
    // make keyboard accessible
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    const toggle = () => {
      if (input.type === 'password') {
        input.type = 'text';
        el.textContent = '🙈';
        el.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        el.textContent = '👁️';
        el.setAttribute('aria-label', 'Show password');
      }
    };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); }
    });
  });
});
// Login functionality
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');

  // Check if user is already logged in
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    // User is already logged in, redirect to dashboard
    window.location.href = 'dashboard.html';
    return;
  }

  // Handle form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginButton = document.querySelector('.btn--login');
    const btnText = loginButton.querySelector('.btn-text');
    
    // Hide any previous error messages
    errorMessage.classList.remove('show');
    
    // Show loading state
    loginButton.classList.add('loading');
    loginButton.disabled = true;
    if (btnText) {
      btnText.textContent = 'Signing in...';
    }
    
    // Small delay for better UX (shows loader)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const usernameOrEmail = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;

    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];

      // Find user by username or email
      const user = users.find(u => 
        (u.username && u.username.toLowerCase() === usernameOrEmail.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase())
      );

      // Validate credentials
      if (!user) {
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
        if (btnText) {
          btnText.textContent = 'Sign In';
        }
        showError('Invalid username or email.');
        return;
      }

      if (!user.password || user.password !== password) {
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
        if (btnText) {
          btnText.textContent = 'Sign In';
        }
        showError('Invalid password.');
        return;
      }

      // Login successful
      // Store current user info
      const userSession = {
        id: user.username,
        name: user.name || `${user.firstName} ${user.lastName}`,
        username: user.username,
        email: user.email,
        role: user.role,
        designation: user.designation,
        section: user.section,
        loginTime: new Date().toISOString()
      };

      if (rememberMe) {
        // Store in localStorage (persists until logout)
        localStorage.setItem('currentUser', JSON.stringify(userSession));
      } else {
        // Store in sessionStorage (cleared when browser closes)
        sessionStorage.setItem('currentUser', JSON.stringify(userSession));
      }

      // Success feedback before redirect
      if (btnText) {
        btnText.textContent = '✓ Success!';
        btnText.style.opacity = '1';
      }
      loginButton.classList.remove('loading');
      await new Promise(resolve => setTimeout(resolve, 600));

      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } catch (error) {
      // Handle any errors
      console.error('Login error:', error);
      loginButton.classList.remove('loading');
      loginButton.disabled = false;
      if (btnText) {
        btnText.textContent = 'Sign In';
      }
      showError('An error occurred. Please try again.');
    }
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Clear error after 5 seconds
    setTimeout(() => {
      errorMessage.classList.remove('show');
    }, 5000);
  }

  // Allow Enter key to submit form
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });
});


// Authentication utility functions

// Check if user is logged in
function isLoggedIn() {
  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  return currentUser !== null;
}

// Get current user
function getCurrentUser() {
  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  return currentUser ? JSON.parse(currentUser) : null;
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Protect pages - redirect to login if not authenticated
function protectPage() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// Initialize sign out buttons
function initSignOut() {
  const signOutButtons = document.querySelectorAll('a[href="#"]');
  signOutButtons.forEach(button => {
    if (button.textContent.trim() === 'Sign out' || button.textContent.includes('Sign out')) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  });
}

// Update user card with current user info
function updateUserCard() {
  const user = getCurrentUser();
  if (user) {
    // Update name
    const nameElements = document.querySelectorAll('.usercard__name');
    nameElements.forEach(el => {
      // Use stored name, fallback to username, then default to 'User'
      const displayName = user.name || user.username || 'User';
      el.textContent = displayName;
    });
    
    // Update role (show role like Admin, User, Viewer, or designation)
    const roleElements = document.querySelectorAll('.usercard__role');
    roleElements.forEach(el => {
      // Show role first, fallback to designation, then default to 'User'
      el.textContent = user.role || user.designation || 'User';
    });
    
    // Update email
    const emailElements = document.querySelectorAll('.usercard__email');
    emailElements.forEach(el => {
      el.textContent = user.email || '';
    });
  } else {
    // If no user found, clear the fields
    document.querySelectorAll('.usercard__name').forEach(el => el.textContent = '');
    document.querySelectorAll('.usercard__role').forEach(el => el.textContent = '');
    document.querySelectorAll('.usercard__email').forEach(el => el.textContent = '');
  }
}

// ==========================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================

// Check if user has a specific role
function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
}

// Check if user has any of the specified roles
function hasAnyRole(...roles) {
  const user = getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
}

// Check if user is Admin
function isAdmin() {
  return hasRole('Admin');
}

// Check if user is Viewer (read-only)
function isViewer() {
  return hasRole('Viewer');
}

// Check if user is User (standard user)
function isUser() {
  return hasRole('User');
}

// Protect page by role - redirect if user doesn't have required role
function protectPageByRole(allowedRoles) {
  protectPage(); // First check if logged in
  const user = getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    // User doesn't have required role, redirect to dashboard
    alert('Access denied. You do not have permission to access this page.');
    window.location.href = 'dashboard.html';
  }
}

// Hide navigation items based on role
function hideNavItemsByRole() {
  const user = getCurrentUser();
  if (!user) return;

  // Viewer and User: Hide Accounts and Settings
  if (user.role === 'Viewer' || user.role === 'User') {
    const accountsNav = document.querySelector('a[href="accounts.html"]');
    const settingsNav = document.querySelector('a[href="settings.html"]');
    
    if (accountsNav) {
      const navItem = accountsNav.closest('.nav__item');
      if (navItem) navItem.style.display = 'none';
    }
    
    if (settingsNav) {
      const navItem = settingsNav.closest('.nav__item');
      if (navItem) navItem.style.display = 'none';
    }
  }
}

// Hide/create buttons and action buttons based on role
function hideActionsByRole() {
  const user = getCurrentUser();
  if (!user) return;

  // Viewer: Hide all create/edit/delete buttons
  if (user.role === 'Viewer') {
    // Hide "New Document" buttons
    const newDocButtons = document.querySelectorAll('a[href="new-document.html"]');
    newDocButtons.forEach(btn => {
      btn.style.display = 'none';
    });

    // Hide "Create New" buttons
    const createButtons = document.querySelectorAll('a[href*="new-document"], a[href*="new-user"]');
    createButtons.forEach(btn => {
      if (btn.textContent.includes('Create') || btn.textContent.includes('New')) {
        btn.style.display = 'none';
      }
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initSignOut();
  updateUserCard();
  hideNavItemsByRole();
  hideActionsByRole();
});


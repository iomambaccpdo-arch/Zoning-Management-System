// Authentication utility functions

// Check if user is logged in
export function isLoggedIn() {
  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  return currentUser !== null;
}

// Get current user
export function getCurrentUser() {
  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  return currentUser ? JSON.parse(currentUser) : null;
}

// Logout function
export function logout() {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.location.href = '/login';
}

// Check if user has a specific role
export function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
}

// Check if user has any of the specified roles
export function hasAnyRole(...roles) {
  const user = getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
}

// Check if user is Admin
export function isAdmin() {
  return hasRole('Admin');
}

// Check if user is Viewer (read-only)
export function isViewer() {
  return hasRole('Viewer');
}

// Check if user is User (standard user)
export function isUser() {
  return hasRole('User');
}

// API service layer for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      return user.token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return data;
  },

  getCurrentUser: async () => {
    try {
      return await apiRequest('/auth/me');
    } catch (error) {
      return null;
    }
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return await apiRequest('/users');
  },

  getById: async (id) => {
    return await apiRequest(`/users/${id}`);
  },

  create: async (userData) => {
    return await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id, userData) => {
    return await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Documents API
export const documentsAPI = {
  getAll: async () => {
    return await apiRequest('/documents');
  },

  getById: async (id) => {
    return await apiRequest(`/documents/${id}`);
  },

  create: async (documentData) => {
    return await apiRequest('/documents', {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  },

  update: async (id, documentData) => {
    return await apiRequest(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(documentData),
    });
  },

  delete: async (id) => {
    return await apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// Files API
export const filesAPI = {
  getById: async (id) => {
    return await apiRequest(`/files/${id}`);
  },

  delete: async (id) => {
    return await apiRequest(`/files/${id}`, { method: 'DELETE' });
  },

  download: async (id) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/files/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'file';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Logs API (Admin only)
export const logsAPI = {
  getLogs: async (params = {}) => {
    const sp = new URLSearchParams();
    if (params.page != null) sp.set('page', params.page);
    if (params.limit != null) sp.set('limit', params.limit);
    if (params.user) sp.set('user', params.user);
    if (params.module) sp.set('module', params.module);
    if (params.action) sp.set('action', params.action);
    if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
    if (params.dateTo) sp.set('dateTo', params.dateTo);
    if (params.search) sp.set('search', params.search);
    const q = sp.toString();
    return await apiRequest(`/logs${q ? `?${q}` : ''}`);
  },
};

export default {
  auth: authAPI,
  users: usersAPI,
  documents: documentsAPI,
  files: filesAPI,
  logs: logsAPI,
};

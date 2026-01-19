import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Files from './pages/Files'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import NewDocument from './pages/NewDocument'
import NewUser from './pages/NewUser'
import { isLoggedIn } from './utils/auth'

// Protected Route component
function ProtectedRoute({ children, allowedRoles = null }) {
  const loggedIn = isLoggedIn()
  const currentUser = loggedIn ? JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}') : null

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && (!currentUser || !allowedRoles.includes(currentUser.role))) {
    alert('Access denied. You do not have permission to access this page.')
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute allowedRoles={['Admin']}><Accounts /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/new-document" element={<ProtectedRoute allowedRoles={['Admin', 'User']}><NewDocument /></ProtectedRoute>} />
        <Route path="/new-user" element={<ProtectedRoute allowedRoles={['Admin']}><NewUser /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App

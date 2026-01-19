import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../utils/auth'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleSignOut = (e) => {
    e.preventDefault()
    logout()
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  // Hide navigation items based on role
  const hideNavItems = () => {
    if (!user) return { accounts: false, settings: false }
    if (user.role === 'Viewer' || user.role === 'User') {
      return { accounts: true, settings: true }
    }
    return { accounts: false, settings: false }
  }

  const hidden = hideNavItems()

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/Logo/CPDO LOGO.png" alt="CPDO" className="brand__logo" />
      </div>
      <nav className="nav">
        <Link className={`nav__item ${isActive('/dashboard') ? 'nav__item--active' : ''}`} to="/dashboard">
          <span className="nav__icon">🏠</span>
          <span>Dashboard</span>
        </Link>
        <Link className={`nav__item ${isActive('/files') ? 'nav__item--active' : ''}`} to="/files">
          <span className="nav__icon">📄</span>
          <span>Files</span>
        </Link>
        {!hidden.accounts && (
          <Link className={`nav__item ${isActive('/accounts') ? 'nav__item--active' : ''}`} to="/accounts">
            <span className="nav__icon">👤</span>
            <span>Accounts</span>
          </Link>
        )}
        {!hidden.settings && (
          <Link className={`nav__item ${isActive('/settings') ? 'nav__item--active' : ''}`} to="/settings">
            <span className="nav__icon">⚙️</span>
            <span>Settings</span>
          </Link>
        )}
      </nav>
      <div className="sidebar__footer">
        <div className="usercard">
          <div className="usercard__name">{user?.name || user?.username || 'Loading...'}</div>
          <div className="usercard__role">{user?.role || user?.designation || 'Loading...'}</div>
          <div className="usercard__email">{user?.email || 'Loading...'}</div>
          <div className="usercard__status">
            <span className="badge badge--online"></span>
            <span>Online</span>
          </div>
        </div>
        <a className="btn btn--muted btn--small w-100" href="#" onClick={handleSignOut}>Sign out</a>
      </div>
    </aside>
  )
}

export default Sidebar

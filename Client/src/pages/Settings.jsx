import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'
import { usersAPI, logsAPI } from '../utils/api'
import { formatDateTime } from '../utils/dateFormat'

function Settings() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  console.log('[Settings] Component rendered, isLoading:', isLoading, 'currentUser:', currentUser)
  const [formData, setFormData] = useState({
    userName: '',
    userDesignation: '',
    userSection: '',
    userRole: '',
    currentUsername: '',
    currentEmail: '',
    newUsername: '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordStrength, setPasswordStrength] = useState({ text: 'Enter a password', class: '' })
  const [passwordMatch, setPasswordMatch] = useState('')

  // Activity Logs (Admin only)
  const [logs, setLogs] = useState([])
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsFilters, setLogsFilters] = useState({
    search: '',
    user: '',
    module: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  })
  const [logsFiltersApplied, setLogsFiltersApplied] = useState({})
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [logsSortBy, setLogsSortBy] = useState('created_at')
  const [logsSortOrder, setLogsSortOrder] = useState('desc')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = getCurrentUser()
        
        console.log('[Settings] Loading settings, currentUser:', user)
        
        if (!user) {
          console.warn('[Settings] No user found, redirecting to login')
          navigate('/login')
          return
        }

        setCurrentUser(user)
        console.log('[Settings] User set:', user)

        let allUsers = []
        try {
          allUsers = await usersAPI.getAll()
        } catch (e) {
          console.error('Error loading users from API:', e)
          allUsers = []
        }
        setUsers(allUsers)
      
        // Use the 'user' variable from getCurrentUser(), not the state variable
        const profile = allUsers.find(u =>
          (u.username && u.username.toLowerCase() === user.username?.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === user.email?.toLowerCase())
        )

        if (!profile) {
          console.warn('User profile not found in users array, using session data:', user)
          // Still show the form with currentUser data if profile not found
          const sessionProfile = {
            ...user,
            id: user.id,
            name: user.name || '',
            first_name: '',
            last_name: '',
            designation: user.designation || '',
            section: user.section || '',
            role: user.role || '',
            username: user.username || '',
            email: user.email || ''
          }
          setUserProfile(sessionProfile)
          setFormData({
            userName: user.name || '',
            userDesignation: user.designation || '',
            userSection: user.section || '',
            userRole: user.role || '',
            currentUsername: user.username || '',
            currentEmail: user.email || '',
            newUsername: user.username || '',
            newEmail: user.email || ''
          })
        } else {
          setUserProfile(profile)
          const fullName = profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.name || ''
          const initialFormData = {
            userName: fullName,
            userDesignation: profile.designation || user.designation || '',
            userSection: profile.section || user.section || '',
            userRole: profile.role || user.role || '',
            currentUsername: profile.username || user.username || '',
            currentEmail: profile.email || user.email || '',
            newUsername: profile.username || user.username || '',
            newEmail: profile.email || user.email || ''
          }
          console.log('[Settings] Setting formData:', initialFormData)
          setFormData(initialFormData)
        }
        
        setIsLoading(false)
        console.log('[Settings] Loading complete, isLoading set to false')
      } catch (error) {
        console.error('Error loading settings:', error)
        setHasError(true)
        // Set a fallback profile so the page can still render
        const fallbackUser = getCurrentUser()
        if (fallbackUser) {
          setCurrentUser(fallbackUser)
          setFormData({
            userName: fallbackUser.name || '',
            userDesignation: fallbackUser.designation || '',
            userSection: fallbackUser.section || '',
            userRole: fallbackUser.role || '',
            currentUsername: fallbackUser.username || '',
            currentEmail: fallbackUser.email || '',
            newUsername: fallbackUser.username || '',
            newEmail: fallbackUser.email || ''
          })
        }
        setIsLoading(false)
      }
    }
    
    loadSettings()
  }, [navigate])

  // Ensure formData is initialized with currentUser data if empty.
  // IMPORTANT: this must be declared before any conditional returns (hooks must be unconditional),
  // otherwise Settings can render a blank page due to a hooks order violation.
  useEffect(() => {
    if (!currentUser) return
    if (userProfile) return
    if (formData.userName !== '' || formData.currentUsername !== '') return

    setFormData({
      userName: currentUser.name || '',
      userDesignation: currentUser.designation || '',
      userSection: currentUser.section || '',
      userRole: currentUser.role || '',
      currentUsername: currentUser.username || '',
      currentEmail: currentUser.email || '',
      newUsername: currentUser.username || '',
      newEmail: currentUser.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    // We intentionally do not include formData in deps to avoid loops; we gate on its emptiness above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userProfile])

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ text: 'Enter a password', class: '' })
      return
    }
    
    let strength = 0
    if (password.length > 5) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++	
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 1) {
      setPasswordStrength({ text: 'Weak', class: 'strength-weak' })
    } else if (strength === 2 || strength === 3) {
      setPasswordStrength({ text: 'Medium', class: 'strength-medium' })
    } else {
      setPasswordStrength({ text: 'Strong', class: 'strength-strong' })
    }
  }

  const checkPasswordMatch = () => {
    const confirm = formData.confirmPassword ?? ''
    if (confirm.length === 0) {
      setPasswordMatch('')
      return
    }

    const newPwd = formData.newPassword ?? ''
    if (newPwd === confirm) {
      setPasswordMatch('✅ Passwords match')
    } else {
      setPasswordMatch('❌ Passwords do not match')
    }
  }

  useEffect(() => {
    if (formData.newPassword) {
      checkPasswordStrength(formData.newPassword)
    } else {
      setPasswordStrength({ text: 'Enter a password', class: '' })
    }
  }, [formData.newPassword])

  useEffect(() => {
    checkPasswordMatch()
  }, [formData.newPassword, formData.confirmPassword])

  const loadLogs = async (page = 1) => {
    if (!currentUser || currentUser.role !== 'Admin') return
    setLogsLoading(true)
    try {
      const params = {
        page,
        limit: logsPagination.limit,
        ...(logsFiltersApplied.search && { search: logsFiltersApplied.search }),
        ...(logsFiltersApplied.user && { user: logsFiltersApplied.user }),
        ...(logsFiltersApplied.module && { module: logsFiltersApplied.module }),
        ...(logsFiltersApplied.action && { action: logsFiltersApplied.action }),
        ...(logsFiltersApplied.dateFrom && { dateFrom: logsFiltersApplied.dateFrom }),
        ...(logsFiltersApplied.dateTo && { dateTo: logsFiltersApplied.dateTo })
      }
      const data = await logsAPI.getLogs(params)
      setLogs(data.logs || [])
      setLogsPagination(prev => ({ ...prev, ...data.pagination, page: data.pagination?.page || page }))
    } catch (err) {
      console.error('Load logs error:', err)
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'Admin' && showLogsModal) {
      loadLogs(logsPagination.page)
    }
  }, [currentUser?.role, showLogsModal, logsPagination.page, logsFiltersApplied])

  useEffect(() => {
    if (showLogsModal) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [showLogsModal])

  const applyLogsFilters = () => {
    setLogsFiltersApplied({ ...logsFilters })
    setLogsPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearLogsFilters = () => {
    setLogsFilters({
      search: '',
      user: '',
      module: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    })
    setLogsFiltersApplied({})
    setLogsPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleLogsSort = (field) => {
    setLogsSortBy(field)
    setLogsSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const sortedLogs = React.useMemo(() => {
    if (!logs.length) return []
    const key = logsSortBy
    const order = logsSortOrder === 'asc' ? 1 : -1
    return [...logs].sort((a, b) => {
      const va = a[key] ?? ''
      const vb = b[key] ?? ''
      if (key === 'created_at') {
        const da = new Date(va).getTime()
        const db = new Date(vb).getTime()
        return order * (da - db)
      }
      const sa = String(va)
      const sb = String(vb)
      return order * sa.localeCompare(sb, undefined, { sensitivity: 'base' })
    })
  }, [logs, logsSortBy, logsSortOrder])

  const handleUpdate = async (e) => {
    e.preventDefault()

    if (!formData.newUsername || !formData.newEmail) {
      alert('⚠️ Username and Email are required.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.newEmail)) {
      alert('⚠️ Please enter a valid email address.')
      return
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        alert('⚠️ Please enter your current password to change it.')
        return
      }

      // Password verification will be handled by the backend

      if ((formData.newPassword ?? '') !== (formData.confirmPassword ?? '')) {
        alert('⚠️ New passwords do not match.')
        return
      }

      if ((formData.newPassword ?? '').length < 6) {
        alert('⚠️ New password must be at least 6 characters long.')
        return
      }
    }

    const usernameExists = users.some(u =>
      u.username === formData.newUsername && u.username !== (userProfile?.username || currentUser?.username)
    )
    const emailExists = users.some(u =>
      u.email === formData.newEmail && u.email !== (userProfile?.email || currentUser?.email)
    )

    if (usernameExists) {
      alert('⚠️ Username already exists. Please choose a different username.')
      return
    }

    if (emailExists) {
      alert('⚠️ Email already exists. Please choose a different email.')
      return
    }

    showLoadingModal()

    try {
      const userId = currentUser?.id || userProfile?.id
      if (!userId) {
        throw new Error('User ID not found')
      }

      const updateData = {
        username: formData.newUsername,
        email: formData.newEmail
      }

      if (formData.newPassword) {
        updateData.password = formData.newPassword
        updateData.currentPassword = formData.currentPassword
      }

      await usersAPI.update(userId, updateData)

      // Update the session (currentUser)
      if (currentUser) {
        const updatedSession = {
          ...currentUser,
          username: formData.newUsername,
          email: formData.newEmail,
          name: userProfile?.name || currentUser.name,
          role: userProfile?.role || currentUser.role,
          designation: userProfile?.designation || currentUser.designation,
          section: userProfile?.section || currentUser.section,
          updatedAt: new Date().toISOString()
        }

        if (localStorage.getItem('currentUser')) {
          localStorage.setItem('currentUser', JSON.stringify(updatedSession))
        } else if (sessionStorage.getItem('currentUser')) {
          sessionStorage.setItem('currentUser', JSON.stringify(updatedSession))
        }
      }

      showSuccessModal()
    } catch (error) {
      console.error('Error updating settings:', error)
      alert(`Error updating settings: ${error.message || 'Failed to update'}`)
      // Remove loading modal
      if (window.settingsOverlay) document.body.removeChild(window.settingsOverlay)
      if (window.settingsModal) document.body.removeChild(window.settingsModal)
    }
  }

  const showLoadingModal = () => {
    const overlay = document.createElement('div')
    overlay.className = 'overlay'
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:999;'

    const modal = document.createElement('div')
    modal.id = 'settingsModal'
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;z-index:1000;'
    modal.innerHTML = `
      <div class="modal__content" style="background:white;padding:2em;border-radius:8px;max-width:400px;text-align:center;">
        <div class="loader" style="display:block;margin:0 auto 1em;"></div>
        <p id="modalText">Updating Settings...</p>
      </div>
    `

    document.body.appendChild(overlay)
    document.body.appendChild(modal)
    window.settingsOverlay = overlay
    window.settingsModal = modal
  }

  const showSuccessModal = () => {
    if (window.settingsModal) {
      window.settingsModal.innerHTML = `
        <div class="modal__content" style="background:white;padding:2em;border-radius:8px;max-width:400px;text-align:center;">
          <div style="font-size:3em;margin-bottom:0.5em;">✅</div>
          <h2 style="margin:0.5em 0;">Settings Updated Successfully!</h2>
          <p>Your profile has been updated.</p>
          <button id="okButton" class="btn btn--success" style="margin-top:1em;">OK</button>
          <small style="display:block;margin-top:1em;color:#666;">You can also press any key to return</small>
        </div>
      `

      const okButton = document.getElementById('okButton')
      const closeModal = () => {
        if (window.settingsOverlay) document.body.removeChild(window.settingsOverlay)
        if (window.settingsModal) document.body.removeChild(window.settingsModal)
        // Use React Router navigation instead of full page reload
        navigate('/settings', { replace: true })
      }

      okButton.addEventListener('click', closeModal)
      const keyHandler = (e) => {
        closeModal()
        document.removeEventListener('keydown', keyHandler)
      }
      document.addEventListener('keydown', keyHandler)
    }
  }

  // If no user, show message (redirect should have happened in useEffect)
  if (!currentUser) {
    console.log('[Settings] No currentUser, rendering fallback')
    return (
      <Layout>
        <main className="main">
          <header className="header">
            <h1>CPDO ZONING MANAGEMENT SYSTEM SETTINGS</h1>
          </header>
          <section className="section">
            <div style={{ padding: '2em', textAlign: 'center' }}>
              {isLoading ? 'Loading user settings...' : 'Please log in to access settings.'}
            </div>
          </section>
        </main>
      </Layout>
    )
  }

  console.log('[Settings] Rendering main form, currentUser:', currentUser, 'formData:', formData, 'isLoading:', isLoading)

  // Ensure we have formData values, use currentUser as fallback
  const displayName = formData.userName || currentUser?.name || ''
  const displayDesignation = formData.userDesignation || currentUser?.designation || ''
  const displaySection = formData.userSection || currentUser?.section || ''
  const displayRole = formData.userRole || currentUser?.role || ''
  const displayCurrentUsername = formData.currentUsername || currentUser?.username || ''
  const displayCurrentEmail = formData.currentEmail || currentUser?.email || ''
  const displayNewUsername = formData.newUsername || displayCurrentUsername
  const displayNewEmail = formData.newEmail || displayCurrentEmail

  return (
    <Layout>
      <main className="main" style={{ minHeight: '100vh' }}>
        <header className="header">
          <h1>CPDO ZONING MANAGEMENT SYSTEM SETTINGS</h1>
          <div className="actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button className="btn" onClick={() => navigate(-1)}>← Back</button>
            {currentUser?.role === 'Admin' && (
              <button
                type="button"
                className="btn btn--muted"
                onClick={() => setShowLogsModal(true)}
                title="View activity audit trail"
              >
                📋 Activity Logs
              </button>
            )}
          </div>
        </header>

        <section className="section" style={{ padding: '2em' }}>
          {hasError && (
            <div style={{ padding: '1em', margin: '1em 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
              ⚠️ Warning: Could not load full user profile. You can still update your session information.
            </div>
          )}
          <h2 className="section__title">Account Settings</h2>
          <div className="form" id="settingsForm">
            <div className="form__row">
              <div>
                <label className="label">Full Name</label>
                <input className="input" type="text" id="userName" readOnly value={displayName} />
              </div>
              <div>
                <label className="label">Designation</label>
                <input className="input" type="text" id="userDesignation" readOnly value={displayDesignation} />
              </div>
            </div>
            <div className="form__row">
              <div>
                <label className="label">Section</label>
                <input className="input" type="text" id="userSection" readOnly value={displaySection} />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input" type="text" id="userRole" readOnly value={displayRole} />
              </div>
            </div>
            <div className="spacer"></div>
            <h3 className="section__title" style={{ marginTop: 0 }}>Update Profile Information</h3>
            <div className="form__row">
              <div>
                <label className="label">Current Username</label>
                <input className="input" type="text" id="currentUsername" readOnly value={displayCurrentUsername} />
              </div>
              <div>
                <label className="label">New Username</label>
                <input
                  className="input"
                  type="text"
                  id="newUsername"
                  placeholder="Enter new username"
                  value={displayNewUsername}
                  onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
                />
              </div>
            </div>
            <div className="form__row">
              <div>
                <label className="label">Current Email</label>
                <input className="input" type="email" id="currentEmail" readOnly value={displayCurrentEmail} />
              </div>
              <div>
                <label className="label">New Email</label>
                <input
                  className="input"
                  type="email"
                  id="newEmail"
                  placeholder="Enter new email"
                  value={displayNewEmail}
                  onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="spacer"></div>
            <h3 className="section__title" style={{ marginTop: 0 }}>Change Password</h3>

            <div className="form__row">
              <div>
                <label className="label">Current Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="currentPassword"
                    className="input"
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  />
                  <span
                    className="toggle-eye"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    role="button"
                    tabIndex={0}
                    aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.current ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="newPassword"
                    className="input"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                  <span
                    className="toggle-eye"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    role="button"
                    tabIndex={0}
                    aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.new ? '🙈' : '👁️'}
                  </span>
                </div>
                <div id="passwordStrength" className={`password-strength ${passwordStrength.class}`}>
                  <div className="strength-bar"></div>
                  <span className="strength-text">{passwordStrength.text}</span>
                </div>
              </div>
            </div>

            <div className="form__row">
              <div style={{ flex: 1 }}>
                <label className="label">Confirm New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    className="input"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <span
                    className="toggle-eye"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    role="button"
                    tabIndex={0}
                    aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.confirm ? '🙈' : '👁️'}
                  </span>
                </div>
                <div id="passwordMatch" className={`password-match-text ${passwordMatch.includes('✅') ? 'match' : passwordMatch.includes('❌') ? 'nomatch' : ''}`}>
                  {passwordMatch}
                </div>
              </div>
            </div>

            <button className="btn btn--primary" type="button" id="updateSettingsBtn" onClick={handleUpdate}>
              🔄 Update Settings
            </button>
          </div>
        </section>

        {currentUser?.role === 'Admin' && showLogsModal && (
          <div
            className="logs-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logs-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.target === e.currentTarget && setShowLogsModal(false)}
          >
            <div
              className="logs-modal-box"
              style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                maxWidth: 'min(960px, 100%)',
                width: '100%',
                maxHeight: 'min(90vh, 800px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#fff'
                }}
              >
                <h2 id="logs-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                  📋 Activity Logs
                </h2>
                <button
                  type="button"
                  onClick={() => setShowLogsModal(false)}
                  aria-label="Close"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#fff',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    lineHeight: 1,
                    padding: 0
                  }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: 0, padding: '0.75rem 1.25rem', fontSize: '0.875rem', color: '#64748b', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                Read-only audit trail of create, edit, and delete actions across documents, users, and files.
              </p>

              <div style={{ padding: '1rem 1.25rem', flexShrink: 0, borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Search user or record..."
                    value={logsFilters.search}
                    onChange={(e) => setLogsFilters(f => ({ ...f, search: e.target.value }))}
                    style={{ width: 'min(180px, 100%)', padding: '0.45rem 0.6rem', fontSize: '0.875rem' }}
                  />
                  <select
                    className="input"
                    value={logsFilters.user}
                    onChange={(e) => setLogsFilters(f => ({ ...f, user: e.target.value }))}
                    style={{ width: 'min(140px, 100%)', padding: '0.45rem 0.6rem', fontSize: '0.875rem' }}
                  >
                    <option value="">All users</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username || u.name || u.email}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={logsFilters.module}
                    onChange={(e) => setLogsFilters(f => ({ ...f, module: e.target.value }))}
                    style={{ width: 'min(110px, 100%)', padding: '0.45rem 0.6rem', fontSize: '0.875rem' }}
                  >
                    <option value="">All modules</option>
                    <option value="documents">Documents</option>
                    <option value="users">Users</option>
                    <option value="files">Files</option>
                  </select>
                  <select
                    className="input"
                    value={logsFilters.action}
                    onChange={(e) => setLogsFilters(f => ({ ...f, action: e.target.value }))}
                    style={{ width: 'min(100px, 100%)', padding: '0.45rem 0.6rem', fontSize: '0.875rem' }}
                  >
                    <option value="">All actions</option>
                    <option value="create">Create</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                  <input
                    type="date"
                    className="input"
                    value={logsFilters.dateFrom}
                    onChange={(e) => setLogsFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    style={{ width: 'min(130px, 100%)', padding: '0.45rem 0.6rem', fontSize: '0.875rem' }}
                    title="From date"
                  />
                  <input
                    type="date"
                    className="input"
                    value={logsFilters.dateTo}
                    onChange={(e) => setLogsFilters(f => ({ ...f, dateTo: e.target.value }))}
                    style={{ width: 'min(130px, 100%)', padding: '0.45rem 0.6rem', fontSize: '0.875rem' }}
                    title="To date"
                  />
                  <button type="button" className="btn btn--primary btn--small" onClick={applyLogsFilters}>
                    Apply
                  </button>
                  <button type="button" className="btn btn--muted btn--small" onClick={clearLogsFilters}>
                    Clear
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                {logsLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading logs...</div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="documents-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th
                              style={{ width: '140px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                              onClick={() => handleLogsSort('created_at')}
                              title="Sort by timestamp"
                            >
                              Timestamp {logsSortBy === 'created_at' ? (logsSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th
                              style={{ width: '120px', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleLogsSort('user_name')}
                              title="Sort by user"
                            >
                              User {logsSortBy === 'user_name' ? (logsSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th
                              style={{ width: '80px', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleLogsSort('action')}
                              title="Sort by action"
                            >
                              Action {logsSortBy === 'action' ? (logsSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th
                              style={{ width: '90px', cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleLogsSort('module')}
                              title="Sort by module"
                            >
                              Module {logsSortBy === 'module' ? (logsSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none', minWidth: '120px' }}
                              onClick={() => handleLogsSort('record_summary')}
                              title="Sort by record"
                            >
                              Record / Resource {logsSortBy === 'record_summary' ? (logsSortOrder === 'asc' ? '↑' : '↓') : ''}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                                No log entries found.
                              </td>
                            </tr>
                          ) : (
                            sortedLogs.map(log => (
                              <tr key={log.id}>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                                  {formatDateTime(log.created_at)}
                                </td>
                                <td>{log.user_name || log.user_id || '—'}</td>
                                <td>
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      background:
                                        log.action === 'create'
                                          ? '#dcfce7'
                                          : log.action === 'edit'
                                            ? '#dbeafe'
                                            : '#fee2e2',
                                      color:
                                        log.action === 'create'
                                          ? '#166534'
                                          : log.action === 'edit'
                                            ? '#1e40af'
                                            : '#991b1b'
                                    }}
                                  >
                                    {log.action}
                                  </span>
                                </td>
                                <td>{log.module}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem' }} title={log.record_summary || ''}>
                                  {log.record_summary || log.record_id || '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {logsPagination.totalPages > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          borderTop: '1px solid #e5e7eb',
                          background: '#f9fafb',
                          flexShrink: 0
                        }}
                      >
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          Page {logsPagination.page} of {logsPagination.totalPages} ({logsPagination.total} total)
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn--small btn--muted"
                            disabled={logsPagination.page <= 1}
                            onClick={() => setLogsPagination(p => ({ ...p, page: p.page - 1 }))}
                          >
                            ← Previous
                          </button>
                          <button
                            type="button"
                            className="btn btn--small btn--muted"
                            disabled={logsPagination.page >= logsPagination.totalPages}
                            onClick={() => setLogsPagination(p => ({ ...p, page: p.page + 1 }))}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}

export default Settings

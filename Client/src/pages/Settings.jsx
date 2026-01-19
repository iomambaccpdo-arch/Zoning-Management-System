import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'

function Settings() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
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

  useEffect(() => {
    const loadSettings = () => {
      try {
        setIsLoading(true)
        const user = getCurrentUser()
        
        if (!user) {
          alert('⚠️ No user session found. Please log in again.')
          navigate('/login')
          setIsLoading(false)
          return
        }

        setCurrentUser(user)

        let allUsers = []
        try {
          const usersStr = localStorage.getItem('users')
          allUsers = usersStr ? JSON.parse(usersStr) : []
        } catch (e) {
          console.error('Error parsing users from localStorage:', e)
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
          // This allows the user to update their session info even if not in users array
          const sessionProfile = {
            ...user,
            name: user.name || '',
            firstName: '',
            lastName: '',
            designation: user.designation || '',
            section: user.section || '',
            role: user.role || '',
            username: user.username || '',
            email: user.email || '',
            password: '' // Can't retrieve password, will require re-entering current password
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
          setIsLoading(false)
          return
        }

        setUserProfile(profile)
        const fullName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.name || ''
        setFormData({
          userName: fullName,
          userDesignation: profile.designation || user.designation || '',
          userSection: profile.section || user.section || '',
          userRole: profile.role || user.role || '',
          currentUsername: profile.username || user.username || '',
          currentEmail: profile.email || user.email || '',
          newUsername: profile.username || user.username || '',
          newEmail: profile.email || user.email || ''
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading settings:', error)
        setHasError(true)
        setIsLoading(false)
        // Set a fallback profile so the page can still render
        const fallbackUser = getCurrentUser()
        if (fallbackUser) {
          setCurrentUser(fallbackUser)
          const fallbackProfile = {
            ...fallbackUser,
            name: fallbackUser.name || '',
            firstName: '',
            lastName: '',
            designation: fallbackUser.designation || '',
            section: fallbackUser.section || '',
            role: fallbackUser.role || '',
            username: fallbackUser.username || '',
            email: fallbackUser.email || '',
            password: ''
          }
          setUserProfile(fallbackProfile)
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
      }
    }
    
    loadSettings()
  }, [navigate])

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
    if (formData.confirmPassword.length === 0) {
      setPasswordMatch('')
      return
    }

    if (formData.newPassword === formData.confirmPassword) {
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

  const handleUpdate = (e) => {
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

      // Check password only if we have it stored
      if (userProfile && userProfile.password && userProfile.password !== formData.currentPassword) {
        alert('⚠️ Current password is incorrect.')
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        alert('⚠️ New passwords do not match.')
        return
      }

      if (formData.newPassword.length < 6) {
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

    setTimeout(() => {
      const userIndex = users.findIndex(u =>
        (u.username && u.username.toLowerCase() === (userProfile?.username || currentUser?.username || '').toLowerCase()) ||
        (u.email && u.email.toLowerCase() === (userProfile?.email || currentUser?.email || '').toLowerCase())
      )

      if (userIndex !== -1) {
        // User exists in users array - update it
        users[userIndex].username = formData.newUsername
        users[userIndex].email = formData.newEmail

        if (formData.newPassword) {
          users[userIndex].password = formData.newPassword
        }

        localStorage.setItem('users', JSON.stringify(users))
      } else {
        // User doesn't exist in users array - just update session
        console.warn('User not found in users array, updating session only')
      }

      // Always update the session (currentUser)
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
    }, 1500)
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
        window.location.reload()
      }

      okButton.addEventListener('click', closeModal)
      const keyHandler = (e) => {
        closeModal()
        document.removeEventListener('keydown', keyHandler)
      }
      document.addEventListener('keydown', keyHandler)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <main className="main">
          <div style={{ padding: '2em', textAlign: 'center' }}>
            <div>Loading user settings...</div>
            <div style={{ marginTop: '1em', fontSize: '0.9em', color: '#666' }}>
              Please wait...
            </div>
          </div>
        </main>
      </Layout>
    )
  }

  // No user - redirect handled in useEffect, but show fallback
  if (!currentUser) {
    return (
      <Layout>
        <main className="main">
          <div style={{ padding: '2em', textAlign: 'center' }}>Please log in to access settings.</div>
        </main>
      </Layout>
    )
  }

  // Ensure formData is initialized with currentUser data if empty
  useEffect(() => {
    if (currentUser && !userProfile && formData.userName === '' && formData.currentUsername === '') {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userProfile])

  return (
    <Layout>
      <main className="main">
        <header className="header">
          <h1>CPDO ZONING MANAGEMENT SYSTEM SETTINGS</h1>
          <div className="actions">
            <button className="btn" onClick={() => navigate(-1)}>← Back</button>
          </div>
        </header>

        <section className="section">
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
                <input className="input" type="text" id="userName" readOnly value={formData.userName || currentUser?.name || ''} />
              </div>
              <div>
                <label className="label">Designation</label>
                <input className="input" type="text" id="userDesignation" readOnly value={formData.userDesignation || currentUser?.designation || ''} />
              </div>
            </div>
            <div className="form__row">
              <div>
                <label className="label">Section</label>
                <input className="input" type="text" id="userSection" readOnly value={formData.userSection || currentUser?.section || ''} />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input" type="text" id="userRole" readOnly value={formData.userRole || currentUser?.role || ''} />
              </div>
            </div>
            <div className="spacer"></div>
            <h3 className="section__title" style={{ marginTop: 0 }}>Update Profile Information</h3>
            <div className="form__row">
              <div>
                <label className="label">Current Username</label>
                <input className="input" type="text" id="currentUsername" readOnly value={formData.currentUsername || currentUser?.username || ''} />
              </div>
              <div>
                <label className="label">New Username</label>
                <input
                  className="input"
                  type="text"
                  id="newUsername"
                  placeholder="Enter new username"
                  value={formData.newUsername}
                  onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
                />
              </div>
            </div>
            <div className="form__row">
              <div>
                <label className="label">Current Email</label>
                <input className="input" type="email" id="currentEmail" readOnly value={formData.currentEmail || currentUser?.email || ''} />
              </div>
              <div>
                <label className="label">New Email</label>
                <input
                  className="input"
                  type="email"
                  id="newEmail"
                  placeholder="Enter new email"
                  value={formData.newEmail}
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
      </main>
    </Layout>
  )
}

export default Settings

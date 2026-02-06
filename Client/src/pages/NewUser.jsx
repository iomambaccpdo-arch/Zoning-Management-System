import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'
import { usersAPI } from '../utils/api'

function NewUser() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    designation: 'CPCD',
    section: 'Plans',
    password: '',
    confirmPassword: '',
    role: 'User'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('Creating User...')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setShowModal(true)
      setIsLoading(false)
      setModalMessage('⚠️ Passwords do not match.')
      return
    }

    setShowModal(true)
    setIsLoading(true)
    setModalMessage('Creating User...')

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        designation: formData.designation,
        section: formData.section,
        role: formData.role,
        password: formData.password
      }

      await usersAPI.create(userData)

      setIsLoading(false)
      setModalMessage('✅ User Created Successfully!')
    } catch (error) {
      console.error('Error creating user:', error)
      setIsLoading(false)
      setModalMessage(`❌ Error: ${error.message || 'Failed to create user'}`)
    }
  }

  const handleOk = () => {
    if (!isLoading && modalMessage.includes('✅')) {
      navigate('/accounts')
    } else {
      setShowModal(false)
    }
  }

  return (
    <Layout>
      <main className="main">
        <header className="header">
          <h1>CPDO ZONING MANAGEMENT SYSTEM ACCOUNTS</h1>
          <div className="actions">
            <button className="btn" onClick={() => navigate(-1)}>← Back</button>
          </div>
        </header>

        <section className="section">
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__row">
              <div>
                <label className="label">First Name<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="text"
                  id="createFirstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Last Name<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="text"
                  id="createLastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Username<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="text"
                  id="createUsername"
                  name="username"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="email"
                  id="createEmail"
                  name="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Designation<span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="createDesignation"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                >
                  <option value="CPCD">CPDC</option>
                  <option value="Asst. CPDC">Asst. CPDC</option>
                  <option value="Section Head">Section Head</option>
                  <option value="Rank & File">Rank & File</option>
                </select>
              </div>
              <div>
                <label className="label">Section<span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="createSection"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                >
                  <option value="Plans">Plans</option>
                  <option value="M & E">M & E</option>
                  <option value="Zoning">Zoning</option>
                  <option value="UPMA">UPMA</option>
                  <option value="Admin">Administrative</option>
                </select>
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Password<span style={{ color: 'red' }}>*</span></label>
                <div className="password-wrapper">
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    id="createPassword"
                    name="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <span
                    className="toggle-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    role="button"
                    tabIndex={0}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password<span style={{ color: 'red' }}>*</span></label>
                <div className="password-wrapper">
                  <input
                    className="input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="createConfirmPassword"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <span
                    className="toggle-eye"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    role="button"
                    tabIndex={0}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Role<span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="createRole"
                  name="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="spacer"></div>
            <button className="btn btn--success" type="submit">💾 Create User</button>
          </form>
        </section>

        {/* Success Modal */}
        {showModal && (
          <div id="successModal" className={`modal ${showModal ? '' : 'hidden'}`} style={{ display: 'flex' }}>
            <div className="modal-content">
              {isLoading && <div className="loader"></div>}
              <h2 id="modalText">{modalMessage}</h2>
              {!isLoading && (
                <button id="okButton" className="btn btn--success" onClick={handleOk}>OK</button>
              )}
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}

export default NewUser

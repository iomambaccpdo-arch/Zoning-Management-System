import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../utils/auth'
import { authAPI } from '../utils/api'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    if (isLoggedIn()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      // Call API to login
      const response = await authAPI.login(username, password)

      // Login successful - store user session with token
      const userSession = {
        ...response.user,
        token: response.token,
        loginTime: new Date().toISOString()
      }

      if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(userSession))
      } else {
        sessionStorage.setItem('currentUser', JSON.stringify(userSession))
      }

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 600)
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      setErrorMessage(error.message || 'An error occurred. Please try again.')
    }
  }

  const togglePassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="brand">
            <img src="/Logo/CPDO LOGO.png" alt="CPDO" className="brand__logo" />
          </div>
          <h1>CPDO Zoning Management System</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="username">Username or Email</label>
            <input 
              className="input" 
              type="text" 
              id="username" 
              name="username" 
              placeholder="Enter your username or email"
              required 
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input 
                className="input" 
                type={showPassword ? "text" : "password"} 
                id="password" 
                name="password" 
                placeholder="Enter your password"
                required 
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span 
                className="toggle-eye" 
                onClick={togglePassword}
                role="button"
                tabIndex={0}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    togglePassword()
                  }
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                id="rememberMe" 
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          {errorMessage && (
            <div className={`error-message ${errorMessage ? 'show' : ''}`}>
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            className={`btn btn--primary btn--login ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            <span className="btn-text">{isLoading ? 'Signing in...' : 'Sign In'}</span>
            <span className="btn-loader"></span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

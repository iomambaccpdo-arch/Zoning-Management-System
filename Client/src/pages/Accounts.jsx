import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'

function Accounts() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    designation: '',
    section: '',
    role: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('users')) || []
    setUsers(allUsers)
  }

  const handleEdit = (index) => {
    const user = users[index]
    if (!user) return
    
    setEditingIndex(index)
    setEditForm({
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      designation: user.designation || '',
      section: user.section || '',
      role: user.role || 'User'
    })
    setShowEditModal(true)
  }

  const handleDelete = (index) => {
    const user = users[index]
    if (!user) return
    
    if (window.confirm(`Delete user ${user.firstName} ${user.lastName}?`)) {
      const updatedUsers = [...users]
      updatedUsers.splice(index, 1)
      localStorage.setItem('users', JSON.stringify(updatedUsers))
      loadUsers()
    }
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (editingIndex === null) return

    const fullName = editForm.name.trim()
    const [firstName, ...rest] = fullName.split(' ')
    const lastName = rest.join(' ')

    const updatedUsers = [...users]
    updatedUsers[editingIndex] = {
      ...updatedUsers[editingIndex],
      firstName: firstName || '',
      lastName: lastName || '',
      name: fullName,
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      designation: editForm.designation,
      section: editForm.section
    }

    if (editForm.password.trim()) {
      updatedUsers[editingIndex].password = editForm.password.trim()
    }

    localStorage.setItem('users', JSON.stringify(updatedUsers))
    setShowEditModal(false)
    setEditingIndex(null)
    setEditForm({ name: '', username: '', email: '', password: '', designation: '', section: '', role: '' })
    setShowSuccessPopup(true)
    setTimeout(() => setShowSuccessPopup(false), 2000)
    loadUsers()
  }

  return (
    <Layout>
      <main className="main">
        <header className="header">
          <h1>CPDO ZONING MANAGEMENT SYSTEM ACCOUNTS</h1>
          <div className="actions">
            <button className="btn" onClick={() => navigate(-1)}>← Back</button>
            <Link className="btn btn--success" to="/new-user">➕ Create New User</Link>
          </div>
        </header>

        <section className="section">
          <table className="table-basic">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Section</th>
                <th>Role</th>
                <th style={{ width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="accountsTableBody">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'gray' }}>No users found</td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.designation}</td>
                    <td>{user.section}</td>
                    <td>{user.role}</td>
                    <td>
                      <button className="btn btn--small btn--primary edit-btn" onClick={() => handleEdit(index)}>Edit</button>
                      <button className="btn btn--small btn--danger delete-btn" onClick={() => handleDelete(index)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal" id="editModal" style={{ display: 'flex' }}>
            <div className="modal__content">
              <h2>Edit User</h2>
              <form id="editForm" onSubmit={handleEditSubmit}>
                <label htmlFor="editName">Name</label>
                <input
                  type="text"
                  id="editName"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />

                <label htmlFor="editUsername">Username</label>
                <input
                  type="text"
                  id="editUsername"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />

                <label htmlFor="editEmail">Email</label>
                <input
                  type="email"
                  id="editEmail"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />

                <label htmlFor="editPassword">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="editPassword"
                    placeholder="Enter new password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
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

                <label htmlFor="editDesignation">Designation</label>
                <select
                  id="editDesignation"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                >
                  <option value="CPCD">CPDC</option>
                  <option value="Asst. CPDC">Asst. CPDC</option>
                  <option value="Section Head">Section Head</option>
                  <option value="Rank & File">Rank & File</option>
                </select>

                <label htmlFor="editSection">Section</label>
                <select
                  id="editSection"
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                >
                  <option value="Plans">Plans</option>
                  <option value="M & E">M & E</option>
                  <option value="Zoning">Zoning</option>
                  <option value="UPMA">UPMA</option>
                  <option value="Admin">Administrative</option>
                </select>

                <label htmlFor="editRole">Role</label>
                <select
                  id="editRole"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>

                <div className="modal__actions">
                  <button type="button" className="btn btn--muted" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn--success" style={{ backgroundColor: 'green', color: 'white' }}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="success-popup" id="successPopup" style={{ display: 'block' }}>
            ✅ User details updated successfully!
          </div>
        )}
      </main>
    </Layout>
  )
}

export default Accounts

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { usersAPI } from '../utils/api'

function Accounts() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [editingUserId, setEditingUserId] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    designation: '',
    section: '',
    role: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const allUsers = await usersAPI.getAll()
      setUsers(allUsers)
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (index) => {
    const user = users[index]
    if (!user) return

    setEditingUserId(user.id)
    setEditForm({
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || '',
      designation: user.designation || '',
      section: user.section || '',
      role: user.role || 'User'
    })
    setShowEditModal(true)
  }

  const handleDelete = async (index) => {
    const user = users[index]
    if (!user) return

    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'this user'
    if (!window.confirm(`Delete user ${displayName}?`)) return

    try {
      await usersAPI.delete(user.id)
      await loadUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert(`Error deleting user: ${err.message || 'Failed to delete'}`)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (editingUserId == null) return

    const fullName = editForm.name.trim()
    const [firstName, ...rest] = fullName.split(' ')
    const lastName = rest.join(' ')

    try {
      await usersAPI.update(editingUserId, {
        firstName: firstName || '',
        lastName: lastName || '',
        name: fullName,
        role: editForm.role,
        designation: editForm.designation,
        section: editForm.section
      })
      setShowEditModal(false)
      setEditingUserId(null)
      setEditForm({ name: '', designation: '', section: '', role: '' })
      setShowSuccessPopup(true)
      setTimeout(() => setShowSuccessPopup(false), 2000)
      await loadUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      alert(`Error updating user: ${err.message || 'Failed to update'}`)
    }
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
          {error && (
            <div style={{ padding: '1em', marginBottom: '1em', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
              {error}
            </div>
          )}
          {loading ? (
            <div style={{ padding: '2em', textAlign: 'center', color: '#64748b' }}>Loading users...</div>
          ) : (
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
                    <tr key={user.id || index}>
                      <td>{index + 1}</td>
                      <td>{user.first_name || ''} {user.last_name || ''}</td>
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
          )}
        </section>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal" id="editModal" style={{ display: 'flex' }}>
            <div className="modal__content">
              <h2>Edit User</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                Username, email, and password are managed in Settings or via a dedicated admin workflow.
              </p>
              <form id="editForm" onSubmit={handleEditSubmit}>
                <label htmlFor="editName">Name</label>
                <input
                  type="text"
                  id="editName"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />

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

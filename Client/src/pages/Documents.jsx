import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'

function Documents() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const monthFilter = searchParams.get('month')
  const [documents, setDocuments] = useState([])
  const [filteredDocs, setFilteredDocs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [areaUnit, setAreaUnit] = useState(localStorage.getItem('areaUnit') || 'sqm')
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, monthFilter, searchQuery])

  const loadDocuments = () => {
    let docs = JSON.parse(localStorage.getItem('documents')) || []
    docs.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0)
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0)
      return dateB - dateA
    })
    localStorage.setItem('documents', JSON.stringify(docs))
    setDocuments(docs)
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    // Filter by month if present
    if (monthFilter) {
      filtered = filtered.filter(doc => {
        const dateStr = doc.dateSort || doc.dateAdded || doc.dateCreated || new Date().toISOString()
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return false
        const docMonthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        return docMonthKey === monthFilter
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(doc =>
        Object.values(doc).some(value =>
          String(value).toLowerCase().includes(query)
        )
      )
    }

    setFilteredDocs(filtered)
  }

  const formatArea = (value) => {
    if (value === undefined || value === null || value === '') return ''
    const num = Number(String(value).replace(/,/g, ''))
    if (Number.isNaN(num)) return value
    if (areaUnit === 'sqm') return num.toLocaleString() + ' sqm'
    const sqft = Math.round(num * 10.7639)
    return sqft.toLocaleString() + ' sqft'
  }

  const handleDelete = (index) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    
    const originalIndex = documents.findIndex(doc => doc === filteredDocs[index])
    if (originalIndex === -1) return

    let updatedDocs = [...documents]
    updatedDocs.splice(originalIndex, 1)
    updatedDocs.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0)
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0)
      return dateB - dateA
    })
    localStorage.setItem('documents', JSON.stringify(updatedDocs))
    loadDocuments()
  }

  const handleEdit = (index) => {
    const originalIndex = documents.findIndex(doc => doc === filteredDocs[index])
    if (originalIndex === -1) return
    
    localStorage.setItem('editIndex', originalIndex)
    localStorage.setItem('editDocument', JSON.stringify(documents[originalIndex]))
    navigate('/new-document')
  }

  const toggleAreaUnit = () => {
    const newUnit = areaUnit === 'sqm' ? 'sqft' : 'sqm'
    setAreaUnit(newUnit)
    localStorage.setItem('areaUnit', newUnit)
  }

  const isViewerRole = currentUser && currentUser.role === 'Viewer'

  return (
    <Layout>
      <main className="main">
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1>{monthFilter ? `📑 Document Records - ${monthFilter}` : '📑 Document Records'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              id="searchInput"
              className="input"
              placeholder="🔍 Search documents..."
              style={{ width: '250px', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button id="areaUnitToggle" className="btn btn--muted btn--small" type="button" onClick={toggleAreaUnit}>
              {areaUnit}
            </button>
            {!isViewerRole && (
              <Link id="addNewBtn" className="btn btn--primary" to="/new-document">➕ Add New</Link>
            )}
          </div>
        </header>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Dates</th>
                <th>Document Title</th>
                <th>Type of Project</th>
                <th>Zoning Application No.</th>
                <th>Zoning</th>
                <th>Due Date</th>
                <th>Received By</th>
                <th>Assisted By</th>
                <th>Name of Applicant</th>
                <th>Routed To</th>
                <th>Location</th>
                <th>Floor Area</th>
                <th>Lot Area</th>
                <th>Floor</th>
                <th>Mezanine</th>
                <th>OIC</th>
                {!isViewerRole && <th>Actions</th>}
              </tr>
            </thead>
            <tbody id="documentTableBody">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={isViewerRole ? 16 : 17} style={{ textAlign: 'center', color: 'gray' }}>
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, index) => (
                  <tr key={index}>
                    <td>{doc.dateAdded || '—'}</td>
                    <td><span className="td-truncate" data-full={doc.title || ''}>{doc.title}</span></td>
                    <td><span className="td-truncate" data-full={doc.projectType || ''}>{doc.projectType}</span></td>
                    <td>{doc.znApp}</td>
                    <td><span className="td-truncate" data-full={doc.zoning || ''}>{doc.zoning}</span></td>
                    <td>{doc.dueDate}</td>
                    <td>{doc.receivedBy}</td>
                    <td>{doc.assistedBy}</td>
                    <td><span className="td-truncate" data-full={doc.applicantName || ''}>{doc.applicantName}</span></td>
                    <td>{doc.routedTo}</td>
                    <td><span className="td-truncate" data-full={doc.location || ''}>{doc.location}</span></td>
                    <td>{formatArea(doc.floorArea)}</td>
                    <td>{formatArea(doc.lotArea)}</td>
                    <td>{doc.storey ? ('Floor ' + doc.storey) : ''}</td>
                    <td>{doc.mezanine}</td>
                    <td>{doc.oic}</td>
                    {!isViewerRole && (
                      <td>
                        <button className="btn btn--small btn--primary edit-btn" onClick={() => handleEdit(index)}>✏️ Edit</button>
                        <button className="btn btn--small btn--danger delete-btn" onClick={() => handleDelete(index)}>🗑️ Delete</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </Layout>
  )
}

export default Documents

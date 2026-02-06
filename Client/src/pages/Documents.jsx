import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'
import { documentsAPI } from '../utils/api'
import { formatDateTime, formatDateOnly } from '../utils/dateFormat'

const HIGHLIGHT_DURATION_MS = 3000

function Documents() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const monthFilter = searchParams.get('month')
  const highlightDocIdFromUrl = searchParams.get('doc')
  const [documents, setDocuments] = useState([])
  const [filteredDocs, setFilteredDocs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [areaUnit, setAreaUnit] = useState(localStorage.getItem('areaUnit') || 'sqm')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [highlightedDocId, setHighlightedDocId] = useState(null)
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, monthFilter, searchQuery])

  // When we have ?doc=ID and filtered list is ready, highlight that document and scroll it into view
  useEffect(() => {
    if (!highlightDocIdFromUrl || filteredDocs.length === 0) return
    const exists = filteredDocs.some(d => String(d.id) === String(highlightDocIdFromUrl))
    if (exists) {
      setHighlightedDocId(highlightDocIdFromUrl)
    }
  }, [highlightDocIdFromUrl, filteredDocs])

  // Scroll highlighted row into view and clear highlight after a few seconds
  useEffect(() => {
    if (!highlightedDocId) return
    const el = document.getElementById(`doc-row-${highlightedDocId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    const t = setTimeout(() => setHighlightedDocId(null), HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(t)
  }, [highlightedDocId])

  const loadDocuments = async () => {
    try {
      const docs = await documentsAPI.getAll()
      // Sort by date_sort (already sorted by API, but ensure consistency)
      docs.sort((a, b) => {
        const dateA = a.date_sort ? new Date(a.date_sort) : new Date(a.date_added || 0)
        const dateB = b.date_sort ? new Date(b.date_sort) : new Date(b.date_added || 0)
        return dateB - dateA
      })
      setDocuments(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    }
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    // Filter by month if present
    if (monthFilter) {
      filtered = filtered.filter(doc => {
        const dateStr = doc.date_sort || doc.date_added || new Date().toISOString()
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

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    
    const doc = filteredDocs[index]
    if (!doc || !doc.id) {
      alert('Document not found')
      return
    }

    try {
      await documentsAPI.delete(doc.id)
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert(`Error deleting document: ${error.message || 'Failed to delete'}`)
    }
  }

  const handleEdit = (index) => {
    const doc = filteredDocs[index]
    if (!doc || !doc.id) return
    
    // Navigate to edit page with document ID
    navigate(`/new-document?edit=${doc.id}`)
  }

  const toggleAreaUnit = () => {
    const newUnit = areaUnit === 'sqm' ? 'sqft' : 'sqm'
    setAreaUnit(newUnit)
    localStorage.setItem('areaUnit', newUnit)
  }

  const openPreview = (doc) => setPreviewDoc(doc)
  const closePreview = () => setPreviewDoc(null)

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
                <Link
                id="addNewBtn"
                className="btn btn--primary"
                to="/new-document"
              >
                ➕ Add New
              </Link>
            )}
          </div>
        </header>

        <div className="table-container">
          <table className="documents-table">
            <thead>
              <tr>
                <th className="doc-col-date">Date</th>
                <th className="doc-col-title">Title</th>
                <th className="doc-col-type">Type</th>
                <th className="doc-col-zn">Zn App No.</th>
                <th className="doc-col-due">Due Date</th>
                <th className="doc-col-applicant">Applicant</th>
                <th className="doc-col-location">Location</th>
                <th className="doc-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody id="documentTableBody">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="documents-empty">
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, index) => (
                  <tr
                    key={doc.id || index}
                    id={doc.id ? `doc-row-${doc.id}` : undefined}
                    className={highlightedDocId && String(doc.id) === String(highlightedDocId) ? 'doc-row-highlight' : ''}
                  >
                    <td className="doc-col-date">{formatDateTime(doc.date_added || doc.dateAdded)}</td>
                    <td className="doc-col-title">
                      <span className="doc-cell-truncate" title={doc.title || ''}>{doc.title || '—'}</span>
                    </td>
                    <td className="doc-col-type">
                      <span className="doc-cell-truncate" title={doc.project_type || doc.projectType || ''}>{doc.project_type || doc.projectType || '—'}</span>
                    </td>
                    <td className="doc-col-zn">{doc.zn_app || doc.znApp || '—'}</td>
                    <td className="doc-col-due">{formatDateOnly(doc.due_date || doc.dueDate)}</td>
                    <td className="doc-col-applicant">
                      <span className="doc-cell-truncate" title={doc.applicant_name || doc.applicantName || ''}>{doc.applicant_name || doc.applicantName || '—'}</span>
                    </td>
                    <td className="doc-col-location">
                      <span className="doc-cell-truncate" title={doc.location || doc.landmark || ''}>{doc.location || doc.landmark || '—'}</span>
                    </td>
                    <td className="doc-col-actions">
                      <div className="doc-actions">
                        <button type="button" className="btn btn--small btn--muted" onClick={() => openPreview(doc)} title="View full details">👁️ Preview</button>
                        {!isViewerRole && (
                          <>
                            <button type="button" className="btn btn--small btn--primary" onClick={() => handleEdit(index)} title="Edit">✏️ Edit</button>
                            <button type="button" className="btn btn--small btn--danger" onClick={() => handleDelete(index)} title="Delete">🗑️ Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="documents-hint">Use <strong>Preview</strong> to see all details (zoning, received by, routed to, floor/lot area, OIC, etc.) without leaving the list.</p>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div
            className="document-preview-overlay"
            onClick={closePreview}
            role="dialog"
            aria-modal="true"
            aria-label="Document details"
          >
            <div
              className="document-preview-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="document-preview-header">
                <div className="document-preview-header-inner">
                  <span className="document-preview-icon" aria-hidden>📄</span>
                  <div>
                    <h2 className="document-preview-title">Document Details</h2>
                    <p className="document-preview-subtitle">{previewDoc.title || 'Untitled'}</p>
                  </div>
                </div>
                <button type="button" className="document-preview-close" onClick={closePreview} aria-label="Close">
                  <span aria-hidden>✕</span>
                </button>
              </div>
              <div className="document-preview-body">
                <DocumentPreviewContent doc={previewDoc} formatArea={formatArea} />
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}

function DocumentPreviewContent({ doc, formatArea }) {
  let routedToDisplay = doc.routed_to
  if (typeof doc.routed_to === 'string') {
    try {
      const parsed = JSON.parse(doc.routed_to)
      routedToDisplay = Array.isArray(parsed) ? parsed.join(', ') : parsed
    } catch {
      routedToDisplay = doc.routed_to
    }
  } else if (Array.isArray(doc.routed_to)) {
    routedToDisplay = doc.routed_to.join(', ')
  }

  const sections = [
    {
      title: 'Overview',
      fields: [
        { label: 'Document Title', value: doc.title || '—' },
        { label: 'Type of Project', value: doc.project_type || doc.projectType || '—' },
        { label: 'Zoning Application No.', value: doc.zn_app || doc.znApp || '—' },
        { label: 'Zoning', value: doc.zoning || '—' }
      ]
    },
    {
      title: 'Dates',
      fields: [
    { label: 'Date Added', value: formatDateTime(doc.date_added || doc.dateAdded) },
    { label: 'Date of Application', value: formatDateOnly(doc.date_of_application || doc.dateOfApplication) },
    { label: 'Due Date', value: formatDateOnly(doc.due_date || doc.dueDate) }
      ]
    },
    {
      title: 'People & routing',
      fields: [
        { label: 'Received By', value: doc.received_by || doc.receivedBy || '—' },
        { label: 'Assisted By', value: doc.assisted_by || doc.assistedBy || '—' },
        { label: 'Name of Applicant', value: doc.applicant_name || doc.applicantName || '—' },
        { label: 'Routed To', value: routedToDisplay ?? '—' },
        { label: 'OIC', value: doc.oic || '—' }
      ]
    },
    {
      title: 'Location',
      fields: [
        { label: 'Location / Landmark', value: [doc.location, doc.landmark].filter(Boolean).join(' · ') || '—' },
        { label: 'Barangay', value: doc.barangay || '—' },
        { label: 'Purok', value: doc.purok || '—' }
      ]
    },
    {
      title: 'Property details',
      fields: [
        { label: 'Floor Area', value: formatArea(doc.floor_area || doc.floorArea) || '—' },
        { label: 'Lot Area', value: formatArea(doc.lot_area || doc.lotArea) || '—' },
        { label: 'Storey', value: doc.storey ? `Floor ${doc.storey}` : '—' },
        { label: 'Mezanine', value: doc.mezanine || '—' }
      ]
    }
  ]

  return (
    <div className="document-preview-sections">
      {sections.map(({ title, fields }) => (
        <section key={title} className="document-preview-section">
          <h3 className="document-preview-section-title">{title}</h3>
          <div className="document-preview-grid">
            {fields.map(({ label, value }) => (
              <div key={label} className="document-preview-field">
                <span className="document-preview-label">{label}</span>
                <span className="document-preview-value">{value}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default Documents

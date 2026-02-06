import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'
import { documentsAPI } from '../utils/api'
import { formatDateTime } from '../utils/dateFormat'

function Dashboard() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

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

  const renderMonthCards = () => {
    const monthGroups = {}
    documents.forEach(doc => {
      const dateStr = doc.date_sort || doc.date_added || new Date().toISOString()
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return
      
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = []
      }
      monthGroups[monthKey].push(doc)
    })

    const sortedMonths = Object.keys(monthGroups).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateB - dateA
    })

    // Get available years
    const years = Array.from(new Set(sortedMonths.map(monthKey => {
      const date = new Date(monthKey)
      return date.getFullYear()
    }).filter(y => y > 1970 && !isNaN(y)))).sort((a, b) => b - a)

    // Filter by year if selected
    let monthsToShow = sortedMonths
    if (selectedYear) {
      const selectedYearNum = parseInt(selectedYear)
      monthsToShow = sortedMonths.filter(monthKey => {
        const date = new Date(monthKey)
        return date.getFullYear() === selectedYearNum
      })
    } else {
      monthsToShow = sortedMonths.slice(0, 12)
    }

    if (monthsToShow.length === 0) {
      return (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2em', color: '#666' }}>
          No documents found.{' '}
            <Link
              to="/new-document"
              style={{ color: '#2563eb' }}
            >
              Create your first document
            </Link>
        </div>
      )
    }

    return (
      <>
        {years.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em', gap: '1em' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em', fontWeight: '500', color: '#374151' }}>
              <span>Year:</span>
              <select
                className="input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: '0.5em 1em', fontSize: '0.95em', border: '1px solid #d1d5db', borderRadius: '0.5em', background: '#fff', minWidth: '120px' }}
              >
                <option value="">All Years</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        {monthsToShow.map(monthKey => {
          const docs = monthGroups[monthKey]
          const count = docs.length
          return (
            <Link
              key={monthKey}
              to={`/documents?month=${encodeURIComponent(monthKey)}`}
              className="month-card-link"
            >
              <div className="month-card">
                <div className="month-card__title">
                  Documents for :<br /><strong>{monthKey}</strong>
                </div>
                <div className="month-card__meta">
                  {count} Document{count !== 1 ? 's' : ''}<br />(C) City Planning Development Office
                </div>
              </div>
            </Link>
          )
        })}
      </>
    )
  }

  const renderRecentFiles = () => {
    let allFiles = []
    documents.forEach((doc, docIdx) => {
      if (!doc.files || !Array.isArray(doc.files) || doc.files.length === 0) return
      
      const dateAdded = doc.date_added || new Date().toISOString()
      doc.files.forEach((file, fileIdx) => {
        allFiles.push({
          fileName: file.fileName || file.file_name,
          dateAdded,
          dateSort: doc.date_sort || new Date(dateAdded).toISOString(),
          docIdx,
          fileIdx,
          doc,
          fileId: file.id
        })
      })
    })

    allFiles.sort((a, b) => {
      const dateA = new Date(a.dateSort)
      const dateB = new Date(b.dateSort)
      return dateB - dateA
    })

    const recentFiles = allFiles.slice(0, 5)

    if (recentFiles.length === 0) {
      return (
        <div className="table__row" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1em', color: '#666' }}>
          No files uploaded yet
        </div>
      )
    }

    return recentFiles.map((file, idx) => {
      let formattedDate = formatDateTime(file.dateSort || file.dateAdded)

      return (
        <div
          key={idx}
          className="table__row"
          style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
          onClick={() => viewFile(file.docIdx, file.fileIdx, file.fileName)}
        >
          <div style={{ color: '#166534', fontWeight: '500' }}>{file.fileName}</div>
          <div>{formattedDate}</div>
        </div>
      )
    })
  }

  const viewFile = async (docIdx, fileIdx, fileName) => {
    const doc = documents[docIdx]
    if (!doc || !doc.files || !doc.files[fileIdx]) {
      alert('File not found.')
      return
    }

    const file = doc.files[fileIdx]
    const actualFileName = file.fileName || file.file_name
    const documentTitle = doc.title || null

    // If file has data, use it; otherwise fetch from API
    if (file.fileData) {
      const dataUrl = `data:${file.fileType || file.file_type};base64,${file.fileData}`
      if (file.fileType?.startsWith('text/') || file.file_type?.startsWith('text/')) {
        try {
          const text = atob(file.fileData)
          showFileModal(actualFileName, text, dataUrl, actualFileName, documentTitle)
        } catch {
          showFileModal(actualFileName, '[Could not preview text file]', dataUrl, actualFileName, documentTitle)
        }
      } else if (file.fileType?.startsWith('image/') || file.file_type?.startsWith('image/')) {
        const content = `<img src="${dataUrl}" alt="${actualFileName}" style="max-width: 100%; max-height: 60vh; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />`
        showFileModal(actualFileName, content, dataUrl, actualFileName, documentTitle)
      } else if (file.fileType === 'application/pdf' || file.file_type === 'application/pdf') {
        const content = `<embed src="${dataUrl}" type="application/pdf" width="100%" height="500px" style="border-radius: 8px; box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);" />`
        showFileModal(actualFileName, content, dataUrl, actualFileName, documentTitle)
      } else {
        const content = `<div style="text-align: center; padding: 2em;">
          <p style="color: #6b7280; margin-bottom: 1em;">Preview not supported for this file type.</p>
          <p style="color: #374151; font-weight: 500;">File: ${actualFileName}</p>
        </div>`
        showFileModal(actualFileName, content, dataUrl, actualFileName, documentTitle)
      }
    } else if (file.id) {
      // Fetch file from API and build preview from response
      try {
        const { filesAPI } = await import('../utils/api')
        const fetched = await filesAPI.getById(file.id)
        const data = fetched.fileData
        const mimeType = fetched.fileType || fetched.file_type || 'application/octet-stream'
        if (!data) {
          showFileModal(actualFileName, `No file data available for: ${actualFileName}`, null, null, documentTitle)
          return
        }
        const dataUrl = `data:${mimeType};base64,${data}`
        let content
        if (mimeType.startsWith('text/')) {
          try {
            const text = atob(data)
            content = text
            showFileModal(actualFileName, content, dataUrl, actualFileName, documentTitle)
          } catch {
            showFileModal(actualFileName, '[Could not preview text file]', dataUrl, actualFileName, documentTitle)
          }
        } else if (mimeType.startsWith('image/')) {
          content = `<img src="${dataUrl}" alt="${actualFileName}" style="max-width: 100%; max-height: 60vh; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />`
          showFileModal(actualFileName, content, dataUrl, actualFileName, documentTitle)
        } else if (mimeType === 'application/pdf') {
          content = `<embed src="${dataUrl}" type="application/pdf" width="100%" height="500px" style="border-radius: 8px; box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);" />`
          showFileModal(actualFileName, content, dataUrl, actualFileName, documentTitle)
        } else {
          content = `<div style="text-align: center; padding: 2em;">
          <p style="color: #6b7280; margin-bottom: 1em;">Preview not supported for this file type.</p>
          <p style="color: #374151; font-weight: 500;">File: ${actualFileName}</p>
        </div>`
          showFileModal(actualFileName, content, dataUrl, actualFileName, documentTitle)
        }
      } catch (error) {
        showFileModal(actualFileName, `Error loading file: ${error.message}`, null, null, documentTitle)
      }
    } else {
      const content = `This is a placeholder preview for file: ${actualFileName}\n\n(No file data found)`
      showFileModal(actualFileName, content, null, null, documentTitle)
    }
  }

  const showFileModal = (fileTitle, content, downloadUrl = null, fileName = null, documentTitle = null) => {
    // Create modal if it doesn't exist
    let modal = document.getElementById('dashboardFileModal')
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'dashboardFileModal'
      modal.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:1000;display:flex;justify-content:center;align-items:center;'
      modal.innerHTML = `
        <div class="file-preview-modal__box" style="background:#fff;max-width:90vw;max-height:90vh;width:800px;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.2);position:relative;display:flex;flex-direction:column;overflow:hidden;">
          <div class="file-preview-modal__header" style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:20px 48px 20px 24px;flex-shrink:0;">
            <button id="closeDashboardFileModal" style="position:absolute;top:16px;right:16px;font-size:22px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;color:#fff;width:36px;height:36px;border-radius:8px;line-height:1;padding:0;">✖</button>
            <h2 id="dashboardFileModalTitle" style="margin:0;font-size:1.25rem;font-weight:600;color:#fff;word-break:break-word;line-height:1.3;"></h2>
            <div id="dashboardFileModalDocTitle" style="margin-top:6px;font-size:0.875rem;color:rgba(255,255,255,0.85);display:none;"></div>
          </div>
          <div id="dashboardFileModalContent" style="flex:1;overflow:auto;margin:0;padding:20px;white-space:pre-wrap;font-family:system-ui;font-size:14px;background:#f9fafb;min-height:200px;max-height:calc(90vh - 180px);"></div>
          <div style="margin:0;padding:16px 24px;flex-shrink:0;display:flex;gap:8px;justify-content:flex-end;background:#fff;border-top:1px solid #e5e7eb;">
            <button id="dashboardFileModalDownload" class="btn btn--primary" style="display:none;">⬇️ Download</button>
            <button id="dashboardFileModalClose" class="btn btn--muted">Close</button>
          </div>
        </div>
      `
      document.body.appendChild(modal)
      
      document.getElementById('closeDashboardFileModal').addEventListener('click', hideFileModal)
      document.getElementById('dashboardFileModalClose').addEventListener('click', hideFileModal)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideFileModal()
      })
    }

    document.getElementById('dashboardFileModalTitle').textContent = fileTitle || 'File preview'
    const docTitleEl = document.getElementById('dashboardFileModalDocTitle')
    if (documentTitle) {
      docTitleEl.textContent = `From document: ${documentTitle}`
      docTitleEl.style.display = 'block'
    } else {
      docTitleEl.textContent = ''
      docTitleEl.style.display = 'none'
    }
    const contentDiv = document.getElementById('dashboardFileModalContent')
    const downloadBtn = document.getElementById('dashboardFileModalDownload')

    if (/<(img|a|br|span|div|p|strong|em|b|i|h[1-6]|embed|iframe)\b/i.test(content)) {
      contentDiv.innerHTML = content
    } else {
      contentDiv.textContent = content
    }

    if (downloadUrl && fileName) {
      downloadBtn.style.display = 'inline-flex'
      downloadBtn.onclick = () => {
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        setTimeout(() => document.body.removeChild(a), 100)
      }
    } else {
      downloadBtn.style.display = 'none'
    }

    modal.style.display = 'flex'
  }

  const hideFileModal = () => {
    const modal = document.getElementById('dashboardFileModal')
    if (modal) {
      modal.style.display = 'none'
    }
  }

  const currentUser = getCurrentUser()
  const canCreateDocument = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'User')

  return (
    <Layout>
      <main className="main">
        <header className="header">
          <h1>CPDO ZONING MANAGEMENT SYSTEM DASHBOARD</h1>
          {canCreateDocument && (
            <Link
              className="btn btn--primary"
              to="/new-document"
              onClick={() => {
                // Clear any edit state
              }}
            >
              ➕ New Document
            </Link>
          )}
        </header>

        <section className="section">
          <h2 className="section__title">Document / Months</h2>
          <div className="grid grid--4">
            {renderMonthCards()}
          </div>
        </section>

        <section className="section">
          <h2 className="section__title">Recent Files</h2>
          <div className="table">
            <div className="table__head">
              <div>Filename</div>
              <div>Date Uploaded</div>
            </div>
            {renderRecentFiles()}
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default Dashboard

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'
import { documentsAPI, filesAPI } from '../utils/api'
import { formatDateTime } from '../utils/dateFormat'

function Files() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    filterFiles()
  }, [files, searchQuery, selectedYear])

  const loadFiles = async () => {
    try {
      const docs = await documentsAPI.getAll()
      docs.sort((a, b) => {
        const dateA = a.date_sort ? new Date(a.date_sort) : new Date(a.date_added || 0)
        const dateB = b.date_sort ? new Date(b.date_sort) : new Date(b.date_added || 0)
        return dateB - dateA
      })

      let allFiles = []
      docs.forEach((doc, docIdx) => {
        if (!doc.files || !Array.isArray(doc.files) || doc.files.length === 0) return
        const date = formatDateTime(doc.date_added || doc.dateAdded)
        doc.files.forEach((file, fileIdx) => {
          allFiles.push({
            fileName: file.fileName || file.file_name,
            docIdx,
            fileIdx,
            docTitle: doc.title || 'Untitled',
            date,
            doc,
            fileId: file.id
          })
        })
      })

      setFiles(allFiles)
    } catch (error) {
      console.error('Error loading files:', error)
      setFiles([])
    }
  }

  const filterFiles = () => {
    let filtered = files.filter(f => {
      const matchesSearch = !searchQuery || 
        f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.docTitle.toLowerCase().includes(searchQuery.toLowerCase())
      
      const dateToCheck = f.doc.date_sort ? new Date(f.doc.date_sort) : new Date(f.doc.date_added || f.date)
      const fileYear = dateToCheck.getFullYear()
      const matchesYear = !selectedYear || (fileYear === parseInt(selectedYear))
      
      return matchesSearch && matchesYear
    })

    setFilteredFiles(filtered)
  }

  const handleDownload = async (docIdx, fileIdx) => {
    const file = filteredFiles.find(f => f.docIdx === docIdx && f.fileIdx === fileIdx)
    if (!file || !file.fileId) {
      alert('File not found')
      return
    }

    try {
      await filesAPI.download(file.fileId)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert(`Error downloading file: ${error.message || 'Failed to download'}`)
    }
  }

  const downloadPlaceholder = (fileName) => {
    const blob = new Blob([`This is a placeholder for file: ${fileName}\n\nNote: The actual file data was not stored.`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  const handleDelete = async (docIdx, fileIdx) => {
    const file = filteredFiles.find(f => f.docIdx === docIdx && f.fileIdx === fileIdx)
    if (!file || !file.fileId) {
      alert('File not found')
      return
    }
    if (!window.confirm(`Remove "${file.fileName}" from this document? This cannot be undone.`)) return

    try {
      await filesAPI.delete(file.fileId)
      await loadFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      alert(`Error deleting file: ${error.message || 'Failed to delete'}`)
    }
  }

  const viewFile = async (docIdx, fileIdx) => {
    const file = filteredFiles.find(f => f.docIdx === docIdx && f.fileIdx === fileIdx)
    if (!file || !file.fileId) {
      alert('File not found')
      return
    }

    try {
      const fileData = await filesAPI.getById(file.fileId)
      const fileName = fileData.fileName
      const fileType = fileData.fileType
      const dataUrl = fileData.fileData ? `data:${fileType};base64,${fileData.fileData}` : null

      const documentTitle = file.docTitle || file.doc?.title || null
      if (dataUrl) {
        if (fileType?.startsWith('text/')) {
          try {
            const text = atob(fileData.fileData)
            showFileModal(fileName, text, documentTitle)
          } catch {
            showFileModal(fileName, '[Could not preview text file]', documentTitle)
          }
        } else if (fileType?.startsWith('image/')) {
          const content = `<img src="${dataUrl}" alt="${fileName}" style="max-width:100%;max-height:40vh;display:block;margin:auto;" />`
          showFileModal(fileName, content, documentTitle)
        } else if (fileType === 'application/pdf') {
          const content = `<embed src="${dataUrl}" type="application/pdf" width="100%" height="400px" style="border-radius:0.5em;box-shadow:0 1px 8px #0001;" />` +
            `<div style="margin-top:1em;"><a href="${dataUrl}" download="${fileName}" class="btn btn--primary">Download PDF</a></div>`
          showFileModal(fileName, content, documentTitle)
        } else {
          const content = `<a href="${dataUrl}" download="${fileName}" class="btn btn--primary" style="margin:1em auto;display:block;width:max-content;">Download file</a><br><span style="color:#888;">Preview not supported for this file type.</span>`
          showFileModal(fileName, content, documentTitle)
        }
      } else {
        const content = `This is a placeholder preview for file: ${fileName}\n\n(No file data found)`
        showFileModal(fileName, content, documentTitle)
      }
    } catch (error) {
      console.error('Error loading file:', error)
      showFileModal(file.fileName, `Error loading file: ${error.message}`, file.docTitle || null)
    }
  }

  const showFileModal = (fileTitle, content, documentTitle = null) => {
    let modal = document.getElementById('fileViewModal')
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'fileViewModal'
      modal.style.cssText = 'display:none;position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:1000;'
      modal.innerHTML = `
        <div class="file-preview-modal__box" style="background:#fff;max-width:560px;margin:7vh auto;padding:0;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.15);position:relative;overflow:hidden;">
          <div class="file-preview-modal__header" style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:20px 48px 20px 24px;">
            <button id="closeFileModalBtn" style="position:absolute;top:16px;right:16px;font-size:22px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;color:#fff;width:36px;height:36px;border-radius:8px;line-height:1;padding:0;">✖</button>
            <h2 id="fileModalTitle" style="margin:0;font-size:1.25rem;font-weight:600;color:#fff;word-break:break-word;line-height:1.3;"></h2>
            <div id="fileModalDocTitle" style="margin-top:6px;font-size:0.875rem;color:rgba(255,255,255,0.8);display:none;"></div>
          </div>
          <div id="fileModalContent" style="margin:0;padding:1.25em;white-space:pre-wrap;max-height:50vh;overflow:auto;font-family:monospace;font-size:0.9375rem;background:#f8fafc;"></div>
        </div>
      `
      document.body.appendChild(modal)
      
      document.getElementById('closeFileModalBtn').addEventListener('click', () => {
        modal.style.display = 'none'
      })
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none'
      })
    }

    document.getElementById('fileModalTitle').textContent = fileTitle || 'File preview'
    const docTitleEl = document.getElementById('fileModalDocTitle')
    if (documentTitle) {
      docTitleEl.textContent = `From document: ${documentTitle}`
      docTitleEl.style.display = 'block'
    } else {
      docTitleEl.textContent = ''
      docTitleEl.style.display = 'none'
    }
    const contentDiv = document.getElementById('fileModalContent')
    if (/<(img|a|br|span|div|p|strong|em|b|i|h[1-6])\b/i.test(content)) {
      contentDiv.innerHTML = content
    } else {
      contentDiv.textContent = content
    }
    modal.style.display = 'block'
  }

  const years = Array.from(new Set(files.map(f => {
    const dateToCheck = f.doc.date_sort ? new Date(f.doc.date_sort) : new Date(f.doc.date_added || f.date)
    return dateToCheck.getFullYear()
  }).filter(y => y > 1970 && !isNaN(y)))).sort((a, b) => b - a)

  const isViewerRole = currentUser && currentUser.role === 'Viewer'

  return (
    <Layout>
      <main className="main">
        <header className="header">
          <h1>CPDO ZONING MANAGEMENT SYSTEM Files</h1>
          <div className="actions">
            <button className="btn" onClick={() => navigate(-1)}>← Back</button>
            {!isViewerRole && (
              <Link
                className="btn btn--primary"
                to="/new-document"
              >
                ➕ Create New
              </Link>
            )}
          </div>
        </header>

        <section className="section">
          <div className="header" style={{ margin: '0 0 8px 0' }}>
            <h2 className="section__title" style={{ margin: 0 }}>Files Records</h2>
          </div>
          <div className="file-filter-row" style={{ display: 'flex', gap: '0.5em', marginBottom: '1.5em', alignItems: 'center', background: '#f8fafc', padding: '1em 1em 1em 0.5em', borderRadius: '0.75em', boxShadow: '0 1px 4px 0 #0001' }}>
            <div style={{ position: 'relative', flex: '2 1 220px' }}>
              <input
                type="text"
                id="fileSearchBar"
                className="input file-search-input"
                placeholder="🔍 Search files..."
                style={{ width: '100%', padding: '0.6em 1em', fontSize: '1em', border: '1px solid #d1d5db', borderRadius: '0.5em', background: '#fff' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em', fontWeight: '500', color: '#374151', fontSize: '0.95em' }}>
                <span>Year:</span>
                <select
                  className="input file-year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ padding: '0.6em 1em', fontSize: '1em', border: '1px solid #d1d5db', borderRadius: '0.5em', background: '#fff', minWidth: '120px' }}
                >
                  <option value="">All Years</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="filegrid">
            {filteredFiles.length === 0 ? (
              <div className="muted" style={{ padding: '2em', textAlign: 'center' }}>No files uploaded yet.</div>
            ) : (
              filteredFiles.map((f, idx) => (
                <div
                  key={f.fileId || idx}
                  className="filecard"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => viewFile(f.docIdx, f.fileIdx)}
                >
                  <div className="filecard__date">{f.date}</div>
                  <div className="filecard__title">{f.fileName}</div>
                  <div className="filecard__meta">From: <span>{f.docTitle}</span></div>
                  <div className="filecard__actions">
                    <button
                      className="btn btn--muted btn--small file-download"
                      title="Download"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(f.docIdx, f.fileIdx)
                      }}
                    >
                      ⬇️ Download
                    </button>
                    {!isViewerRole && (
                      <button
                        className="btn btn--danger btn--small file-delete"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(f.docIdx, f.fileIdx)
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                    <Link
                    className="filecard__link"
                    to={(() => {
                      const d = f.doc.date_sort || f.doc.date_added
                      const monthKey = d ? (() => {
                        const date = new Date(d)
                        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                      })() : ''
                      const params = new URLSearchParams()
                      if (monthKey) params.set('month', monthKey)
                      params.set('doc', String(f.doc.id))
                      return `/documents?${params.toString()}`
                    })()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    → View Document
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default Files

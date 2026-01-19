import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../utils/auth'

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

  const loadFiles = () => {
    let docs = JSON.parse(localStorage.getItem('documents')) || []
    docs.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0)
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0)
      return dateB - dateA
    })

    let allFiles = []
    docs.forEach((doc, docIdx) => {
      if (!doc.fileNames || !Array.isArray(doc.fileNames) || doc.fileNames.length === 0) return
      const date = doc.dateAdded || doc.dateCreated || ''
      doc.fileNames.forEach((fileName, fileIdx) => {
        allFiles.push({
          fileName,
          docIdx,
          fileIdx,
          docTitle: doc.title || 'Untitled',
          date,
          doc
        })
      })
    })

    setFiles(allFiles)
  }

  const filterFiles = () => {
    let filtered = files.filter(f => {
      const matchesSearch = !searchQuery || 
        f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.docTitle.toLowerCase().includes(searchQuery.toLowerCase())
      
      const dateToCheck = f.doc.dateSort ? new Date(f.doc.dateSort) : new Date(f.date)
      const fileYear = dateToCheck.getFullYear()
      const matchesYear = !selectedYear || (fileYear === parseInt(selectedYear))
      
      return matchesSearch && matchesYear
    })

    setFilteredFiles(filtered)
  }

  const handleDownload = (docIdx, fileIdx) => {
    const docs = JSON.parse(localStorage.getItem('documents')) || []
    const doc = docs[docIdx]
    if (!doc || !doc.fileNames || !doc.fileNames[fileIdx]) return
    
    const fileName = doc.fileNames[fileIdx]
    let fileObj = null
    if (doc.files && Array.isArray(doc.files) && doc.files[fileIdx]) {
      fileObj = doc.files[fileIdx]
    } else if (doc.files && Array.isArray(doc.files)) {
      fileObj = doc.files.find(f => f.name === fileName)
    }

    if (fileObj && fileObj.data) {
      fetch(fileObj.data)
        .then(res => res.blob())
        .then(blob => {
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
        })
        .catch(() => {
          downloadPlaceholder(fileName)
        })
    } else {
      downloadPlaceholder(fileName)
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

  const handleDelete = (docIdx, fileIdx) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return
    
    const docs = JSON.parse(localStorage.getItem('documents')) || []
    const doc = docs[docIdx]
    if (!doc || !doc.fileNames || !doc.fileNames[fileIdx]) return
    
    doc.fileNames.splice(fileIdx, 1)
    if (doc.files && Array.isArray(doc.files)) {
      doc.files.splice(fileIdx, 1)
    }
    
    localStorage.setItem('documents', JSON.stringify(docs))
    loadFiles()
  }

  const viewFile = (docIdx, fileIdx) => {
    const docs = JSON.parse(localStorage.getItem('documents')) || []
    const doc = docs[docIdx]
    if (!doc || !doc.fileNames || !doc.fileNames[fileIdx]) return
    
    const fileName = doc.fileNames[fileIdx]
    let fileObj = (doc.files && Array.isArray(doc.files)) ? doc.files.find(f => f.name === fileName) : null
    
    if (fileObj && fileObj.data && fileObj.type) {
      if (fileObj.type.startsWith('text/')) {
        fetch(fileObj.data)
          .then(res => res.text())
          .then(text => showFileModal(fileName, text))
          .catch(() => showFileModal(fileName, '[Could not preview text file]'))
      } else if (fileObj.type.startsWith('image/')) {
        const content = `<img src="${fileObj.data}" alt="${fileName}" style="max-width:100%;max-height:40vh;display:block;margin:auto;" />`
        showFileModal(fileName, content)
      } else if (fileObj.type === 'application/pdf') {
        const content = `<embed src="${fileObj.data}" type="application/pdf" width="100%" height="400px" style="border-radius:0.5em;box-shadow:0 1px 8px #0001;" />` +
          `<div style="margin-top:1em;"><a href="${fileObj.data}" download="${fileName}" class="btn btn--primary">Download PDF</a></div>`
        showFileModal(fileName, content)
      } else {
        const content = `<a href="${fileObj.data}" download="${fileName}" class="btn btn--primary" style="margin:1em auto;display:block;width:max-content;">Download file</a><br><span style="color:#888;">Preview not supported for this file type.</span>`
        showFileModal(fileName, content)
      }
    } else {
      const content = `This is a placeholder preview for file: ${fileName}\n\n(No file data found)`
      showFileModal(fileName, content)
    }
  }

  const showFileModal = (title, content) => {
    let modal = document.getElementById('fileViewModal')
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'fileViewModal'
      modal.style.cssText = 'display:none;position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:1000;'
      modal.innerHTML = `
        <div style="background:#fff;max-width:520px;margin:7vh auto;padding:2em 2em 1.5em 2em;border-radius:1em;box-shadow:0 2px 16px #0002;position:relative;">
          <button id="closeFileModalBtn" style="position:absolute;top:1em;right:1em;font-size:1.2em;background:none;border:none;cursor:pointer;">✖</button>
          <h2 id="fileModalTitle" style="margin-top:0;font-size:1.2em;"></h2>
          <div id="fileModalContent" style="margin:1em 0 0 0;white-space:pre-wrap;max-height:45vh;overflow:auto;font-family:monospace;font-size:1em;background:#f8fafc;padding:1em;border-radius:0.5em;"></div>
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

    document.getElementById('fileModalTitle').textContent = title
    const contentDiv = document.getElementById('fileModalContent')
    if (/<(img|a|br|span|div|p|strong|em|b|i|h[1-6])\b/i.test(content)) {
      contentDiv.innerHTML = content
    } else {
      contentDiv.textContent = content
    }
    modal.style.display = 'block'
  }

  const years = Array.from(new Set(files.map(f => {
    const dateToCheck = f.doc.dateSort ? new Date(f.doc.dateSort) : new Date(f.date)
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
              <Link className="btn btn--primary" to="/new-document">➕ Create New</Link>
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
                  key={idx}
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
                    to={`/documents?doc=${f.docIdx}`}
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

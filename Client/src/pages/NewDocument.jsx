import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import MultiSelect from '../components/MultiSelect'
import { getCurrentUser } from '../utils/auth'
import { documentsAPI, usersAPI } from '../utils/api'

function NewDocument() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const fileInputRef = useRef(null)
  const zoningSelectRef = useRef(null)
  const projectTypeSelectRef = useRef(null)

  // Form mode: 'create' | 'edit'
  const [mode, setMode] = useState(editId ? 'edit' : 'create')
  
  const [formData, setFormData] = useState({
    title: '',
    zoning: '',
    znApplication: '',
    projectType: '',
    dateOfApplication: '',
    dueDate: '',
    receivedBy: '',
    assistedBy: '',
    applicantName: '',
    routedTo: [],
    floorArea: '',
    barangay: '',
    purok: '',
    lotArea: '',
    storey: '',
    landmark: '',
    mezanine: '',
    oic: ''
  })

  const [zoningData, setZoningData] = useState({})
  const [barangayPurokData, setBarangayPurokData] = useState({})
  const [users, setUsers] = useState([])
  const [routedOptions, setRoutedOptions] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [existingFiles, setExistingFiles] = useState([])
  const [editingId, setEditingId] = useState(editId || null)

  const resetForm = () => {
    setFormData({
      title: '',
      zoning: '',
      znApplication: '',
      projectType: '',
      dateOfApplication: '',
      dueDate: '',
      receivedBy: '',
      assistedBy: '',
      applicantName: '',
      routedTo: [],
      floorArea: '',
      barangay: '',
      purok: '',
      lotArea: '',
      storey: '',
      landmark: '',
      mezanine: '',
      oic: ''
    })
    setSelectedFiles([])
    setExistingFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    const loadEditDocument = async () => {
      if (editId) {
        try {
          const editDoc = await documentsAPI.getById(editId)
          setEditingId(editId)
          setMode('edit')
          
          // Load existing files
          if (editDoc.files && Array.isArray(editDoc.files) && editDoc.files.length > 0) {
            // Convert API file format to form format
            const formattedFiles = editDoc.files.map(f => ({
              id: f.id,
              name: f.fileName || f.file_name,
              type: f.fileType || f.file_type,
              data: f.fileData ? `data:${f.fileType || f.file_type};base64,${f.fileData}` : null
            }))
            setExistingFiles(formattedFiles)
          }
          
          populateEditForm(editDoc)
        } catch (error) {
          console.error('Error loading document for edit:', error)
          alert('Error loading document. Redirecting to create mode.')
          navigate('/new-document')
        }
      } else {
        setMode('create')
        setEditingId(null)
        resetForm()
      }
    }

    loadEditDocument()
    loadZoningData()
    loadBarangayPurokData()
    loadUsers()
    setInitialDates()
  }, [editId, navigate])

  // Removed - edit document is loaded in main useEffect

  const loadZoningData = async () => {
    try {
      const response = await fetch('/Data/Zoning Ordinance.json')
      const data = await response.json()
      
      let currentZoning = ''
      const parsedData = {}
      
      data.forEach(item => {
        const zoning = item.ZONING?.trim() || ''
        const projectType = item['Type of Project']?.trim() || ''
        
        if (zoning) {
          currentZoning = zoning
          if (!parsedData[currentZoning]) {
            parsedData[currentZoning] = []
          }
          if (projectType) {
            parsedData[currentZoning].push(projectType)
          }
        } else if (projectType && currentZoning) {
          if (!parsedData[currentZoning]) {
            parsedData[currentZoning] = []
          }
          if (!parsedData[currentZoning].includes(projectType)) {
            parsedData[currentZoning].push(projectType)
          }
        }
      })
      
      setZoningData(parsedData)
    } catch (error) {
      console.error('Error loading zoning data:', error)
    }
  }

  const loadBarangayPurokData = async () => {
    try {
      const response = await fetch('/Data/Purok Name per Barangay.json')
      const data = await response.json()
      
      let currentBarangay = null
      const parsedData = {}
      
      data.forEach(item => {
        const barangay = item.BARANGAY?.trim()
        const purok = item.PUROK?.trim()
        
        if (barangay && barangay !== '') {
          currentBarangay = barangay
          if (!parsedData[currentBarangay]) {
            parsedData[currentBarangay] = []
          }
        } else if (currentBarangay && purok && purok !== '') {
          if (!parsedData[currentBarangay].includes(purok)) {
            parsedData[currentBarangay].push(purok)
          }
        }
      })
      
      setBarangayPurokData(parsedData)
    } catch (error) {
      console.error('Error loading barangay/purok data:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const allUsers = await usersAPI.getAll()
      setUsers(allUsers)
      
      const options = allUsers
        .filter(u => u.email)
        .map(user => ({
          value: user.email,
          label: `${user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username} (${user.email})`,
          name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
          email: user.email
        }))
      
      setRoutedOptions(options)
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
      setRoutedOptions([])
    }
  }

  const setInitialDates = () => {
    const today = new Date()
    const formattedDate = formatLongDate(today)
    const dueDate = formatLongDate(addWorkingDays(today, 12))
    
    setFormData(prev => ({
      ...prev,
      dateOfApplication: formattedDate,
      dueDate: dueDate
    }))
  }

  const addWorkingDays = (startDate, daysToAdd) => {
    let current = new Date(startDate)
    let addedDays = 0
    while (addedDays < daysToAdd) {
      current.setDate(current.getDate() + 1)
      const day = current.getDay()
      if (day !== 0 && day !== 6) addedDays++
    }
    return current
  }

  const formatLongDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const generateZoningNumber = (title) => {
    const prefix = (title.includes('LC') || title.includes('Zoning') || title.includes('Development')) ? 'LC' : 'XX'
    const year = new Date().getFullYear()
    const key = `${prefix}-${year}-counter`
    let counter = parseInt(localStorage.getItem(key)) || 0
    counter++
    localStorage.setItem(key, counter)
    const seq = counter.toString().padStart(4, '0')
    return `${prefix}-${year}-${seq}`
  }

  const populateEditForm = (doc) => {
    // Guarantee required readOnly fields are never empty (prevents submit being blocked)
    const today = new Date()
    const fallbackDate = formatLongDate(today)
    const fallbackDue = formatLongDate(addWorkingDays(today, 12))

    // Parse routedTo - could be JSON string, array, or single value
    let routedToValue = []
    if (doc.routed_to || doc.routedTo) {
      const routedTo = doc.routed_to || doc.routedTo
      if (typeof routedTo === 'string') {
        try {
          const parsed = JSON.parse(routedTo)
          routedToValue = Array.isArray(parsed) ? parsed : [parsed]
        } catch (e) {
          routedToValue = [routedTo]
        }
      } else if (Array.isArray(routedTo)) {
        routedToValue = routedTo
      } else {
        routedToValue = [routedTo]
      }
    }

    setFormData({
      title: doc.title || '',
      zoning: doc.zoning || '',
      znApplication: doc.zn_app || doc.znApp || '',
      projectType: doc.project_type || doc.projectType || '',
      dateOfApplication: doc.date_of_app || doc.dateOfApp || fallbackDate,
      dueDate: doc.due_date || doc.dueDate || fallbackDue,
      receivedBy: doc.received_by || doc.receivedBy || '',
      assistedBy: doc.assisted_by || doc.assistedBy || '',
      applicantName: doc.applicant_name || doc.applicantName || '',
      routedTo: routedToValue,
      floorArea: doc.floor_area || doc.floorArea || '',
      barangay: doc.barangay || (doc.location ? doc.location.split(',')[0]?.trim() : ''),
      purok: doc.purok || (doc.location ? doc.location.split(',')[1]?.trim() : ''),
      lotArea: doc.lot_area || doc.lotArea || '',
      storey: doc.storey || '',
      landmark: doc.landmark || '',
      mezanine: doc.mezanine || '',
      oic: doc.oic || ''
    })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const processFiles = (files) => {
    if (!files.length) return
    const filesWithData = []
    let processed = 0

    files.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        filesWithData[idx] = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result
        }
        processed++
        if (processed === files.length) {
          setSelectedFiles(prev => [...prev, ...filesWithData])
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingFile = (index) => {
    const file = existingFiles[index]
    const name = file?.name || file?.fileName || 'this file'
    if (!window.confirm(`Remove "${name}" from the document? It will be permanently deleted when you save.`)) return
    setExistingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('dragover')
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('dragover')
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFiles(files)
      const dataTransfer = new DataTransfer()
      files.forEach(f => dataTransfer.items.add(f))
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.routedTo.length === 0) {
      alert('⚠️ Please select at least one recipient for "Routed to" field.')
      return
    }

    const totalFiles = existingFiles.length + selectedFiles.length
    if (totalFiles === 0) {
      alert('⚠️ Please attach at least one file before saving.')
      return
    }

    // Prepare files for API (convert to base64)
    // Only include new files - existing files are already in the database
    // The backend will handle keeping existing files when we don't send files array
    // But since backend deletes all files and re-inserts, we need to include all files
    const allFiles = [...existingFiles, ...selectedFiles]
    const filesForAPI = await Promise.all(allFiles.map(async (f) => {
      // If file already has base64 data, extract it
      if (f.data && f.data.startsWith('data:')) {
        const base64 = f.data.split(',')[1]
        return {
          name: f.name,
          type: f.type,
          size: f.size || 0,
          data: base64
        }
      } else if (f.data && typeof f.data === 'string') {
        // Already base64 string
        return {
          name: f.name,
          type: f.type,
          size: f.size || 0,
          data: f.data
        }
      } else if (f.id) {
        // Existing file - fetch its data from API
        try {
          const { filesAPI } = await import('../utils/api')
          const fileData = await filesAPI.getById(f.id)
          return {
            name: fileData.fileName,
            type: fileData.fileType,
            size: fileData.fileSize || 0,
            data: fileData.fileData
          }
        } catch (error) {
          console.error('Error fetching existing file data:', error)
          // Fallback: return file info without data (backend might handle this)
          return {
            name: f.name,
            type: f.type,
            size: f.size || 0
          }
        }
      } else {
        // No data available
        return {
          name: f.name,
          type: f.type,
          size: f.size || 0
        }
      }
    }))

    const documentData = {
      title: formData.title,
      projectType: formData.projectType,
      znApp: formData.znApplication,
      zoning: formData.zoning,
      dateOfApp: formData.dateOfApplication,
      dueDate: formData.dueDate,
      receivedBy: formData.receivedBy,
      assistedBy: formData.assistedBy,
      applicantName: formData.applicantName,
      routedTo: formData.routedTo,
      location: `${formData.barangay}, ${formData.purok}`,
      barangay: formData.barangay,
      purok: formData.purok,
      floorArea: formData.floorArea,
      lotArea: formData.lotArea,
      storey: formData.storey,
      mezanine: formData.mezanine,
      oic: formData.oic,
      landmark: formData.landmark,
      files: filesForAPI
    }

    try {
      if (editingId) {
        await documentsAPI.update(editingId, documentData)
      } else {
        await documentsAPI.create(documentData)
      }
      alert('✅ Document successfully saved!')
      navigate('/documents')
    } catch (error) {
      console.error('Error saving document:', error)
      alert(`Error saving document: ${error.message || 'Failed to save'}`)
    }
  }

  const handleTitleChange = (e) => {
    const title = e.target.value
    setFormData({ ...formData, title, znApplication: title ? generateZoningNumber(title) : '' })
  }

  const handleZoningChange = (e) => {
    const zoning = e.target.value
    setFormData({ ...formData, zoning, projectType: '' })
  }

  const handleDateChange = (e) => {
    const dateValue = e.target.value
    if (dateValue) {
      const selectedDate = new Date(dateValue)
      const newDueDate = formatLongDate(addWorkingDays(selectedDate, 12))
      setFormData({ ...formData, dateOfApplication: dateValue, dueDate: newDueDate })
    }
  }

  const handleBarangayChange = (e) => {
    const barangay = e.target.value
    setFormData({ ...formData, barangay, purok: '' })
  }

  const sortedZonings = Object.keys(zoningData).sort()
  const projectTypes = formData.zoning && zoningData[formData.zoning] ? zoningData[formData.zoning].filter(pt => pt.trim() !== '') : []
  const sortedBarangays = Object.keys(barangayPurokData).sort()
  const puroks = formData.barangay && barangayPurokData[formData.barangay] ? [...barangayPurokData[formData.barangay]].sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '999')
    const numB = parseInt(b.match(/\d+/)?.[0] || '999')
    if (numA !== numB) return numA - numB
    return a.localeCompare(b)
  }) : []

  const names = users.map(u => u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username).filter(Boolean)

  return (
    <Layout>
      <main className="main">
        <header className="header">
          <h1>{mode === 'edit' ? 'Edit Document' : 'Create New Document'}</h1>
          <div className="actions document-upload-area" id="uploadArea" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <label htmlFor="fileInput" className="btn btn--success" style={{ cursor: 'pointer' }}>
              ⬆️ Upload files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="fileInput"
              style={{ display: 'none' }}
              multiple
              onChange={handleFileChange}
            />
            <div className="document-file-list">
              {existingFiles.length === 0 && selectedFiles.length === 0 && (
                <span className="document-file-list-empty">No file attached. Upload one or more files.</span>
              )}
              {existingFiles.map((f, i) => (
                <div key={f.id ? `ex-${f.id}` : `ex-${i}-${f.name}`} className="document-file-item document-file-item--existing">
                  <span className="document-file-item-name" title={f.name}>📎 {f.name}</span>
                  <button type="button" className="document-file-item-remove" onClick={() => removeExistingFile(i)} title="Remove file" aria-label="Remove file">×</button>
                </div>
              ))}
              {selectedFiles.map((f, i) => (
                <div key={`new-${i}-${f.name}`} className="document-file-item document-file-item--new">
                  <span className="document-file-item-name" title={f.name}>📄 {f.name}</span>
                  <button type="button" className="document-file-item-remove" onClick={() => removeNewFile(i)} title="Remove file" aria-label="Remove file">×</button>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="section">
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__row">
              <div>
                <label className="label">Document Title <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                >
                  <option value="" disabled>Select Document Title</option>
                  <option value="LC Area">LC Area</option>
                  <option value="LC Buildin">LC Building</option>
                  <option value="LC Subdivision">LC Subdivision</option>
                  <option value="LC LZBA Area">LC LZBA Area</option>
                  <option value="LC LZBA Building">LC LZBA Building</option>
                  <option value="LC LZBA Subdivision">LC LZBA Subdivision</option>
                  <option value="Zoning Clearance ">Zoning Clearance</option>
                  <option value="Development Permit">Development Permit</option>
                </select>
              </div>
              <div>
                <label className="label">Zoning <span style={{ color: 'red' }}>*</span></label>
                <select
                  ref={zoningSelectRef}
                  className="input"
                  id="zoningSelect"
                  name="zoning"
                  required
                  value={formData.zoning}
                  onChange={handleZoningChange}
                >
                  <option value="" disabled>Select Zoning</option>
                  {sortedZonings.map(zoning => (
                    <option key={zoning} value={zoning}>{zoning}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Zoning Application No. <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="text"
                  name="znApplication"
                  readOnly
                  required
                  value={formData.znApplication}
                />
              </div>
              <div>
                <label className="label">Type of Project <span style={{ color: 'red' }}>*</span></label>
                <select
                  ref={projectTypeSelectRef}
                  className="input"
                  id="projectTypeSelect"
                  name="projectType"
                  required
                  disabled={!formData.zoning}
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                >
                  <option value="" disabled>Select Type of Project</option>
                  {projectTypes.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label" htmlFor="dateOfApplication">Date of Application <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="text"
                  id="dateOfApplication"
                  name="dateOfApplication"
                  readOnly
                  required
                  value={formData.dateOfApplication}
                />
              </div>
              <div>
                <label className="label" htmlFor="dueDate">Due Date (Auto 12 Working Days) <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="text"
                  id="dueDate"
                  name="dueDate"
                  readOnly
                  required
                  value={formData.dueDate}
                />
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Received By<span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="receivedSelect"
                  required
                  value={formData.receivedBy}
                  onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                >
                  <option value="" disabled>Received by</option>
                  {names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Assisted By</label>
                <select
                  className="input"
                  id="assistedSelect"
                  value={formData.assistedBy}
                  onChange={(e) => setFormData({ ...formData, assistedBy: e.target.value })}
                >
                  <option value="">-----</option>
                  {names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Name of Applicant <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="text"
                  name="applicantName"
                  required
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Routed to<span style={{ color: 'red' }}>*</span></label>
                {routedOptions.length > 0 ? (
                  <MultiSelect
                    containerId="routedSelectWrapper"
                    options={{
                      options: routedOptions,
                      placeholder: 'Search by name or email...',
                      required: true,
                      searchKeys: ['name', 'email', 'label'],
                      name: 'routedTo'
                    }}
                    value={formData.routedTo}
                    onChange={(values) => {
                      setFormData({ ...formData, routedTo: values })
                    }}
                  />
                ) : (
                  <div className="input" style={{ padding: '10px', color: '#6b7280' }}>
                    Loading users... (Please ensure users exist in Accounts)
                  </div>
                )}
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Floor Area (square meter) <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="number"
                  name="floorArea"
                  required
                  value={formData.floorArea}
                  onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Barangay<span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="barangaySelect"
                  required
                  value={formData.barangay}
                  onChange={handleBarangayChange}
                >
                  <option value="" disabled>Select Barangay</option>
                  {sortedBarangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Lot Area (square meter)<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="number"
                  name="lotArea"
                  required
                  value={formData.lotArea}
                  onChange={(e) => setFormData({ ...formData, lotArea: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Purok<span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="purokSelect"
                  required
                  disabled={!formData.barangay}
                  value={formData.purok}
                  onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                >
                  <option value="" disabled>Select Purok</option>
                  {puroks.map(purok => (
                    <option key={purok} value={purok}>{purok}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Storey (Number of Floors)<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="number"
                  name="storey"
                  required
                  value={formData.storey}
                  onChange={(e) => setFormData({ ...formData, storey: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Landmark<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  id="landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
              </div>
            </div>

            <div className="form__row">
              <div>
                <label className="label">Mezanine<span style={{ color: 'red' }}>*</span></label>
                <input
                  className="input"
                  type="number"
                  name="mezanine"
                  required
                  value={formData.mezanine}
                  onChange={(e) => setFormData({ ...formData, mezanine: e.target.value })}
                />
              </div>
              <div>
                <label className="label">OIC<span style={{ color: 'red' }}>*</span></label>
                <select
                  className="input"
                  id="oicSelect"
                  required
                  value={formData.oic}
                  onChange={(e) => setFormData({ ...formData, oic: e.target.value })}
                >
                  <option value="" disabled>Select OIC</option>
                  {names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form__row form__row--center">
              <button className="btn btn--primary" type="submit">Submit Document</button>
              <button className="btn" type="button" onClick={() => navigate(-1)}>← Back</button>
            </div>
          </form>
        </section>
      </main>
    </Layout>
  )
}

export default NewDocument

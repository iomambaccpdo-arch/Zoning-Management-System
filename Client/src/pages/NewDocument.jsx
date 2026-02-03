import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import MultiSelect from '../components/MultiSelect'
import { getCurrentUser } from '../utils/auth'

function NewDocument() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const zoningSelectRef = useRef(null)
  const projectTypeSelectRef = useRef(null)

  // Form mode: 'create' | 'edit'
  // This prevents the "last edited document" from leaking into New Document.
  const [mode, setMode] = useState(() => localStorage.getItem('documentFormMode') || 'create')
  
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
  const [fileNames, setFileNames] = useState('No file attached')
  const [editIndex, setEditIndex] = useState(null)

  const clearEditState = () => {
    localStorage.removeItem('editIndex')
    localStorage.removeItem('editDocument')
  }

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
    setFileNames('No file attached')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    // Decide behavior based on explicit mode
    const currentMode = localStorage.getItem('documentFormMode') || 'create'
    setMode(currentMode)

    if (currentMode === 'edit') {
      const editIdx = localStorage.getItem('editIndex')
      const editDoc = JSON.parse(localStorage.getItem('editDocument') || 'null')
      if (editDoc && editIdx !== null) {
        setEditIndex(parseInt(editIdx))
        if (editDoc.files && Array.isArray(editDoc.files) && editDoc.files.length > 0) {
          setExistingFiles(editDoc.files)
          displayAllFiles(editDoc.files, [])
        } else if (editDoc.fileNames && Array.isArray(editDoc.fileNames)) {
          const placeholderFiles = editDoc.fileNames.map(name => ({ name, type: '', data: '' }))
          setExistingFiles(placeholderFiles)
          displayAllFiles(placeholderFiles, [])
        }
      } else {
        // invalid edit state -> fall back to create
        clearEditState()
        localStorage.setItem('documentFormMode', 'create')
        setMode('create')
        setEditIndex(null)
        resetForm()
      }
    } else {
      // create mode -> always clear edit cache and reset form
      clearEditState()
      setEditIndex(null)
      resetForm()
    }

    loadZoningData()
    loadBarangayPurokData()
    loadUsers()
    setInitialDates()
  }, [])

  useEffect(() => {
    if (editIndex !== null) {
      const editDoc = JSON.parse(localStorage.getItem('editDocument') || 'null')
      if (editDoc) {
        populateEditForm(editDoc)
      }
    }
  }, [editIndex, zoningData, barangayPurokData, users])

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

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('users')) || []
    setUsers(allUsers)
    
    const options = allUsers
      .filter(u => u.email)
      .map(user => ({
        value: user.email,
        label: `${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username} (${user.email})`,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        email: user.email
      }))
    
    setRoutedOptions(options)
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
    if (doc.routedTo) {
      if (typeof doc.routedTo === 'string') {
        try {
          const parsed = JSON.parse(doc.routedTo)
          routedToValue = Array.isArray(parsed) ? parsed : [parsed]
        } catch (e) {
          routedToValue = [doc.routedTo]
        }
      } else if (Array.isArray(doc.routedTo)) {
        routedToValue = doc.routedTo
      } else {
        routedToValue = [doc.routedTo]
      }
    }

    setFormData({
      title: doc.title || '',
      zoning: doc.zoning || '',
      znApplication: doc.znApp || '',
      projectType: doc.projectType || '',
      dateOfApplication: doc.dateOfApp || fallbackDate,
      dueDate: doc.dueDate || fallbackDue,
      receivedBy: doc.receivedBy || '',
      assistedBy: doc.assistedBy || '',
      applicantName: doc.applicantName || '',
      routedTo: routedToValue,
      floorArea: doc.floorArea || '',
      barangay: doc.location ? doc.location.split(',')[0]?.trim() : '',
      purok: doc.location ? doc.location.split(',')[1]?.trim() : '',
      lotArea: doc.lotArea || '',
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
    const filesWithData = []
    let processed = 0

    files.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        filesWithData[idx] = {
          name: file.name,
          type: file.type,
          data: e.target.result
        }
        processed++
        if (processed === files.length) {
          setSelectedFiles(filesWithData)
          displayAllFiles(existingFiles, filesWithData)
        }
      }
      reader.readAsDataURL(file)
    })
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

  const displayAllFiles = (existing, selected) => {
    const existingNames = existing.map(f => f.name || f)
    const selectedNames = selected.map(f => f.name || f)
    const allNames = [...existingNames, ...selectedNames]

    if (allNames.length === 0) {
      setFileNames('No file attached')
      return
    }

    if (allNames.length === 1) {
      const isExisting = existingNames.includes(allNames[0])
      setFileNames(`${isExisting ? '📎' : '📄'} ${allNames[0]}${isExisting ? ' <span style="color:#6b7280;font-size:0.85em;">(existing)</span>' : ''}`)
    } else {
      let html = `📂 ${allNames.length} files:<br>`
      if (existingNames.length > 0) {
        html += '<div style="margin-top:4px;color:#6b7280;font-size:0.9em;">Existing files:</div>'
        existingNames.forEach(name => {
          html += `• 📎 ${name}<br>`
        })
      }
      if (selectedNames.length > 0) {
        if (existingNames.length > 0) {
          html += '<div style="margin-top:4px;color:#16a34a;font-size:0.9em;">New files:</div>'
        }
        selectedNames.forEach(name => {
          html += `• 📄 ${name}<br>`
        })
      }
      setFileNames(html)
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

    // Wait for files to be processed
    const allFiles = [...existingFiles, ...selectedFiles]
    const allFileNames = allFiles.map(f => f.name || f)

    const now = new Date()
    let docs = JSON.parse(localStorage.getItem('documents')) || []
    const originalDoc = editIndex !== null ? docs[editIndex] : null
    
    const newDoc = {
      dateAdded: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      dateSort: originalDoc?.dateSort || now.toISOString(),
      title: formData.title,
      projectType: formData.projectType,
      znApp: formData.znApplication,
      zoning: formData.zoning,
      dateOfApp: formData.dateOfApplication,
      dueDate: formData.dueDate,
      receivedBy: formData.receivedBy,
      assistedBy: formData.assistedBy,
      applicantName: formData.applicantName,
      routedTo: JSON.stringify(formData.routedTo),
      location: `${formData.barangay}, ${formData.purok}`,
      floorArea: formData.floorArea,
      lotArea: formData.lotArea,
      storey: formData.storey,
      mezanine: formData.mezanine,
      oic: formData.oic,
      landmark: formData.landmark,
      fileNames: allFileNames,
      files: allFiles
    }

    if (editIndex !== null) {
      docs[editIndex] = newDoc
      localStorage.removeItem('editIndex')
      localStorage.removeItem('editDocument')
    } else {
      docs.unshift(newDoc)
    }

    // After save, always return to create mode
    localStorage.setItem('documentFormMode', 'create')

    docs.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0)
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0)
      return dateB - dateA
    })

    localStorage.setItem('documents', JSON.stringify(docs))
    localStorage.removeItem('latestUploadFiles')
    alert('✅ Document successfully saved!')
    navigate('/documents')
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

  const names = users.map(u => u.name).filter(Boolean)

  return (
    <Layout>
      <main className="main">
        <header className="header">
          <h1>Create New Document</h1>
          <div className="actions" id="uploadArea" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <label htmlFor="fileInput" className="btn btn--success" style={{ cursor: 'pointer' }}>
              ⬆️ Upload
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="fileInput"
              style={{ display: 'none' }}
              multiple
              onChange={handleFileChange}
            />
            <span className="muted" id="fileName" dangerouslySetInnerHTML={{ __html: fileNames }}></span>
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

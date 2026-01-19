document.addEventListener("DOMContentLoaded", () => {

  // ==========================
  // ZONING AND TYPE OF PROJECT DEPENDENT DROPDOWNS
  // ==========================
  let zoningData = {}; // Will store mapping of ZONING -> [Type of Project]
  const zoningSelect = document.getElementById("zoningSelect");
  const projectTypeSelect = document.getElementById("projectTypeSelect");
  let zoningSearchableSelect = null;
  let projectTypeSearchableSelect = null;

  // Load and parse Zoning Ordinance data
  async function loadZoningData() {
    try {
      const response = await fetch("Data/Zoning Ordinance.json".replace(/ /g, "%20"));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Parse the data: when ZONING is empty, it belongs to the previous non-empty ZONING
      let currentZoning = "";
      const parsedData = {};
      
      data.forEach(item => {
        const zoning = item.ZONING?.trim() || "";
        const projectType = item["Type of Project"]?.trim() || "";
        
        if (zoning) {
          // New zoning category
          currentZoning = zoning;
          if (!parsedData[currentZoning]) {
            parsedData[currentZoning] = [];
          }
          // If there's also a project type in the same entry, add it
          if (projectType) {
            parsedData[currentZoning].push(projectType);
          }
        } else if (projectType && currentZoning) {
          // Project type belongs to current zoning
          parsedData[currentZoning].push(projectType);
        }
      });
      
      zoningData = parsedData;
      
      // Populate Zoning dropdown
      if (zoningSelect) {
        const sortedZonings = Object.keys(zoningData).sort();
        sortedZonings.forEach(zoning => {
          const option = document.createElement("option");
          option.value = zoning;
          option.textContent = zoning;
          zoningSelect.appendChild(option);
        });
        
        // Initialize searchable select for Zoning after options are populated
        if (zoningSelect.classList.contains('searchable-select') && !zoningSelect.dataset.manualInit) {
          zoningSelect.dataset.manualInit = 'true';
          zoningSearchableSelect = new SearchableSelect(zoningSelect, {
            placeholder: 'Select Zoning',
            searchPlaceholder: 'Search zoning...'
          });
        } else if (zoningSearchableSelect) {
          // Update if already initialized
          zoningSearchableSelect.updateOptions();
        }
      }
      
      // Dispatch event when data is loaded
      window.dispatchEvent(new CustomEvent('zoningDataLoaded'));
    } catch (error) {
      console.error("Error loading zoning data:", error);
    }
  }

  // Handle Zoning selection change
  if (zoningSelect && projectTypeSelect) {
    zoningSelect.addEventListener("change", () => {
      const selectedZoning = zoningSelect.value;
      
      // Clear and disable Type of Project dropdown
      projectTypeSelect.innerHTML = '<option value="" disabled selected>Select Type of Project</option>';
      
      if (selectedZoning && zoningData[selectedZoning]) {
        // Enable and populate Type of Project dropdown
        projectTypeSelect.disabled = false;
        
        const projectTypes = zoningData[selectedZoning].filter(pt => pt.trim() !== "");
        projectTypes.forEach(projectType => {
          const option = document.createElement("option");
          option.value = projectType;
          option.textContent = projectType;
          projectTypeSelect.appendChild(option);
        });
        
        // Initialize or update searchable select for Type of Project
        if (projectTypeSelect.classList.contains('searchable-select')) {
          if (!projectTypeSearchableSelect) {
            projectTypeSelect.dataset.manualInit = 'true';
            projectTypeSearchableSelect = new SearchableSelect(projectTypeSelect, {
              placeholder: 'Select Type of Project',
              searchPlaceholder: 'Search project type...'
            });
          } else {
            projectTypeSearchableSelect.updateOptions();
            projectTypeSearchableSelect.setDisabled(false);
          }
        }
      } else {
        projectTypeSelect.disabled = true;
        if (projectTypeSearchableSelect) {
          projectTypeSearchableSelect.setDisabled(true);
        }
      }
    });
  }

  // Load zoning data on page load
  loadZoningData();

  // ==========================
  // PREFILL WHEN EDITING
  // ==========================
  let editIndex = localStorage.getItem("editIndex");
  const editDocument = JSON.parse(localStorage.getItem("editDocument"));

  // Convert the string "null" to actual null if needed
  if (editIndex === "null" || editIndex === undefined) {
    editIndex = null;
  }

  // ✅ Prefill only if actually editing and we have a valid document
  if (editDocument && editIndex !== null) {
    // helper: try name first, then id
    const titleEl = document.querySelector('[name="title"], #title');
    if (titleEl) titleEl.value = editDocument.title || '';

    const znEl = document.querySelector('[name="znApplication"], #znApplication');
    if (znEl) znEl.value = editDocument.znApp || '';

    // Handle Zoning and Type of Project dropdowns
    const setZoningAndProjectType = () => {
      if (zoningData && Object.keys(zoningData).length > 0) {
        const savedZoning = editDocument.zoning || '';
        const savedProjectType = editDocument.projectType || '';
        
        if (savedZoning && zoningSelect) {
          // Set zoning value
          if (zoningSearchableSelect) {
            zoningSearchableSelect.setValue(savedZoning);
          } else {
            zoningSelect.value = savedZoning;
          }
          
          // Trigger change to populate project types
          zoningSelect.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Set project type after a short delay to allow dropdown to populate
          setTimeout(() => {
            if (savedProjectType && projectTypeSelect) {
              // Try to find exact match first
              const exactMatch = Array.from(projectTypeSelect.options).find(
                opt => opt.value === savedProjectType
              );
              if (exactMatch) {
                if (projectTypeSearchableSelect) {
                  projectTypeSearchableSelect.setValue(savedProjectType);
                } else {
                  projectTypeSelect.value = savedProjectType;
                }
              } else {
                // Try to find partial match
                const partialMatch = Array.from(projectTypeSelect.options).find(
                  opt => opt.value.includes(savedProjectType) || savedProjectType.includes(opt.value)
                );
                if (partialMatch) {
                  if (projectTypeSearchableSelect) {
                    projectTypeSearchableSelect.setValue(partialMatch.value);
                  } else {
                    projectTypeSelect.value = partialMatch.value;
                  }
                }
              }
            }
          }, 300);
        }
      } else {
        // If data not loaded yet, wait and try again
        setTimeout(setZoningAndProjectType, 100);
      }
    };
    
    // Wait for zoning data to load
    window.addEventListener('zoningDataLoaded', setZoningAndProjectType, { once: true });
    // Also try immediately in case data is already loaded
    setTimeout(setZoningAndProjectType, 500);

    const dateOfAppEl = document.getElementById('dateOfApplication') || document.querySelector("[name='dateOfApplication']");
    if (dateOfAppEl) dateOfAppEl.value = editDocument.dateOfApp || '';

    const dueDateEl = document.getElementById('dueDate') || document.querySelector("[name='dueDate']");
    if (dueDateEl) dueDateEl.value = editDocument.dueDate || '';

    const receivedEl = document.getElementById('receivedSelect') || document.querySelector("[name='receivedBy']");
    if (receivedEl) receivedEl.value = editDocument.receivedBy || '';

    const assistedEl = document.getElementById('assistedSelect') || document.querySelector("[name='assistedBy']");
    if (assistedEl) assistedEl.value = editDocument.assistedBy || '';

    const applicantEl = document.querySelector("[name='applicantName']");
    if (applicantEl) applicantEl.value = editDocument.applicantName || '';

    // Handle routedTo - can be string or array
    const routedToValue = editDocument.routedTo;
    if (routedToValue) {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(routedToValue);
        if (Array.isArray(parsed) && window.routedMultiSelect) {
          window.routedMultiSelect.setSelectedValues(parsed);
        } else if (window.routedMultiSelect) {
          // Single value, convert to array
          window.routedMultiSelect.setSelectedValues([routedToValue]);
        } else {
          // Fallback to regular select
          const routedEl = document.getElementById('routedSelect') || document.querySelector("[name='routedTo']");
          if (routedEl) routedEl.value = routedToValue;
        }
      } catch (e) {
        // Not JSON, treat as single value
        if (window.routedMultiSelect) {
          window.routedMultiSelect.setSelectedValues([routedToValue]);
        } else {
          const routedEl = document.getElementById('routedSelect') || document.querySelector("[name='routedTo']");
          if (routedEl) routedEl.value = routedToValue;
        }
      }
    }

    const floorEl = document.querySelector("[name='floorArea']");
    if (floorEl) floorEl.value = editDocument.floorArea || '';

    // The saved document stores location as "Barangay, Purok" — parse it back into selects
    const barangayEl = document.getElementById('barangaySelect');
    const purokEl = document.getElementById('purokSelect');
    if (editDocument.location && barangayEl && purokEl) {
      const parts = String(editDocument.location).split(',').map(s => s.trim());
      const barangayValue = parts[0] || '';
      const purokValue = parts[1] || '';
      
      if (barangayValue) {
        // Wait for barangay data to load, then set values
        const setBarangayPurok = () => {
          if (barangayEl.options.length > 1) {
            barangayEl.value = barangayValue;
            // Trigger change event to populate purok dropdown
            if (barangayEl.value) {
              barangayEl.dispatchEvent(new Event('change', { bubbles: true }));
              // Then set purok value after dropdown is populated
              setTimeout(() => {
                if (purokValue && purokEl.options.length > 1) {
                  purokEl.value = purokValue;
                }
              }, 200);
            }
          } else {
            // If data not loaded yet, wait and try again
            setTimeout(setBarangayPurok, 100);
          }
        };
        
        // Start trying after a short delay to allow data to load
        setTimeout(setBarangayPurok, 300);
        
        // Also listen for data loaded event
        window.addEventListener('barangayPurokDataLoaded', setBarangayPurok, { once: true });
      }
    }

    const lotEl = document.querySelector("[name='lotArea']");
    if (lotEl) lotEl.value = editDocument.lotArea || '';

    const storeyEl = document.querySelector("[name='storey']");
    if (storeyEl) storeyEl.value = editDocument.storey || '';

    const landmarkEl = document.getElementById('landmark') || document.querySelector("[name='landmark']");
    if (landmarkEl) landmarkEl.value = editDocument.landmark || '';

    const mezanineEl = document.querySelector("[name='mezanine']");
    if (mezanineEl) mezanineEl.value = editDocument.mezanine || '';

    const oicEl = document.getElementById('oicSelect');
    if (oicEl) oicEl.value = editDocument.oic || '';
  } else {
    // 🧹 Force clear to avoid autofill next time
    localStorage.removeItem("editIndex");
    localStorage.removeItem("editDocument");
  }

  // ==========================
  // AUTO DATE + ZONING LOGIC
  // ==========================
  const dateApp = document.getElementById("dateOfApplication");
  const dueDate = document.getElementById("dueDate");
  const znField = document.querySelector('[name="znApplication"], #znApplication');
  const titleSelect = document.querySelector('[name="title"], #title');

  // 🗓️ Add 12 working days (Mon–Fri)
  function addWorkingDays(startDate, daysToAdd) {
    let current = new Date(startDate);
    let addedDays = 0;
    while (addedDays < daysToAdd) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) addedDays++;
    }
    return current;
  }

  // 🗓️ Format as "Month DD, YYYY"
  function formatLongDate(date) {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  // 🧮 Auto fill date of application & due date
  const today = new Date();
  if (dateApp) dateApp.value = formatLongDate(today);
  if (dueDate) {
    const computedDue = addWorkingDays(today, 12);
    dueDate.value = formatLongDate(computedDue);
  }

  // Recalculate if date of application changes
  if (dateApp && dueDate) {
    dateApp.addEventListener("change", () => {
      const selected = new Date(dateApp.value);
      const newDue = addWorkingDays(selected, 12);
      dueDate.value = formatLongDate(newDue);
    });
  }

  // =============================
  // AUTO ZONING APPLICATION NO.
  // =============================
  function getPrefix(title) {
    if (title.includes("LC") || title.includes("Zoning") || title.includes("Development")) return "LC";
    return "XX";
  }

  function getNextSequence(prefix, year) {
    const key = `${prefix}-${year}-counter`;
    let counter = parseInt(localStorage.getItem(key)) || 0;
    counter++;
    localStorage.setItem(key, counter);
    return counter.toString().padStart(4, "0");
  }

  function generateZoningNumber(title) {
    const prefix = getPrefix(title);
    const year = new Date().getFullYear();
    const seq = getNextSequence(prefix, year);
    return `${prefix}-${year}-${seq}`;
  }

  if (titleSelect && znField) {
    titleSelect.addEventListener("change", () => {
      const title = titleSelect.value.trim();
      if (title) znField.value = generateZoningNumber(title);
    });
  }

  // =============================
  // SAVE DOCUMENT ON FORM SUBMIT
  // =============================
  const form = document.querySelector(".form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Validate multi-select if it exists
    if (window.routedMultiSelect) {
      const selectedValues = window.routedMultiSelect.getSelectedValues();
      if (selectedValues.length === 0) {
        alert('⚠️ Please select at least one recipient for "Routed to" field.');
        window.routedMultiSelect.input?.focus();
        return;
      }
    }

    // Validate file presence: if creating a new document, require at least one attached file.
    const fileInput = document.getElementById('fileInput');
    const existingEditDoc = JSON.parse(localStorage.getItem('editDocument'));

    const hasFilesNow = fileInput && fileInput.files && fileInput.files.length > 0;
    const hasFilesBefore = existingEditDoc && Array.isArray(existingEditDoc.fileNames) && existingEditDoc.fileNames.length > 0;

    if (!hasFilesNow && !hasFilesBefore) {
      alert('⚠️ Please attach at least one file before saving.');
      return; // stop save
    }

    // Get file data - merge existing files with new files
    let filesArr = [];
    let fileNamesArr = [];
    
    // Try to get merged files from upload.js first (most reliable)
    if (window.uploadFileData && typeof window.uploadFileData.getAllFiles === 'function') {
      const allFiles = window.uploadFileData.getAllFiles();
      if (allFiles.length > 0) {
        filesArr = allFiles;
        fileNamesArr = allFiles.map(f => f.name || f);
      }
    }
    
    // Fallback: Get from latestUploadFiles (set by upload.js save button)
    if (filesArr.length === 0) {
      const latestUploadFiles = JSON.parse(localStorage.getItem('latestUploadFiles') || '[]');
      if (latestUploadFiles.length > 0) {
        filesArr = latestUploadFiles;
        fileNamesArr = latestUploadFiles.map(f => f.name || f);
      }
    }
    
    // Fallback: Get existing files from editDocument (if editing)
    if (filesArr.length === 0 && existingEditDoc) {
      const existingFiles = (Array.isArray(existingEditDoc.files)) ? existingEditDoc.files : [];
      const existingFileNames = (Array.isArray(existingEditDoc.fileNames)) ? existingEditDoc.fileNames : [];
      
      if (existingFiles.length > 0) {
        filesArr = existingFiles;
        fileNamesArr = existingFileNames;
      } else if (existingFileNames.length > 0) {
        fileNamesArr = existingFileNames;
      }
    }
    
    // Last fallback: Get from file input (new document only)
    if (filesArr.length === 0 && fileNamesArr.length === 0 && fileInput && fileInput.files && fileInput.files.length > 0) {
      fileNamesArr = Array.from(fileInput.files).map(f => f.name);
    }

    const now = new Date();
    const newDoc = {
      dateAdded: now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      dateSort: now.toISOString(),
      title: document.getElementById("title").value,
      projectType: projectTypeSearchableSelect ? projectTypeSearchableSelect.getValue() : (projectTypeSelect ? projectTypeSelect.value : document.querySelector("[name='projectType']")?.value || ''),
      znApp: document.querySelector("[name='znApplication']").value,
      zoning: zoningSearchableSelect ? zoningSearchableSelect.getValue() : (zoningSelect ? zoningSelect.value : document.querySelector("[name='zoning']")?.value || ''),
      dateOfApp: document.getElementById("dateOfApplication").value,
      dueDate: document.getElementById("dueDate").value,
      receivedBy: document.getElementById("receivedSelect").value,
      assistedBy: document.getElementById("assistedSelect").value,
      applicantName: document.querySelector("[name='applicantName']").value,
      routedTo: window.routedMultiSelect ? JSON.stringify(window.routedMultiSelect.getSelectedValues()) : document.getElementById("routedSelect").value,
      location:
        document.getElementById("barangaySelect").value +
        ", " +
        document.getElementById("purokSelect").value,
      floorArea: document.querySelector("[name='floorArea']").value,
      lotArea: document.querySelector("[name='lotArea']").value,
      storey: document.querySelector("[name='storey']").value,
      mezanine: document.querySelector("[name='mezanine']").value,
      oic: document.getElementById("oicSelect").value,
      fileNames: fileNamesArr,
      files: filesArr,
    };

    // ✅ SAVE to localStorage
    let docs = JSON.parse(localStorage.getItem("documents")) || [];

    if (editIndex !== null) {
      // Update existing document - preserve original dateSort to maintain position
      const originalDoc = docs[editIndex];
      if (originalDoc && originalDoc.dateSort) {
        newDoc.dateSort = originalDoc.dateSort;
      } else {
        // If no dateSort exists, use current time
        newDoc.dateSort = now.toISOString();
      }
      docs[editIndex] = newDoc;
      localStorage.removeItem("editIndex");
      localStorage.removeItem("editDocument");
    } else {
      // Add new document at the BEGINNING of array (newest first)
      docs.unshift(newDoc);
    }

    // Always sort documents by dateSort (newest first) before saving
    docs.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0);
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0);
      return dateB - dateA; // Newest first
    });

  localStorage.setItem("documents", JSON.stringify(docs));
  // Clear latestUploadFiles after saving
  localStorage.removeItem('latestUploadFiles');
  alert("✅ Document successfully saved!");
  window.location.href = "documents.html";
  });
});

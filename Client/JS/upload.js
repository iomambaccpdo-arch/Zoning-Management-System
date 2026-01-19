document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const fileNameDisplay = document.getElementById("fileName");
  const saveButton = document.querySelector(".btn--success[type='submit']");
  const uploadButton = document.querySelector("label[for='fileInput']");
  let selectedFiles = [];
  let existingFiles = []; // Files from existing document when editing
  let selectedFilesWithData = []; // Base64 data for selected files

  // ✅ Allow multiple file selection
  fileInput.setAttribute("multiple", "true");

  // ==========================
  // LOAD EXISTING FILES WHEN EDITING
  // ==========================
  const editDocument = JSON.parse(localStorage.getItem('editDocument'));
  if (editDocument && editDocument.files && Array.isArray(editDocument.files) && editDocument.files.length > 0) {
    existingFiles = editDocument.files;
    displayAllFiles(); // Show existing files immediately
  } else if (editDocument && editDocument.fileNames && Array.isArray(editDocument.fileNames) && editDocument.fileNames.length > 0) {
    // If we only have file names (no data), create placeholder objects
    existingFiles = editDocument.fileNames.map(name => ({ name, type: '', data: '' }));
    displayAllFiles();
  }

  // === DRAG & DROP FEATURE ===
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      selectedFiles = files; // New files (existing files are preserved in existingFiles)
      displayAllFiles(); // Show both existing and new files
      const dataTransfer = new DataTransfer();
      files.forEach((f) => dataTransfer.items.add(f));
      fileInput.files = dataTransfer.files;
      
      // Read dropped files as Base64 (reset array for new files)
      selectedFilesWithData = [];
      files.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          selectedFilesWithData[idx] = {
            name: file.name,
            type: file.type,
            data: e.target.result
          };
        };
        reader.readAsDataURL(file);
      });
    }
  });

  // === UPLOAD BUTTON ===
  uploadButton.addEventListener("click", (e) => {
    e.preventDefault();
    fileInput.click();
  });

  // === FILE SELECTION ===
  // When files are selected, read their content as Base64 and store in selectedFilesWithData
  // Note: selectedFilesWithData is declared above in drag-drop handler
  
  // Make file arrays accessible globally for new-document.js
  window.uploadFileData = {
    existingFiles: () => existingFiles,
    selectedFiles: () => selectedFiles,
    selectedFilesWithData: () => selectedFilesWithData,
    getAllFiles: () => {
      // Combine existing files with new files (new files take precedence if duplicate names)
      const existingFileNames = existingFiles.map(f => f.name || f);
      const combined = [...existingFiles];
      selectedFilesWithData.forEach(newFile => {
        if (newFile && newFile.name && !existingFileNames.includes(newFile.name)) {
          combined.push(newFile);
        }
      });
      return combined;
    }
  };
  
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);
    if (files.length > 0) {
      selectedFiles = files;
      displayAllFiles(); // Show both existing and new files
      // Read all NEW files as Base64
      selectedFilesWithData = [];
      let filesRead = 0;
      files.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          selectedFilesWithData[idx] = {
            name: file.name,
            type: file.type,
            data: e.target.result // base64 string
          };
          filesRead++;
        };
        reader.readAsDataURL(file);
      });
    } else {
      // If no new files selected, keep existing files
      selectedFiles = [];
      selectedFilesWithData = [];
      resetFileDisplay();
    }
  });

  function displaySelectedFiles() {
    displayAllFiles();
  }

  function displayAllFiles() {
    const existingFileNames = existingFiles.map(f => f.name || f);
    const selectedFileNames = selectedFiles.map(f => f.name || f);
    const allFileNames = [...existingFileNames, ...selectedFileNames];
    
    if (allFileNames.length === 0) {
      resetFileDisplay();
      return;
    }

    if (allFileNames.length === 1) {
      const fileName = allFileNames[0];
      const isExisting = existingFileNames.includes(fileName);
      fileNameDisplay.innerHTML = `${isExisting ? '📎' : '📄'} ${fileName}${isExisting ? ' <span style="color:#6b7280;font-size:0.85em;">(existing)</span>' : ''}`;
    } else {
      let html = `📂 ${allFileNames.length} files:`;
      html += '<br>';
      
      // Show existing files first
      if (existingFileNames.length > 0) {
        html += '<div style="margin-top:4px;color:#6b7280;font-size:0.9em;">Existing files:</div>';
        existingFileNames.forEach((name) => {
          html += `• 📎 ${name}<br>`;
        });
      }
      
      // Show new files
      if (selectedFileNames.length > 0) {
        if (existingFileNames.length > 0) {
          html += '<div style="margin-top:4px;color:#16a34a;font-size:0.9em;">New files:</div>';
        }
        selectedFileNames.forEach((name) => {
          html += `• 📄 ${name}<br>`;
        });
      }
      
      fileNameDisplay.innerHTML = html;
    }
    fileNameDisplay.style.color = "#16a34a";
  }

  function resetFileDisplay() {
    if (existingFiles.length > 0) {
      displayAllFiles(); // Still show existing files even if no new files
    } else {
      fileNameDisplay.textContent = "No file attached";
      fileNameDisplay.style.color = "#555";
    }
  }

  // === MODAL ===
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal-content">
      <div class="loader" id="uploadLoader"></div>
      <h3 id="uploadMessage">Uploading Document(s)...</h3>
    </div>
  `;
  document.body.appendChild(modal);

  // === SAVE DOCUMENT ===
  saveButton.addEventListener("click", (e) => {
    e.preventDefault();

    // 🚫 No files at all (neither existing nor new) — stop everything
    const totalFiles = existingFiles.length + selectedFiles.length;
    if (totalFiles === 0) {
      alert("⚠️ Please attach at least one file before saving.");
      resetFileDisplay();
      return; // ❌ stop upload simulation
    }

    // Wait for all files to be read
    let checkReady = setInterval(() => {
      if (selectedFilesWithData.length === selectedFiles.length && selectedFilesWithData.every(f => f && f.data)) {
        clearInterval(checkReady);

        // ✅ Show modal
        modal.style.display = "flex";
        const loader = document.getElementById("uploadLoader");
        const message = document.getElementById("uploadMessage");

        loader.style.display = "block";
        message.textContent = `Uploading ${selectedFiles.length} file(s)...`;

        // Simulate upload delay
        setTimeout(() => {
          loader.style.display = "none";
          const newFilesCount = selectedFiles.length;
          const existingFilesCount = existingFiles.length;
          const totalCount = newFilesCount + existingFilesCount;
          
          let messageText = `✅ <strong>${totalCount} file(s) ready!</strong>`;
          if (existingFilesCount > 0 && newFilesCount > 0) {
            messageText = `✅ <strong>${existingFilesCount} existing file(s) retained, ${newFilesCount} new file(s) uploaded!</strong>`;
          } else if (existingFilesCount > 0) {
            messageText = `✅ <strong>${existingFilesCount} existing file(s) retained!</strong>`;
          }
          
          message.innerHTML = `
            ${messageText}<br><br>
            <button id="okButton" class="btn btn--success">OK</button><br><br>
            <small>Tip: Press any key to go to Dashboard</small>
          `;

          // Save NEW file data to localStorage for preview (existing files are already in editDocument)
          // Combine existing files with new files
          const allFilesData = [...existingFiles, ...selectedFilesWithData];
          localStorage.setItem('latestUploadFiles', JSON.stringify(allFilesData));

          const okButton = document.getElementById("okButton");
          okButton.addEventListener("click", () => {
            window.location.href = "dashboard.html";
          });

          document.addEventListener("keydown", () => {
            window.location.href = "dashboard.html";
          });
        }, 2000);
      }
    }, 100);
  });

  // === HINT MESSAGE ===
  const hint = document.createElement("p");
  hint.classList.add("muted");
  hint.style.marginTop = "8px";
  hint.textContent =
    "💡 You can click Upload or drag multiple files into the box.";
  uploadArea.appendChild(hint);
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const fileInput = document.getElementById("fileInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("⚠️ Please attach at least one file before submitting.");
      return;
    }

    // 🧾 Collect form data
    const newDocument = {
      title: form.querySelector("[name='documentTitle']").value,
      lcApp: form.querySelector("[name='lcApplication']").value,
      projectType: form.querySelector("[name='projectType']").value,
      routedTo: form.querySelector("[name='routedTo']").value,
      location: form.querySelector("[name='location']").value,
      receivedBy: form.querySelector("[name='receivedBy']").value,
      applicantName: form.querySelector("[name='applicantName']").value,
      oic: document.getElementById("oicSelect").value,
      dateOfApp: form.querySelector("[name='dateOfApplication']").value,
      dueDate: form.querySelector("[name='dueDate']").value,
      floorArea: form.querySelector("[name='floorArea']").value,
      lotArea: form.querySelector("[name='lotArea']").value,
      storey: form.querySelector("[name='storey']").value,
      fileNames: Array.from(fileInput.files).map((f) => f.name),
      dateCreated: new Date().toLocaleString(),
      dateAdded: new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Save to localStorage
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    documents.push(newDocument);
    localStorage.setItem("documents", JSON.stringify(documents));

    // Redirect or show success modal
    window.location.href = "documents.html";
  });


    // 🗃️ Save to localStorage
    const savedDocs = JSON.parse(localStorage.getItem("documents")) || [];
    if (editIndex !== null) {
    savedDocs[editIndex] = newDoc;
    localStorage.removeItem("editIndex");
    localStorage.removeItem("editDocument");
  } else {
    savedDocs.push(newDoc);
  }
    localStorage.setItem("documents", JSON.stringify(savedDocs));

    alert("✅ Document saved successfully!");
    window.location.href = "documents.html";
  });



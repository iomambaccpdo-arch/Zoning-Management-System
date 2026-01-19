// Dashboard functionality - Dynamic month cards and recent files
document.addEventListener("DOMContentLoaded", () => {
  const monthGrid = document.querySelector(".grid.grid--4");
  const recentFilesTable = document.querySelector(".table");
  const monthSection = document.querySelector(".section");

  // Add year filter dropdown
  let yearFilter;
  if (monthSection && !document.getElementById('dashboardYearFilter')) {
    const sectionTitle = monthSection.querySelector('.section__title');
    const filterRow = document.createElement('div');
    filterRow.style.display = 'flex';
    filterRow.style.justifyContent = 'space-between';
    filterRow.style.alignItems = 'center';
    filterRow.style.marginBottom = '1em';
    filterRow.style.gap = '1em';

    const filterLabel = document.createElement('label');
    filterLabel.style.display = 'flex';
    filterLabel.style.alignItems = 'center';
    filterLabel.style.gap = '0.5em';
    filterLabel.style.fontWeight = '500';
    filterLabel.style.color = '#374151';
    filterLabel.innerHTML = '<span>Year:</span>';

    yearFilter = document.createElement('select');
    yearFilter.id = 'dashboardYearFilter';
    yearFilter.className = 'input';
    yearFilter.style.padding = '0.5em 1em';
    yearFilter.style.fontSize = '0.95em';
    yearFilter.style.border = '1px solid #d1d5db';
    yearFilter.style.borderRadius = '0.5em';
    yearFilter.style.background = '#fff';
    yearFilter.style.minWidth = '120px';
    yearFilter.innerHTML = '<option value="">All Years</option>';

    filterLabel.appendChild(yearFilter);
    filterRow.appendChild(filterLabel);
    
    // Insert after section title, before grid
    if (sectionTitle && sectionTitle.nextSibling) {
      monthSection.insertBefore(filterRow, sectionTitle.nextSibling);
    } else if (sectionTitle) {
      sectionTitle.parentNode.insertBefore(filterRow, monthGrid);
    }

    // Year filter change triggers refresh
    yearFilter.addEventListener('change', () => {
      renderMonthCards();
    });
  } else {
    yearFilter = document.getElementById('dashboardYearFilter');
  }

  // ==========================
  // DYNAMIC MONTH CARDS
  // ==========================
  function renderMonthCards() {
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    
    // Ensure documents are sorted by dateSort (newest first)
    documents.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0);
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0);
      return dateB - dateA; // Newest first
    });
    
    // Group documents by month/year
    const monthGroups = {};
    documents.forEach(doc => {
      const dateStr = doc.dateSort || doc.dateAdded || doc.dateCreated || new Date().toISOString();
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(doc);
    });

    // Sort months (most recent first)
    const sortedMonths = Object.keys(monthGroups).sort((a, b) => {
      // Parse month names to dates for proper sorting
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA;
    });

    // Populate year filter with available years
    if (yearFilter) {
      const years = Array.from(new Set(sortedMonths.map(monthKey => {
        const date = new Date(monthKey);
        return date.getFullYear();
      }).filter(y => y > 1970 && !isNaN(y)))).sort((a, b) => b - a);
      
      const currentYear = yearFilter.value;
      yearFilter.innerHTML = '<option value="">All Years</option>' + 
        years.map(y => `<option value="${y}">${y}</option>`).join('');
      // Restore selected year if it still exists
      if (currentYear && years.includes(parseInt(currentYear))) {
        yearFilter.value = currentYear;
      }
    }

    // Filter by year if selected
    let monthsToShow = sortedMonths;
    if (yearFilter && yearFilter.value) {
      const selectedYear = parseInt(yearFilter.value);
      monthsToShow = sortedMonths.filter(monthKey => {
        const date = new Date(monthKey);
        return date.getFullYear() === selectedYear;
      });
    } else {
      // If no year filter, show up to 12 most recent months
      monthsToShow = sortedMonths.slice(0, 12);
    }

    // Clear existing cards
    if (monthGrid) {
      monthGrid.innerHTML = "";
      
      if (monthsToShow.length === 0) {
        monthGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2em; color: #666;">
            No documents found. <a href="new-document.html" style="color: #2563eb;">Create your first document</a>
          </div>
        `;
        return;
      }

      monthsToShow.forEach(monthKey => {
        const docs = monthGroups[monthKey];
        const count = docs.length;
        const card = document.createElement("a");
          // Pass month as URL parameter (encode it)
        card.href = `documents.html?month=${encodeURIComponent(monthKey)}`;
        card.className = "month-card-link";
        card.innerHTML = `
          <div class="month-card">
            <div class="month-card__title">Documents for :<br><strong>${monthKey}</strong></div>
            <div class="month-card__meta">${count} Document${count !== 1 ? 's' : ''}<br>(C) City Planning Development Office</div>
          </div>
        `;
        monthGrid.appendChild(card);
      });
    }
  }

  // ==========================
  // RECENT FILES TABLE
  // ==========================
  function renderRecentFiles() {
    let documents = JSON.parse(localStorage.getItem("documents")) || [];
    
    // Ensure documents are sorted by dateSort (newest first)
    documents.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0);
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0);
      return dateB - dateA; // Newest first
    });
    
    // Get all files from all documents
    let allFiles = [];
    documents.forEach((doc, docIdx) => {
      if (!doc.fileNames || !Array.isArray(doc.fileNames) || doc.fileNames.length === 0) return;
      
      const dateAdded = doc.dateAdded || doc.dateCreated || new Date().toISOString();
      doc.fileNames.forEach((fileName, fileIdx) => {
        allFiles.push({
          fileName,
          dateAdded,
          dateSort: doc.dateSort || new Date(dateAdded).toISOString(),
          docIdx,
          fileIdx,
          doc
        });
      });
    });

    // Sort by date (most recent first)
    allFiles.sort((a, b) => {
      const dateA = new Date(a.dateSort);
      const dateB = new Date(b.dateSort);
      return dateB - dateA;
    });

    // Show only the 5 most recent files
    const recentFiles = allFiles.slice(0, 5);

    if (recentFilesTable) {
      const tbody = recentFilesTable.querySelector("tbody") || recentFilesTable;
      
      // Clear existing rows (skip header)
      const existingRows = recentFilesTable.querySelectorAll(".table__row");
      existingRows.forEach(row => row.remove());

      if (recentFiles.length === 0) {
        const emptyRow = document.createElement("div");
        emptyRow.className = "table__row";
        emptyRow.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 1em; color: #666;">
            No files uploaded yet
          </div>
        `;
        recentFilesTable.appendChild(emptyRow);
        return;
      }

      recentFiles.forEach(file => {
        const row = document.createElement("div");
        row.className = "table__row";
        row.style.cursor = "pointer";
        row.style.transition = "background-color 0.2s ease";
        
        // Add hover effect
        row.addEventListener("mouseenter", () => {
          row.style.backgroundColor = "#f3f4f6";
        });
        row.addEventListener("mouseleave", () => {
          row.style.backgroundColor = "";
        });
        
        // Make row clickable
        row.addEventListener("click", () => {
          viewFile(file.docIdx, file.fileIdx, file.fileName);
        });
        
        // Format date nicely
        let formattedDate = file.dateAdded;
        try {
          const date = new Date(file.dateSort);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });
          }
        } catch (e) {
          // Keep original date string
        }

        row.innerHTML = `
          <div style="color: #166534; font-weight: 500;">${file.fileName}</div>
          <div>${formattedDate}</div>
        `;
        recentFilesTable.appendChild(row);
      });
    }
  }

  // ==========================
  // FILE VIEWER MODAL
  // ==========================
  let fileModal = null;
  
  function createFileModal() {
    if (fileModal) return fileModal;
    
    fileModal = document.createElement("div");
    fileModal.id = "dashboardFileModal";
    fileModal.style.display = "none";
    fileModal.style.position = "fixed";
    fileModal.style.left = "0";
    fileModal.style.top = "0";
    fileModal.style.width = "100vw";
    fileModal.style.height = "100vh";
    fileModal.style.background = "rgba(0, 0, 0, 0.5)";
    fileModal.style.zIndex = "1000";
    fileModal.style.display = "flex";
    fileModal.style.justifyContent = "center";
    fileModal.style.alignItems = "center";
    fileModal.innerHTML = `
      <div style="background: #fff; max-width: 90vw; max-height: 90vh; width: 800px; padding: 24px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; display: flex; flex-direction: column;">
        <button id="closeDashboardFileModal" style="position: absolute; top: 16px; right: 16px; font-size: 24px; background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">✖</button>
        <h2 id="dashboardFileModalTitle" style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827; padding-right: 40px;">File Preview</h2>
        <div id="dashboardFileModalContent" style="flex: 1; overflow: auto; margin: 0; white-space: pre-wrap; font-family: system-ui; font-size: 14px; background: #f9fafb; padding: 16px; border-radius: 8px; min-height: 200px; max-height: calc(90vh - 120px);"></div>
        <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
          <button id="dashboardFileModalDownload" class="btn btn--primary" style="display: none;">⬇️ Download</button>
          <button id="dashboardFileModalClose" class="btn btn--muted">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(fileModal);
    
    // Close handlers
    document.getElementById("closeDashboardFileModal").addEventListener("click", hideFileModal);
    document.getElementById("dashboardFileModalClose").addEventListener("click", hideFileModal);
    fileModal.addEventListener("click", (e) => {
      if (e.target === fileModal) hideFileModal();
    });
    
    return fileModal;
  }
  
  function showFileModal(title, content, downloadUrl = null, fileName = null) {
    createFileModal();
    document.getElementById("dashboardFileModalTitle").textContent = title;
    const contentDiv = document.getElementById("dashboardFileModalContent");
    const downloadBtn = document.getElementById("dashboardFileModalDownload");
    
    // If content contains HTML (for image/download), use innerHTML, else textContent
    if (/<(img|a|br|span|div|p|strong|em|b|i|h[1-6]|embed|iframe)\b/i.test(content)) {
      contentDiv.innerHTML = content;
    } else {
      contentDiv.textContent = content;
    }
    
    // Show download button if download URL is provided
    if (downloadUrl && fileName) {
      downloadBtn.style.display = "inline-flex";
      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      };
    } else {
      downloadBtn.style.display = "none";
    }
    
    fileModal.style.display = "flex";
  }
  
  function hideFileModal() {
    if (fileModal) {
      fileModal.style.display = "none";
    }
  }
  
  function viewFile(docIdx, fileIdx, fileName) {
    const documents = JSON.parse(localStorage.getItem("documents")) || [];
    const doc = documents[docIdx];
    
    if (!doc || !doc.fileNames || !doc.fileNames[fileIdx]) {
      showFileModal("Error", "File not found.");
      return;
    }
    
    const actualFileName = doc.fileNames[fileIdx];
    let content = "";
    let title = actualFileName;
    
    // Try to get file data and type
    let fileObj = null;
    if (doc.files && Array.isArray(doc.files)) {
      fileObj = doc.files[fileIdx] || doc.files.find(f => f.name === actualFileName);
    }
    
    if (fileObj && fileObj.data && fileObj.type) {
      if (fileObj.type.startsWith("text/")) {
        // Text file: decode and show
        fetch(fileObj.data)
          .then(res => res.text())
          .then(text => showFileModal(title, text, fileObj.data, actualFileName))
          .catch(() => showFileModal(title, "[Could not preview text file]", fileObj.data, actualFileName));
        return;
      } else if (fileObj.type.startsWith("image/")) {
        // Image file: show image
        content = `<img src="${fileObj.data}" alt="${actualFileName}" style="max-width: 100%; max-height: 60vh; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />`;
        showFileModal(title, content, fileObj.data, actualFileName);
        return;
      } else if (fileObj.type === "application/pdf") {
        // PDF file: embed for inline viewing
        content = `<embed src="${fileObj.data}" type="application/pdf" width="100%" height="500px" style="border-radius: 8px; box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);" />`;
        showFileModal(title, content, fileObj.data, actualFileName);
        return;
      } else {
        // Other file: show download link
        content = `<div style="text-align: center; padding: 2em;">
          <p style="color: #6b7280; margin-bottom: 1em;">Preview not supported for this file type.</p>
          <p style="color: #374151; font-weight: 500;">File: ${actualFileName}</p>
        </div>`;
        showFileModal(title, content, fileObj.data, actualFileName);
        return;
      }
    } else {
      // Fallback: show placeholder
      content = `This is a placeholder preview for file: ${actualFileName}\n\n(No file data found)`;
      showFileModal(title, content);
    }
  }

  // Initial render
  renderMonthCards();
  renderRecentFiles();

  // Re-render when documents change (listen to storage events)
  window.addEventListener("storage", () => {
    renderMonthCards();
    renderRecentFiles();
  });
});



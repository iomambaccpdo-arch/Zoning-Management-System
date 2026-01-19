document.addEventListener('DOMContentLoaded', function() {
  const fileGrid = document.querySelector('.filegrid');
  if (!fileGrid) return;

  // Add search and filter UI
  const section = fileGrid.closest('.section');
  let searchBar, yearFilter, autosuggestDropdown, searchWrapper;
  let allFilesData = []; // Store all files for autosuggest
  let debounceTimer = null;

  if (section && !document.getElementById('fileSearchBar')) {
    const filterRow = document.createElement('div');
    filterRow.className = 'file-filter-row';
    filterRow.style.display = 'flex';
    filterRow.style.gap = '0.5em';
    filterRow.style.marginBottom = '1.5em';
    filterRow.style.alignItems = 'center';
    filterRow.style.background = '#f8fafc';
    filterRow.style.padding = '1em 1em 1em 0.5em';
    filterRow.style.borderRadius = '0.75em';
    filterRow.style.boxShadow = '0 1px 4px 0 #0001';

    // Create wrapper for search input with autosuggest
    searchWrapper = document.createElement('div');
    searchWrapper.style.position = 'relative';
    searchWrapper.style.flex = '2 1 220px';

    searchBar = document.createElement('input');
    searchBar.type = 'text';
    searchBar.placeholder = '🔍 Search files...';
    searchBar.id = 'fileSearchBar';
    searchBar.className = 'input file-search-input';
    searchBar.style.width = '100%';
    searchBar.style.padding = '0.6em 1em';
    searchBar.style.fontSize = '1em';
    searchBar.style.border = '1px solid #d1d5db';
    searchBar.style.borderRadius = '0.5em';
    searchBar.style.background = '#fff';
    searchBar.style.transition = 'border 0.2s';
    searchBar.style.boxSizing = 'border-box';
    searchBar.addEventListener('focus', function() { this.style.border = '1.5px solid #2563eb'; });
    searchBar.addEventListener('blur', function() { 
      this.style.border = '1px solid #d1d5db';
      // Hide autosuggest on blur (with slight delay to allow clicks)
      setTimeout(() => {
        if (autosuggestDropdown) autosuggestDropdown.style.display = 'none';
      }, 200);
    });

    // Create autosuggest dropdown
    autosuggestDropdown = document.createElement('div');
    autosuggestDropdown.id = 'fileAutosuggest';
    autosuggestDropdown.style.display = 'none';
    autosuggestDropdown.style.position = 'absolute';
    autosuggestDropdown.style.top = '100%';
    autosuggestDropdown.style.left = '0';
    autosuggestDropdown.style.right = '0';
    autosuggestDropdown.style.background = '#fff';
    autosuggestDropdown.style.border = '1px solid #d1d5db';
    autosuggestDropdown.style.borderTop = 'none';
    autosuggestDropdown.style.borderRadius = '0 0 0.5em 0.5em';
    autosuggestDropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    autosuggestDropdown.style.maxHeight = '300px';
    autosuggestDropdown.style.overflowY = 'auto';
    autosuggestDropdown.style.zIndex = '1000';
    autosuggestDropdown.style.marginTop = '-0.5em';

    searchWrapper.appendChild(searchBar);
    searchWrapper.appendChild(autosuggestDropdown);

    // Create year filter with label
    const yearFilterWrapper = document.createElement('div');
    yearFilterWrapper.style.display = 'flex';
    yearFilterWrapper.style.alignItems = 'center';
    yearFilterWrapper.style.gap = '0.5em';

    const yearFilterLabel = document.createElement('label');
    yearFilterLabel.style.display = 'flex';
    yearFilterLabel.style.alignItems = 'center';
    yearFilterLabel.style.gap = '0.5em';
    yearFilterLabel.style.fontWeight = '500';
    yearFilterLabel.style.color = '#374151';
    yearFilterLabel.style.fontSize = '0.95em';
    yearFilterLabel.innerHTML = '<span>Year:</span>';

    yearFilter = document.createElement('select');
    yearFilter.id = 'fileYearFilter';
    yearFilter.className = 'input file-year-filter';
    yearFilter.style.padding = '0.6em 1em';
    yearFilter.style.fontSize = '1em';
    yearFilter.style.border = '1px solid #d1d5db';
    yearFilter.style.borderRadius = '0.5em';
    yearFilter.style.background = '#fff';
    yearFilter.style.minWidth = '120px';
    yearFilter.innerHTML = '<option value="">All Years</option>';

    yearFilterLabel.appendChild(yearFilter);
    yearFilterWrapper.appendChild(yearFilterLabel);

    filterRow.appendChild(searchWrapper);
    filterRow.appendChild(yearFilterWrapper);
    section.insertBefore(filterRow, fileGrid);

    // Year filter change triggers refresh automatically
    yearFilter.addEventListener('change', function() {
      refresh();
    });

    // Search-as-you-type with debounce
    searchBar.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      
      // Show autosuggest if query has at least 1 character
      if (query.length > 0) {
        showAutosuggest(query);
      } else {
        autosuggestDropdown.style.display = 'none';
      }

      // Debounce the filtering (search-as-you-type)
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refresh();
      }, 300); // 300ms debounce
    });

    // Handle keyboard navigation in autosuggest
    searchBar.addEventListener('keydown', function(e) {
      const suggestions = autosuggestDropdown.querySelectorAll('.autosuggest-item');
      const currentActive = autosuggestDropdown.querySelector('.autosuggest-item.active');
      let activeIndex = currentActive ? Array.from(suggestions).indexOf(currentActive) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % suggestions.length;
        suggestions.forEach(s => s.classList.remove('active'));
        if (suggestions[activeIndex]) {
          suggestions[activeIndex].classList.add('active');
          suggestions[activeIndex].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
        suggestions.forEach(s => s.classList.remove('active'));
        if (suggestions[activeIndex]) {
          suggestions[activeIndex].classList.add('active');
          suggestions[activeIndex].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter' && currentActive) {
        e.preventDefault();
        currentActive.click();
      }
    });

  }

  // Function to show autosuggest dropdown
  function showAutosuggest(query) {
    if (!autosuggestDropdown || !allFilesData.length) return;

    const suggestions = allFilesData.filter(f => {
      const fileNameMatch = f.fileName.toLowerCase().includes(query);
      const docTitleMatch = f.docTitle.toLowerCase().includes(query);
      return fileNameMatch || docTitleMatch;
    }).slice(0, 10); // Limit to 10 suggestions

    if (suggestions.length === 0) {
      autosuggestDropdown.innerHTML = '<div style="padding: 0.75em 1em; color: #6b7280; font-size: 0.9em;">No suggestions found</div>';
      autosuggestDropdown.style.display = 'block';
      return;
    }

    // Clear previous items
    autosuggestDropdown.innerHTML = '';
    
    suggestions.forEach(f => {
      const item = document.createElement('div');
      item.className = 'autosuggest-item';
      item.style.padding = '0.75em 1em';
      item.style.cursor = 'pointer';
      item.style.borderBottom = '1px solid #f3f4f6';
      item.style.transition = 'background 0.15s';
      
      const fileNameHighlighted = highlightMatch(f.fileName, query);
      const docTitleHighlighted = highlightMatch(f.docTitle, query);
      
      item.innerHTML = `
        <div style="font-weight: 500; color: #111827; margin-bottom: 0.25em;">${fileNameHighlighted}</div>
        <div style="font-size: 0.85em; color: #6b7280;">From: ${docTitleHighlighted}</div>
      `;
      
      item.addEventListener('mouseenter', function() {
        this.style.background = '#f3f4f6';
        this.classList.add('active');
      });
      
      item.addEventListener('mouseleave', function() {
        this.style.background = '';
        this.classList.remove('active');
      });
      
      item.addEventListener('click', function() {
        searchBar.value = f.fileName;
        autosuggestDropdown.style.display = 'none';
        searchBar.dispatchEvent(new Event('input'));
        searchBar.focus();
      });
      
      autosuggestDropdown.appendChild(item);
    });

    autosuggestDropdown.style.display = 'block';
  }

  // Helper to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper to highlight matching text (returns HTML-safe string)
  function highlightMatch(text, query) {
    // Escape HTML first to prevent XSS
    const escapedText = escapeHtml(text);
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return escapedText;
    
    // Escape parts separately for highlighting
    const before = escapeHtml(text.substring(0, index));
    const match = escapeHtml(text.substring(index, index + query.length));
    const after = escapeHtml(text.substring(index + query.length));
    
    return `${before}<strong style="background: #fef08a;">${match}</strong>${after}`;
  }

  // Helper: parse date string to Date object
  function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    // Try to parse as US format (e.g. October 09, 2025)
    const d = new Date(dateStr);
    if (!isNaN(d)) return d;
    // fallback: try ISO
    return new Date(Date.parse(dateStr));
  }

  // Get all documents from localStorage
  function getAllFiles() {
    let docs = JSON.parse(localStorage.getItem('documents')) || [];
    
    // Ensure documents are sorted by dateSort (newest first)
    docs.sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0);
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0);
      return dateB - dateA; // Newest first
    });
    
    let files = [];
    docs.forEach((doc, docIdx) => {
      if (!doc.fileNames || !Array.isArray(doc.fileNames) || doc.fileNames.length === 0) return;
      const date = doc.dateAdded || doc.dateCreated || '';
      doc.fileNames.forEach((fileName, fileIdx) => {
        files.push({
          fileName,
          docIdx,
          fileIdx,
          docTitle: doc.title || 'Untitled',
          date,
          doc,
        });
      });
    });
    return files;
  }

  // Render file cards
  function renderFiles(files) {
    fileGrid.innerHTML = '';
    if (!files.length) {
      fileGrid.innerHTML = '<div class="muted" style="padding:2em;text-align:center;">No files uploaded yet.</div>';
      return;
    }
    files.forEach((f, idx) => {
      const card = document.createElement('div');
      card.className = 'filecard';
      card.tabIndex = 0;
      card.style.cursor = 'pointer';
      card.setAttribute('data-doc', f.docIdx);
      card.setAttribute('data-file', f.fileIdx);
      // Check if user is Viewer (read-only) - hide delete button
      const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      const isViewerRole = currentUser && currentUser.role === 'Viewer';
      const deleteButtonHTML = isViewerRole ? '' : 
        `<button class="btn btn--danger btn--small file-delete" title="Delete" data-doc="${f.docIdx}" data-file="${f.fileIdx}">🗑️ Delete</button>`;
      
      card.innerHTML = `
        <div class="filecard__date">${f.date}</div>
        <div class="filecard__title">${f.fileName}</div>
        <div class="filecard__meta">From: <span>${f.docTitle}</span></div>
        <div class="filecard__actions">
          <button class="btn btn--muted btn--small file-download" title="Download" data-doc="${f.docIdx}" data-file="${f.fileIdx}">⬇️ Download</button>
          ${deleteButtonHTML}
        </div>
        <a class="filecard__link" href="documents.html?doc=${f.docIdx}" onclick="event.stopPropagation()">→ View Document</a>
      `;
      fileGrid.appendChild(card);
    });
  }

  // Modal for viewing file content
  let fileModal = document.getElementById('fileViewModal');
  if (!fileModal) {
    fileModal = document.createElement('div');
    fileModal.id = 'fileViewModal';
    fileModal.style.display = 'none';
    fileModal.style.position = 'fixed';
    fileModal.style.left = '0';
    fileModal.style.top = '0';
    fileModal.style.width = '100vw';
    fileModal.style.height = '100vh';
    fileModal.style.background = 'rgba(0,0,0,0.35)';
    fileModal.style.zIndex = '1000';
    fileModal.innerHTML = `
      <div style="background:#fff;max-width:520px;margin:7vh auto;padding:2em 2em 1.5em 2em;border-radius:1em;box-shadow:0 2px 16px #0002;position:relative;">
        <button id="closeFileModalBtn" style="position:absolute;top:1em;right:1em;font-size:1.2em;background:none;border:none;cursor:pointer;">✖</button>
        <h2 id="fileModalTitle" style="margin-top:0;font-size:1.2em;"></h2>
        <div id="fileModalContent" style="margin:1em 0 0 0;white-space:pre-wrap;max-height:45vh;overflow:auto;font-family:monospace;font-size:1em;background:#f8fafc;padding:1em;border-radius:0.5em;"></div>
      </div>
    `;
    document.body.appendChild(fileModal);
  }
  function showFileModal(title, content) {
    document.getElementById('fileModalTitle').textContent = title;
    const contentDiv = document.getElementById('fileModalContent');
    // If content contains HTML (for image/download), use innerHTML, else textContent
    if (/<(img|a|br|span|div|p|strong|em|b|i|h[1-6])\b/i.test(content)) {
      contentDiv.innerHTML = content;
    } else {
      contentDiv.textContent = content;
    }
    fileModal.style.display = 'block';
  }
  function hideFileModal() {
    fileModal.style.display = 'none';
  }
  document.addEventListener('click', function(e) {
    if (e.target.id === 'closeFileModalBtn' || e.target === fileModal) hideFileModal();
  });

  // Download handler - uses actual stored file data if available
  function handleDownload(docIdx, fileIdx) {
    const docs = JSON.parse(localStorage.getItem('documents')) || [];
    const doc = docs[docIdx];
    if (!doc || !doc.fileNames || !doc.fileNames[fileIdx]) return;
    const fileName = doc.fileNames[fileIdx];
    
    // Try to get actual file data from stored files array
    let fileObj = null;
    if (doc.files && Array.isArray(doc.files) && doc.files[fileIdx]) {
      fileObj = doc.files[fileIdx];
    } else if (doc.files && Array.isArray(doc.files)) {
      // Try to find by name
      fileObj = doc.files.find(f => f.name === fileName);
    }

    if (fileObj && fileObj.data) {
      // Convert base64 data URL to blob
      try {
        const response = fetch(fileObj.data);
        response.then(res => res.blob()).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        }).catch(() => {
          // Fallback if fetch fails
          downloadPlaceholder(fileName);
        });
      } catch (e) {
        downloadPlaceholder(fileName);
      }
    } else {
      // No file data stored, create placeholder
      downloadPlaceholder(fileName);
    }
  }

  // Helper function for placeholder downloads
  function downloadPlaceholder(fileName) {
    const blob = new Blob([`This is a placeholder for file: ${fileName}\n\nNote: The actual file data was not stored.`], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Delete handler
  function handleDelete(docIdx, fileIdx) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    const docs = JSON.parse(localStorage.getItem('documents')) || [];
    const doc = docs[docIdx];
    if (!doc || !doc.fileNames || !doc.fileNames[fileIdx]) return;
    doc.fileNames.splice(fileIdx, 1);
    // If no files left, optionally remove the document (or keep it)
    // if (doc.fileNames.length === 0) docs.splice(docIdx, 1);
    localStorage.setItem('documents', JSON.stringify(docs));
    refresh();
  }

  // Search and filter logic
  function filterFiles(files, search, year) {
    return files.filter(f => {
      const matchesSearch = !search || f.fileName.toLowerCase().includes(search) || f.docTitle.toLowerCase().includes(search);
      // Use dateSort if available (same logic as sorting), otherwise use date
      const dateToCheck = f.doc.dateSort ? new Date(f.doc.dateSort) : parseDate(f.date);
      const fileYear = dateToCheck.getFullYear();
      const matchesYear = !year || (fileYear === parseInt(year));
      return matchesSearch && matchesYear;
    });
  }

  // Populate year filter
  function populateYearFilter(files) {
    if (!yearFilter) return;
    
    // Use dateSort if available (same logic as sorting and filtering), otherwise use date
    const years = Array.from(new Set(files.map(f => {
      const dateToCheck = f.doc.dateSort ? new Date(f.doc.dateSort) : parseDate(f.date);
      return dateToCheck.getFullYear();
    }).filter(y => y > 1970 && !isNaN(y)))).sort((a,b) => b-a);
    
    // Preserve the currently selected year
    const currentYear = yearFilter.value;
    yearFilter.innerHTML = '<option value="">All Years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
    
    // Restore the selected year if it still exists in the new list
    if (currentYear && years.includes(parseInt(currentYear))) {
      yearFilter.value = currentYear;
    }
  }

  // Main refresh logic
  function refresh() {
    let files = getAllFiles();
    // Store all files for autosuggest
    allFilesData = files;
    
    // Sort by dateSort (ISO) if present, else by date
    files.sort((a, b) => {
      const dateA = a.doc.dateSort ? new Date(a.doc.dateSort) : parseDate(a.date);
      const dateB = b.doc.dateSort ? new Date(b.doc.dateSort) : parseDate(b.date);
      return dateB - dateA;
    });
    populateYearFilter(files);
    let search = searchBar ? searchBar.value.trim().toLowerCase() : '';
    let year = yearFilter ? yearFilter.value : '';
    files = filterFiles(files, search, year);
    renderFiles(files);
    
    // Hide autosuggest if search is empty
    if (!search && autosuggestDropdown) {
      autosuggestDropdown.style.display = 'none';
    }
  }

  // Event listeners
  // Remove live filtering on input/change; only filter on button click or Enter

  // Delegate download/delete/view clicks
  fileGrid.addEventListener('click', function(e) {
    const t = e.target;
    // Download
    if (t.classList.contains('file-download')) {
      handleDownload(parseInt(t.dataset.doc), parseInt(t.dataset.file));
      e.stopPropagation();
      return;
    }
    // Delete
    if (t.classList.contains('file-delete')) {
      handleDelete(parseInt(t.dataset.doc), parseInt(t.dataset.file));
      e.stopPropagation();
      return;
    }
    // View file content (click on card, not on buttons/links)
    let card = t.closest('.filecard');
    if (card && !t.classList.contains('file-download') && !t.classList.contains('file-delete') && !t.classList.contains('filecard__link')) {
      const docIdx = parseInt(card.getAttribute('data-doc'));
      const fileIdx = parseInt(card.getAttribute('data-file'));
      const docs = JSON.parse(localStorage.getItem('documents')) || [];
      const doc = docs[docIdx];
      if (!doc || !doc.fileNames || !doc.fileNames[fileIdx]) return;
      const fileName = doc.fileNames[fileIdx];
      let content = '';
      let title = fileName;
      // Try to get file data and type
      let fileObj = (doc.files && Array.isArray(doc.files)) ? doc.files.find(f => f.name === fileName) : null;
      if (fileObj && fileObj.data && fileObj.type) {
        if (fileObj.type.startsWith('text/')) {
          // Text file: decode and show
          fetch(fileObj.data)
            .then(res => res.text())
            .then(text => showFileModal(title, text))
            .catch(() => showFileModal(title, '[Could not preview text file]'));
          return;
        } else if (fileObj.type.startsWith('image/')) {
          // Image file: show image
          content = `<img src="${fileObj.data}" alt="${fileName}" style="max-width:100%;max-height:40vh;display:block;margin:auto;" />`;
          showFileModal(title, content);
          return;
        } else if (fileObj.type === 'application/pdf') {
          // PDF file: embed for inline viewing
          content = `<embed src="${fileObj.data}" type="application/pdf" width="100%" height="400px" style="border-radius:0.5em;box-shadow:0 1px 8px #0001;" />` +
            `<div style="margin-top:1em;"><a href="${fileObj.data}" download="${fileName}" class="btn btn--primary">Download PDF</a></div>`;
          showFileModal(title, content);
          return;
        } else {
          // Other file: show download link
          content = `<a href="${fileObj.data}" download="${fileName}" class="btn btn--primary" style="margin:1em auto;display:block;width:max-content;">Download file</a><br><span style="color:#888;">Preview not supported for this file type.</span>`;
          showFileModal(title, content);
          return;
        }
      } else {
        // Fallback: show placeholder
        content = `This is a placeholder preview for file: ${fileName}\n\n(No file data found)`;
        showFileModal(title, content);
      }
    }
  });

  // Initial render
  refresh();
});

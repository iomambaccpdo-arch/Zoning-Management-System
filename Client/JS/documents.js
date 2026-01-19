  document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("documentTableBody");
  const searchInput = document.getElementById("searchInput");
  let savedDocs = JSON.parse(localStorage.getItem("documents")) || [];
  
  // Hide "Add New" button for Viewer role
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (currentUser && currentUser.role === 'Viewer') {
    const addNewBtn = document.getElementById('addNewBtn');
    if (addNewBtn) addNewBtn.style.display = 'none';
  }

  // Ensure documents array is always sorted (newest first) when loaded
  savedDocs.sort((a, b) => {
    const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0);
    const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0);
    return dateB - dateA; // Newest first
  });
  // Save sorted array back to localStorage
  localStorage.setItem("documents", JSON.stringify(savedDocs));

  // Get month filter from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const monthFilter = urlParams.get('month'); // e.g., "January 2024"
  
  // Filter documents by month if month parameter is present
  let filteredDocs = savedDocs;
  if (monthFilter) {
    filteredDocs = savedDocs.filter(doc => {
      const dateStr = doc.dateSort || doc.dateAdded || doc.dateCreated || new Date().toISOString();
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;
      
      const docMonthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      return docMonthKey === monthFilter;
    });
    
    // Update page title/header to show the month filter
    const header = document.querySelector('.main .header h1');
    if (header) {
      header.textContent = `📑 Document Records - ${monthFilter}`;
    }
  }

  // Use a variable to track the base filtered documents (by month)
  let baseFilteredDocs = filteredDocs;
  
  function renderTable(docsToRender = baseFilteredDocs) {
    let filteredDocs = docsToRender;
    tableBody.innerHTML = "";

    // Sort by dateSort (ISO) if present, else dateAdded/dateCreated (newest first)
    filteredDocs = [...filteredDocs].sort((a, b) => {
      const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0);
      const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0);
      return dateB - dateA; // Newest first
    });

    // Check if user is Viewer to determine column count
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const isViewerRole = currentUser && currentUser.role === 'Viewer';
    const colCount = isViewerRole ? 16 : 17; // 16 data columns + 1 Actions column if not Viewer

    if (filteredDocs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center; color:gray;">No documents found</td></tr>`;
      return;
    }

    const areaUnit = localStorage.getItem('areaUnit') || 'sqm';

    function formatArea(value) {
      if (value === undefined || value === null || value === "") return '';
      const num = Number(String(value).replace(/,/g, ''));
      if (Number.isNaN(num)) return value;
      if (areaUnit === 'sqm') return num.toLocaleString() + ' sqm';
      // sqft conversion: 1 sqm = 10.7639 sqft
      const sqft = Math.round(num * 10.7639);
      return sqft.toLocaleString() + ' sqft';
    }

    filteredDocs.forEach((doc, index) => {
      const row = document.createElement("tr");
      // find original index in savedDocs so edit/delete map back to the real array
      const originalIndex = savedDocs.indexOf(doc);

      // Check if user is Viewer (read-only)
      const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      const isViewerRole = currentUser && currentUser.role === 'Viewer';
      
      // Hide actions column for Viewer, show buttons for Admin and User
      const actionsHTML = isViewerRole ? 
        '<td>—</td>' :
        `<td>
          <button class="btn btn--small btn--primary edit-btn" data-index="${originalIndex}">✏️ Edit</button>
          <button class="btn btn--small btn--danger delete-btn" data-index="${originalIndex}">🗑️ Delete</button>
        </td>`;

      row.innerHTML = `
        <td>${doc.dateAdded || "—"}</td>
  <td><span class="td-truncate" data-full="${(doc.title||'').replace(/"/g,'&quot;')}">${doc.title}</span></td>
  <td><span class="td-truncate" data-full="${(doc.projectType||'').replace(/"/g,'&quot;')}">${doc.projectType}</span></td>
  <td>${doc.znApp}</td>
  <td><span class="td-truncate" data-full="${(doc.zoning||'').replace(/"/g,'&quot;')}">${doc.zoning}</span></td>
        <td>${doc.dueDate}</td>
        <td>${doc.receivedBy}</td>
        <td>${doc.assistedBy}</td>
  <td><span class="td-truncate" data-full="${(doc.applicantName||'').replace(/"/g,'&quot;')}">${doc.applicantName}</span></td>
        <td>${doc.routedTo}</td>
  <td><span class="td-truncate" data-full="${(doc.location||'').replace(/"/g,'&quot;')}">${doc.location}</span></td>
  <td>${formatArea(doc.floorArea)}</td>
  <td>${formatArea(doc.lotArea)}</td>
  <td>${doc.storey ? ('Floor ' + doc.storey) : ''}</td>
        <td>${doc.mezanine}</td>
        <td>${doc.oic}</td>
        ${actionsHTML}
      `;
      tableBody.appendChild(row);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", handleDelete));
    document.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", handleEdit));
  }

  function handleDelete(e) {
    const index = e.target.dataset.index;
    if (confirm("Are you sure you want to delete this document?")) {
      savedDocs.splice(index, 1);
      // Re-sort after deletion to maintain order
      savedDocs.sort((a, b) => {
        const dateA = a.dateSort ? new Date(a.dateSort) : new Date(a.dateAdded || a.dateCreated || 0);
        const dateB = b.dateSort ? new Date(b.dateSort) : new Date(b.dateAdded || b.dateCreated || 0);
        return dateB - dateA; // Newest first
      });
      localStorage.setItem("documents", JSON.stringify(savedDocs));
      
      // Re-apply month filter if present
      if (monthFilter) {
        baseFilteredDocs = savedDocs.filter(doc => {
          const dateStr = doc.dateSort || doc.dateAdded || doc.dateCreated || new Date().toISOString();
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return false;
          
          const docMonthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
          return docMonthKey === monthFilter;
        });
      } else {
        baseFilteredDocs = savedDocs;
      }
      
      renderTable();
    }
  }

  function handleEdit(e) {
    const index = e.target.dataset.index;
    const doc = savedDocs[index];
    localStorage.setItem("editIndex", index);
    localStorage.setItem("editDocument", JSON.stringify(doc));
    window.location.href = "new-document.html";
  }

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    // Search within the base filtered documents (respects month filter if present)
    const searchFilteredDocs = baseFilteredDocs.filter(doc =>
      Object.values(doc).some(value =>
        String(value).toLowerCase().includes(query)
      )
    );
    renderTable(searchFilteredDocs);
  });

  // Clear edit state when clicking Add New so the form opens blank
  const addBtn = document.getElementById('addNewBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem('editIndex');
        localStorage.removeItem('editDocument');
      } catch (err) {
        // ignore storage errors
      }
    });
  }

  // Make table container draggable (vertical drag to scroll) and responsive height
  function enableDragScroll() {
    const container = document.querySelector('.table-container');
    if (!container) return;

    // Adjust max-height based on viewport
    function updateHeight() {
      const headerEl = document.querySelector('.main .header');
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 120;
      // leave 60px at bottom for padding
      container.style.maxHeight = (window.innerHeight - headerHeight - 120) + 'px';
    }

    updateHeight();
    window.addEventListener('resize', updateHeight);

    // Mouse drag (both axes)
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeftStart = 0;
    let scrollTopStart = 0;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      container.classList.add('dragging');
      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeftStart = container.scrollLeft;
      scrollTopStart = container.scrollTop;
      // prevent selecting text while dragging
      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      isDown = false;
      container.classList.remove('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const dx = x - startX;
      const dy = y - startY;
      // invert movement so drag direction feels natural
      container.scrollLeft = scrollLeftStart - dx;
      container.scrollTop = scrollTopStart - dy;
    });

    // Touch support (both axes)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchScrollLeft = 0;
    let touchScrollTop = 0;
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchScrollLeft = container.scrollLeft;
      touchScrollTop = container.scrollTop;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - touchStartX;
      const dy = y - touchStartY;
      container.scrollLeft = touchScrollLeft - dx;
      container.scrollTop = touchScrollTop - dy;
    }, { passive: true });
  }

  enableDragScroll();

  renderTable(baseFilteredDocs);

  // Area unit toggle (sqm <-> sqft)
  const unitBtn = document.getElementById('areaUnitToggle');
  if (unitBtn) {
    const current = localStorage.getItem('areaUnit') || 'sqm';
    unitBtn.textContent = current;
    unitBtn.addEventListener('click', () => {
      const next = (localStorage.getItem('areaUnit') || 'sqm') === 'sqm' ? 'sqft' : 'sqm';
      localStorage.setItem('areaUnit', next);
      unitBtn.textContent = next;
      renderTable();
    });
  }

  // Inline expand/collapse: toggle .td-truncate--expanded on click
  tableBody.addEventListener('click', (e) => {
    const el = e.target.closest('.td-truncate');
    if (!el) return;
    // Collapse any other expanded cells first (optional)
    document.querySelectorAll('.td-truncate.td-truncate--expanded').forEach(node => {
      if (node !== el) node.classList.remove('td-truncate--expanded');
    });
    // Toggle clicked cell
    el.classList.toggle('td-truncate--expanded');
  });
});


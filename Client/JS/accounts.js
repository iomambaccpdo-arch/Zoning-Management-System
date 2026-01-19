document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('accountsTableBody');
  const modal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const cancelBtn = document.getElementById('cancelEdit');
  const successPopup = document.getElementById('successPopup');

  let users = JSON.parse(localStorage.getItem('users')) || [];
  let editingIndex = null;

  function render() {
    tbody.innerHTML = '';
    if (users.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="8" style="text-align:center;color:gray;">No users found</td>';
      tbody.appendChild(tr);
      return;
    }

    users.forEach((u, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${u.firstName} ${u.lastName}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td>${u.designation}</td>
        <td>${u.section}</td>
        <td>${u.role}</td>
        <td>
          <button class="btn btn--small btn--primary edit-btn" data-index="${i}">Edit</button>
          <button class="btn btn--small btn--danger delete-btn" data-index="${i}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // attach handlers
    document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', onEdit));
    document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', onDelete));
  }

  function onEdit(e) {
    const idx = Number(e.currentTarget.dataset.index);
    editingIndex = idx;
    const u = users[idx];
    if (!u) return;

    // populate modal form
    document.getElementById('editUserId').value =  (idx + 1);
    document.getElementById('editName').value = (u.firstName || '') + ' ' + (u.lastName || '');
    document.getElementById('editUsername').value = u.username || '';
    document.getElementById('editEmail').value = u.email || '';
    document.getElementById('editRole').value = u.role || 'User';
    document.getElementById('editDesignation').value = u.designation || '';
    document.getElementById('editSection').value = u.section || '';

    modal.style.display = 'flex';
  }

  function onDelete(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const u = users[idx];
    if (!u) return;
    if (confirm(`Delete user ${u.firstName} ${u.lastName}?`)) {
      users.splice(idx, 1);
      localStorage.setItem('users', JSON.stringify(users));
      render();
    }
  }

  cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; editForm.reset(); });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingIndex === null) return;

    // parse name into first/last simple split
    const fullName = document.getElementById('editName').value.trim();
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');

    users[editingIndex].firstName = firstName || '';
    users[editingIndex].lastName = lastName || '';
    users[editingIndex].name = fullName; // Update full name too
    users[editingIndex].username = document.getElementById('editUsername').value.trim();
    users[editingIndex].email = document.getElementById('editEmail').value.trim();
    users[editingIndex].role = document.getElementById('editRole').value;
    users[editingIndex].designation = document.getElementById('editDesignation').value;
    users[editingIndex].section = document.getElementById('editSection').value;

    // Update password if provided
    const passwordField = document.getElementById('editPassword');
    if (passwordField && passwordField.value.trim()) {
      users[editingIndex].password = passwordField.value.trim();
    }

    localStorage.setItem('users', JSON.stringify(users));
    modal.style.display = 'none';
    editForm.reset();

    successPopup.style.display = 'block';
    setTimeout(() => { successPopup.style.display = 'none'; }, 2000);
    render();
  });

  // close modal when clicking outside
  window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  render();
});

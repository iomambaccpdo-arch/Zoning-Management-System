// Populate dropdowns in new-document.html from users in localStorage
// Received By, Assisted By, OIC: names; Routed To: emails

document.addEventListener('DOMContentLoaded', function() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  // Get dropdowns
  const receivedSelect = document.getElementById('receivedSelect');
  const assistedSelect = document.getElementById('assistedSelect');
  const oicSelect = document.getElementById('oicSelect');
  const routedSelect = document.getElementById('routedSelect');

  // Helper: clear and add default option
  function resetSelect(select, label) {
    if (!select) return;
    select.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = '';
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = label;
    select.appendChild(opt);
  }

  if (!Array.isArray(users) || users.length === 0) {
    // No users: show fallback message in all dropdowns
    resetSelect(receivedSelect, 'No accounts found. Add users in Accounts.');
    resetSelect(assistedSelect, 'No accounts found. Add users in Accounts.');
    resetSelect(oicSelect, 'No accounts found. Add users in Accounts.');
    resetSelect(routedSelect, 'No accounts found. Add users in Accounts.');
    return;
  }

  // Names for Received By, Assisted By, OIC
  const names = users.map(u => u.name).filter(Boolean);
  // Emails for Routed To
  const emails = users.map(u => u.email).filter(Boolean);

  // Populate Received By
  resetSelect(receivedSelect, 'Received by');
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    receivedSelect.appendChild(opt);
  });

  // Populate Assisted By (add a blank/none option)
  resetSelect(assistedSelect, 'Assisted by');
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = '-----';
  assistedSelect.appendChild(noneOpt);
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    assistedSelect.appendChild(opt);
  });

  // Populate OIC
  resetSelect(oicSelect, 'Select OIC');
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    oicSelect.appendChild(opt);
  });

  // Populate Routed To (emails) - Now using multi-select component with search
  const routedSelectWrapper = document.getElementById('routedSelectWrapper');
  if (routedSelectWrapper && typeof MultiSelect !== 'undefined') {
    // Create options with both name and email for better searchability
    const routedOptions = users
      .filter(u => u.email) // Only include users with emails
      .map(user => ({
        value: user.email,
        label: `${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username} (${user.email})`,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        email: user.email
      }));
    
    // Initialize multi-select component with enhanced search
    const routedMultiSelect = new MultiSelect('routedSelectContainer', {
      options: routedOptions,
      placeholder: 'Search by name or email...',
      required: true,
      searchKeys: ['name', 'email', 'label'] // Enable search across multiple fields
    });
    
    // Store reference globally for form submission
    window.routedMultiSelect = routedMultiSelect;
  } else if (routedSelect) {
    // Fallback to regular select if multi-select not found
    resetSelect(routedSelect, 'Routed to');
    emails.forEach(email => {
      const opt = document.createElement('option');
      opt.value = email;
      opt.textContent = email;
      routedSelect.appendChild(opt);
    });
  }
});

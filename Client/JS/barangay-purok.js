// Dependent Barangay and Purok Dropdowns
document.addEventListener('DOMContentLoaded', function() {
  const barangaySelect = document.getElementById('barangaySelect');
  const purokSelect = document.getElementById('purokSelect');
  
  if (!barangaySelect || !purokSelect) return;
  
  let barangayPurokData = {};
  
  // Load and parse JSON data
  async function loadBarangayPurokData() {
    try {
      const response = await fetch('Data/Purok Name per Barangay.json');
      const data = await response.json();
      
      // Parse the data structure
      let currentBarangay = null;
      
      data.forEach(item => {
        const barangay = item.BARANGAY?.trim();
        const purok = item.PUROK?.trim();
        
        // If barangay is not empty, it's a new barangay entry
        if (barangay && barangay !== '') {
          currentBarangay = barangay;
          if (!barangayPurokData[currentBarangay]) {
            barangayPurokData[currentBarangay] = [];
          }
        } 
        // If barangay is empty but purok is not, add purok to current barangay
        else if (currentBarangay && purok && purok !== '') {
          if (!barangayPurokData[currentBarangay]) {
            barangayPurokData[currentBarangay] = [];
          }
          // Avoid duplicates
          if (!barangayPurokData[currentBarangay].includes(purok)) {
            barangayPurokData[currentBarangay].push(purok);
          }
        }
      });
      
      // Populate barangay dropdown
      populateBarangayDropdown();
      
    } catch (error) {
      console.error('Error loading barangay/purok data:', error);
      // Fallback: show error message
      barangaySelect.innerHTML = '<option value="">Error loading data</option>';
      purokSelect.innerHTML = '<option value="">Please select barangay first</option>';
    }
  }
  
  function populateBarangayDropdown() {
    // Clear existing options except the first one
    barangaySelect.innerHTML = '<option value="" disabled selected>Select Barangay</option>';
    
    // Sort barangays alphabetically
    const sortedBarangays = Object.keys(barangayPurokData).sort();
    
    sortedBarangays.forEach(barangay => {
      const option = document.createElement('option');
      option.value = barangay;
      option.textContent = barangay;
      barangaySelect.appendChild(option);
    });
  }
  
  function populatePurokDropdown(selectedBarangay) {
    // Clear existing options
    purokSelect.innerHTML = '<option value="" disabled selected>Select Purok</option>';
    
    if (!selectedBarangay || !barangayPurokData[selectedBarangay]) {
      purokSelect.disabled = true;
      return;
    }
    
    // Get puroks for selected barangay and sort them
    const puroks = [...barangayPurokData[selectedBarangay]].sort((a, b) => {
      // Natural sort: handle numeric and text puroks
      const numA = parseInt(a.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.match(/\d+/)?.[0] || '999');
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
    
    if (puroks.length === 0) {
      purokSelect.innerHTML = '<option value="" disabled>No puroks available</option>';
      purokSelect.disabled = true;
      return;
    }
    
    purokSelect.disabled = false;
    
    puroks.forEach(purok => {
      const option = document.createElement('option');
      option.value = purok;
      option.textContent = purok;
      purokSelect.appendChild(option);
    });
  }
  
  // Handle barangay selection change
  barangaySelect.addEventListener('change', function() {
    const selectedBarangay = this.value;
    
    if (selectedBarangay) {
      populatePurokDropdown(selectedBarangay);
      purokSelect.disabled = false;
    } else {
      purokSelect.innerHTML = '<option value="" disabled selected>Select Barangay first</option>';
      purokSelect.disabled = true;
    }
    
    // Reset purok selection when barangay changes
    purokSelect.value = '';
  });
  
  // Expose functions globally for edit functionality
  window.populatePurokDropdown = populatePurokDropdown;
  window.barangayPurokDataReady = false;
  
  // Mark as ready after data loads
  const originalLoad = loadBarangayPurokData;
  loadBarangayPurokData = async function() {
    await originalLoad();
    window.barangayPurokDataReady = true;
    // Dispatch custom event when data is ready
    window.dispatchEvent(new CustomEvent('barangayPurokDataLoaded'));
  };
  
  // Load data on page load
  loadBarangayPurokData();
});


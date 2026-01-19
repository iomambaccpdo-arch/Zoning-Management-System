/**
 * Searchable Select Component
 * A custom dropdown with search functionality
 */
class SearchableSelect {
  constructor(selectElement, options = {}) {
    this.selectElement = selectElement;
    this.options = {
      placeholder: options.placeholder || 'Search and select...',
      searchPlaceholder: options.searchPlaceholder || 'Type to search...',
      noResultsText: options.noResultsText || 'No results found',
      ...options
    };
    
    this.selectedValue = selectElement.value || '';
    this.selectedText = this.getSelectedText();
    this.isOpen = false;
    
    this.init();
  }

  init() {
    // Create wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'searchable-select-wrapper';
    this.selectElement.parentNode.insertBefore(this.wrapper, this.selectElement);
    this.wrapper.appendChild(this.selectElement);
    this.selectElement.style.display = 'none';

    // Create display button
    this.displayButton = document.createElement('button');
    this.displayButton.type = 'button';
    this.displayButton.className = 'searchable-select-button';
    this.displayButton.innerHTML = `
      <span class="searchable-select-text">${this.selectedText || this.options.placeholder}</span>
      <span class="searchable-select-arrow">▼</span>
    `;
    this.wrapper.appendChild(this.displayButton);

    // Create dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'searchable-select-dropdown';
    this.wrapper.appendChild(this.dropdown);

    // Create search input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.className = 'searchable-select-search';
    this.searchInput.placeholder = this.options.searchPlaceholder;
    this.dropdown.appendChild(this.searchInput);

    // Create options container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = 'searchable-select-options';
    this.dropdown.appendChild(this.optionsContainer);

    // Populate options
    this.populateOptions();

    // Event listeners
    this.setupEventListeners();
  }

  getSelectedText() {
    const selectedOption = this.selectElement.options[this.selectElement.selectedIndex];
    return selectedOption ? selectedOption.textContent : '';
  }

  populateOptions() {
    // Clear existing options
    const existingContainer = this.dropdown.querySelector('.searchable-select-options');
    if (existingContainer) {
      existingContainer.remove();
    }

    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = 'searchable-select-options';
    this.dropdown.appendChild(this.optionsContainer);

    // Add options from select element
    Array.from(this.selectElement.options).forEach((option, index) => {
      if (option.value === '' && option.disabled) {
        // Skip placeholder/disabled options
        return;
      }

      const optionElement = document.createElement('div');
      optionElement.className = 'searchable-select-option';
      if (option.value === this.selectedValue) {
        optionElement.classList.add('selected');
      }
      optionElement.textContent = option.textContent;
      optionElement.dataset.value = option.value;
      optionElement.dataset.index = index;

      optionElement.addEventListener('click', () => {
        this.selectOption(option.value, option.textContent);
      });

      this.optionsContainer.appendChild(optionElement);
    });

    // Filter options based on search
    this.filterOptions();
  }

  filterOptions() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const options = this.optionsContainer.querySelectorAll('.searchable-select-option');
    let hasVisibleOptions = false;

    options.forEach(option => {
      const text = option.textContent.toLowerCase();
      const matches = text.includes(searchTerm);
      option.style.display = matches ? 'block' : 'none';
      if (matches) hasVisibleOptions = true;
    });

    // Show/hide no results message
    let noResults = this.dropdown.querySelector('.searchable-select-no-results');
    if (!hasVisibleOptions && searchTerm) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'searchable-select-no-results';
        noResults.textContent = this.options.noResultsText;
        this.dropdown.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  }

  selectOption(value, text) {
    this.selectedValue = value;
    this.selectedText = text;
    this.selectElement.value = value;
    this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Update display
    const textSpan = this.displayButton.querySelector('.searchable-select-text');
    textSpan.textContent = text || this.options.placeholder;
    
    // Update selected state in options
    this.optionsContainer.querySelectorAll('.searchable-select-option').forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.value === value) {
        opt.classList.add('selected');
      }
    });

    this.close();
  }

  open() {
    if (this.selectElement.disabled) return;
    
    this.isOpen = true;
    this.dropdown.classList.add('show');
    this.displayButton.classList.add('active');
    this.searchInput.focus();
    
    // Scroll to selected option
    const selectedOption = this.optionsContainer.querySelector('.searchable-select-option.selected');
    if (selectedOption) {
      selectedOption.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  close() {
    this.isOpen = false;
    this.dropdown.classList.remove('show');
    this.displayButton.classList.remove('active');
    this.searchInput.value = '';
    this.filterOptions();
  }

  setupEventListeners() {
    // Toggle dropdown on button click
    this.displayButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    });

    // Search input
    this.searchInput.addEventListener('input', () => {
      this.filterOptions();
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstVisible = this.optionsContainer.querySelector('.searchable-select-option[style=""]:not([style*="none"]), .searchable-select-option:not([style*="none"])');
        if (firstVisible) {
          const value = firstVisible.dataset.value;
          const text = firstVisible.textContent;
          this.selectOption(value, text);
        }
      } else if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateOptions(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateOptions(-1);
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.close();
      }
    });

    // Update when select element changes programmatically
    this.selectElement.addEventListener('change', () => {
      this.selectedValue = this.selectElement.value;
      this.selectedText = this.getSelectedText();
      const textSpan = this.displayButton.querySelector('.searchable-select-text');
      textSpan.textContent = this.selectedText || this.options.placeholder;
      this.populateOptions();
    });
  }

  navigateOptions(direction) {
    const visibleOptions = Array.from(
      this.optionsContainer.querySelectorAll('.searchable-select-option:not([style*="none"])')
    );
    
    if (visibleOptions.length === 0) return;

    const currentIndex = visibleOptions.findIndex(opt => opt.classList.contains('highlighted'));
    let newIndex = currentIndex + direction;

    if (newIndex < 0) newIndex = visibleOptions.length - 1;
    if (newIndex >= visibleOptions.length) newIndex = 0;

    // Remove highlight from all
    visibleOptions.forEach(opt => opt.classList.remove('highlighted'));
    
    // Add highlight to new
    visibleOptions[newIndex].classList.add('highlighted');
    visibleOptions[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    // Select on Enter
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const highlighted = visibleOptions[newIndex];
        this.selectOption(highlighted.dataset.value, highlighted.textContent);
        this.searchInput.removeEventListener('keydown', handleEnter);
      }
    };
    this.searchInput.addEventListener('keydown', handleEnter);
  }

  // Public methods
  setValue(value) {
    const option = Array.from(this.selectElement.options).find(opt => opt.value === value);
    if (option) {
      this.selectOption(value, option.textContent);
    }
  }

  getValue() {
    return this.selectElement.value;
  }

  setDisabled(disabled) {
    this.selectElement.disabled = disabled;
    this.displayButton.disabled = disabled;
    if (disabled) {
      this.displayButton.classList.add('disabled');
      this.close();
    } else {
      this.displayButton.classList.remove('disabled');
    }
  }

  updateOptions() {
    this.populateOptions();
  }
}

// Initialize all searchable selects on page load (only if they have options)
document.addEventListener('DOMContentLoaded', () => {
  const searchableSelects = document.querySelectorAll('.searchable-select:not([data-manual-init])');
  searchableSelects.forEach(select => {
    // Only initialize if select has options (not just placeholder)
    if (select.options.length > 1 || (select.options.length === 1 && select.options[0].value !== '')) {
      new SearchableSelect(select);
    }
  });
});


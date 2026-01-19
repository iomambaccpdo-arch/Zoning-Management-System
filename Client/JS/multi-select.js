// Multi-Select Tag Component with Search
class MultiSelect {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.tagsContainer = this.container.querySelector('.multi-select-tags');
    this.input = this.container.querySelector('.multi-select-input');
    this.dropdown = this.container.querySelector('.multi-select-dropdown');
    this.hiddenInput = document.getElementById(containerId.replace('Container', ''));
    
    this.options = options.options || [];
    this.selectedValues = options.selectedValues || [];
    this.placeholder = options.placeholder || 'Search and select...';
    this.displayKey = options.displayKey || 'label';
    this.valueKey = options.valueKey || 'value';
    this.required = options.required || false;
    this.searchKeys = options.searchKeys || ['label']; // Fields to search in
    
    this.filteredOptions = [...this.options];
    
    this.init();
  }
  
  init() {
    if (this.input) {
      this.input.placeholder = this.placeholder;
    }
    
    // Set required attribute
    if (this.required && this.hiddenInput) {
      this.hiddenInput.setAttribute('required', 'true');
      this.container.closest('.multi-select-wrapper')?.setAttribute('data-required', 'true');
    }
    
    // Render initial selected tags
    this.renderTags();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Render dropdown
    this.renderDropdown();
  }
  
  setupEventListeners() {
    // Input focus - show dropdown
    if (this.input) {
      this.input.addEventListener('focus', () => {
        this.showDropdown();
      });
      
      // Input typing - filter options
      this.input.addEventListener('input', (e) => {
        this.filterOptions(e.target.value);
      });
      
      // Handle keyboard navigation
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideDropdown();
          this.input.blur();
        } else if (e.key === 'Backspace' && this.input.value === '' && this.selectedValues.length > 0) {
          // Remove last tag on backspace
          this.removeTag(this.selectedValues[this.selectedValues.length - 1]);
        } else if (e.key === 'Enter' && e.target.value.trim() !== '') {
          e.preventDefault();
          // Select first filtered option if available
          const firstOption = this.filteredOptions.find(opt => !this.isSelected(this.getValue(opt)));
          if (firstOption) {
            this.selectOption(firstOption);
          }
        }
      });
    }
    
    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }
  
  filterOptions(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    if (term === '') {
      this.filteredOptions = [...this.options];
    } else {
      this.filteredOptions = this.options.filter(opt => {
        // Search across multiple fields if searchKeys is defined
        if (this.searchKeys && this.searchKeys.length > 0) {
          return this.searchKeys.some(key => {
            const fieldValue = opt[key] || '';
            return String(fieldValue).toLowerCase().includes(term);
          });
        } else {
          // Fallback to default search on display field
          const display = this.getDisplay(opt).toLowerCase();
          return display.includes(term);
        }
      });
    }
    this.renderDropdown();
  }
  
  getDisplay(option) {
    if (typeof option === 'string') return option;
    return option[this.displayKey] || option.value || option;
  }
  
  getValue(option) {
    if (typeof option === 'string') return option;
    return option[this.valueKey] || option.value || option;
  }
  
  isSelected(value) {
    return this.selectedValues.includes(value);
  }
  
  selectOption(option) {
    const value = this.getValue(option);
    if (!this.isSelected(value)) {
      this.selectedValues.push(value);
      this.renderTags();
      this.updateHiddenInput();
      if (this.input) {
        this.input.value = '';
      }
      this.filterOptions('');
      this.renderDropdown();
    }
  }
  
  removeTag(value) {
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.renderTags();
    this.updateHiddenInput();
    this.renderDropdown();
  }
  
  renderTags() {
    if (!this.tagsContainer) return;
    
    this.tagsContainer.innerHTML = '';
    
    this.selectedValues.forEach(value => {
      const option = this.options.find(opt => this.getValue(opt) === value);
      let display = option ? this.getDisplay(option) : value;
      
      // If display contains email in parentheses, show just the name part for tags
      if (option && option.name && display.includes('(')) {
        display = option.name;
      }
      
      const tag = document.createElement('div');
      tag.className = 'multi-select-tag';
      tag.innerHTML = `
        <span class="multi-select-tag-text" title="${option ? this.getDisplay(option) : value}">${display}</span>
        <button type="button" class="multi-select-tag-remove" aria-label="Remove ${display}">×</button>
      `;
      
      tag.querySelector('.multi-select-tag-remove').addEventListener('click', () => {
        this.removeTag(value);
      });
      
      this.tagsContainer.appendChild(tag);
    });
  }
  
  renderDropdown() {
    if (!this.dropdown) return;
    
    this.dropdown.innerHTML = '';
    
    if (this.filteredOptions.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'multi-select-no-results';
      noResults.textContent = 'No results found';
      this.dropdown.appendChild(noResults);
      return;
    }
    
    this.filteredOptions.forEach(option => {
      const value = this.getValue(option);
      const display = this.getDisplay(option);
      const isSelected = this.isSelected(value);
      
      const optionEl = document.createElement('div');
      optionEl.className = `multi-select-option ${isSelected ? 'selected' : ''}`;
      optionEl.innerHTML = `
        <div class="multi-select-option-check"></div>
        <span>${display}</span>
      `;
      
      optionEl.addEventListener('click', () => {
        if (isSelected) {
          this.removeTag(value);
        } else {
          this.selectOption(option);
        }
      });
      
      this.dropdown.appendChild(optionEl);
    });
  }
  
  showDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.add('show');
      this.renderDropdown();
    }
  }
  
  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.remove('show');
    }
  }
  
  updateHiddenInput() {
    if (this.hiddenInput) {
      // Store as JSON array string for easy parsing
      this.hiddenInput.value = JSON.stringify(this.selectedValues);
      
      // Trigger validation
      if (this.required) {
        if (this.selectedValues.length === 0) {
          this.hiddenInput.setCustomValidity('Please select at least one option');
        } else {
          this.hiddenInput.setCustomValidity('');
        }
      }
    }
  }
  
  getSelectedValues() {
    return [...this.selectedValues];
  }
  
  setSelectedValues(values) {
    this.selectedValues = Array.isArray(values) ? values : [];
    this.renderTags();
    this.updateHiddenInput();
    this.renderDropdown();
  }
  
  setOptions(options) {
    this.options = options;
    this.filteredOptions = [...options];
    this.renderDropdown();
  }
}


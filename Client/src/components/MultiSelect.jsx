import React, { useState, useEffect, useRef } from 'react'

function MultiSelect({ containerId, options = {}, onChange, value = [] }) {
  const [selectedValues, setSelectedValues] = useState(Array.isArray(value) ? value : [])
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (Array.isArray(value)) {
      setSelectedValues(value)
    }
  }, [value])

  useEffect(() => {
    if (onChange && typeof onChange === 'function') {
      onChange(selectedValues)
    }
  }, [selectedValues])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const allOptions = Array.isArray(options.options) ? options.options : []
  const placeholder = options.placeholder || 'Search and select...'
  const displayKey = options.displayKey || 'label'
  const valueKey = options.valueKey || 'value'
  const searchKeys = Array.isArray(options.searchKeys) ? options.searchKeys : [displayKey]

  const filteredOptions = allOptions.filter(opt => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return searchKeys.some(key => {
      const fieldValue = opt[key] || ''
      return String(fieldValue).toLowerCase().includes(term)
    })
  }).filter(opt => {
    const optValue = typeof opt === 'string' ? opt : (opt[valueKey] || opt.value || opt)
    return !selectedValues.includes(optValue)
  })

  const getDisplay = (option) => {
    if (typeof option === 'string') return option
    return option[displayKey] || option.value || option
  }

  const getValue = (option) => {
    if (typeof option === 'string') return option
    return option[valueKey] || option.value || option
  }

  const selectOption = (option) => {
    const val = getValue(option)
    if (!selectedValues.includes(val)) {
      const newValues = [...selectedValues, val]
      setSelectedValues(newValues)
      setSearchTerm('')
      // Keep dropdown open after selection
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 0)
    }
  }

  const removeTag = (val) => {
    setSelectedValues(selectedValues.filter(v => v !== val))
  }

  const getOptionByValue = (val) => {
    if (!val || allOptions.length === 0) return null
    return allOptions.find(opt => getValue(opt) === val)
  }

  // Update hidden input validity when required
  useEffect(() => {
    const hiddenInput = document.getElementById(containerId.replace('Wrapper', ''))
    if (hiddenInput && options.required) {
      if (selectedValues.length === 0) {
        hiddenInput.setCustomValidity('Please select at least one option')
        if (containerRef.current) {
          containerRef.current.setAttribute('data-required', 'true')
        }
      } else {
        hiddenInput.setCustomValidity('')
        if (containerRef.current) {
          containerRef.current.setAttribute('data-required', 'false')
        }
      }
    }
  }, [selectedValues, options.required, containerId])

  return (
    <div 
      className="multi-select-wrapper" 
      id={containerId} 
      ref={containerRef}
      data-required={options.required ? selectedValues.length === 0 ? 'true' : 'false' : 'false'}
    >
      <div className="multi-select-container" id={`${containerId}Container`}>
        <div className="multi-select-tags" id={`${containerId}Tags`}>
          {selectedValues.map((val, idx) => {
            const option = getOptionByValue(val)
            let display = option ? getDisplay(option) : val
            if (option && option.name && display.includes('(')) {
              display = option.name
            }
            return (
              <div key={idx} className="multi-select-tag">
                <span className="multi-select-tag-text" title={option ? getDisplay(option) : val}>
                  {display}
                </span>
                <button
                  type="button"
                  className="multi-select-tag-remove"
                  aria-label={`Remove ${display}`}
                  onClick={() => removeTag(val)}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="multi-select-input"
          id={`${containerId}Input`}
          placeholder={selectedValues.length === 0 ? placeholder : ''}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false)
              setSearchTerm('')
            } else if (e.key === 'Backspace' && searchTerm === '' && selectedValues.length > 0) {
              removeTag(selectedValues[selectedValues.length - 1])
            } else if (e.key === 'Enter' && searchTerm.trim() !== '') {
              e.preventDefault()
              const firstOption = filteredOptions[0]
              if (firstOption) {
                selectOption(firstOption)
              }
            }
          }}
          autoComplete="off"
        />
        {isOpen && filteredOptions.length > 0 && (
          <div 
            className="multi-select-dropdown show" 
            id={`${containerId}Dropdown`}
            onClick={(e) => e.stopPropagation()}
          >
            {filteredOptions.map((option, idx) => {
              const optValue = getValue(option)
              const optDisplay = getDisplay(option)
              return (
                <div
                  key={idx}
                  className="multi-select-option"
                  onClick={(e) => {
                    e.stopPropagation()
                    selectOption(option)
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <div className="multi-select-option-check"></div>
                  <span>{optDisplay}</span>
                </div>
              )
            })}
          </div>
        )}
        {isOpen && filteredOptions.length === 0 && searchTerm && (
          <div 
            className="multi-select-dropdown show" 
            id={`${containerId}Dropdown`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="multi-select-no-results">No results found</div>
          </div>
        )}
      </div>
      <input
        type="hidden"
        id={containerId.replace('Wrapper', '')}
        name={options.name || 'routedTo'}
        value={JSON.stringify(selectedValues)}
        required={options.required || false}
        onChange={() => {}} // React controlled component
      />
    </div>
  )
}

export default MultiSelect

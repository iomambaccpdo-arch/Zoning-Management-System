import React, { useState, useEffect, useRef } from 'react'

function SearchableSelect({ selectElement, options = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedValue, setSelectedValue] = useState(selectElement?.value || '')
  const [selectedText, setSelectedText] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (selectElement) {
      setSelectedValue(selectElement.value || '')
      const selectedOption = selectElement.options[selectElement.selectedIndex]
      setSelectedText(selectedOption ? selectedOption.textContent : '')
    }
  }, [selectElement])

  useEffect(() => {
    if (selectElement) {
      const handleChange = () => {
        setSelectedValue(selectElement.value)
        const selectedOption = selectElement.options[selectElement.selectedIndex]
        setSelectedText(selectedOption ? selectedOption.textContent : '')
      }
      selectElement.addEventListener('change', handleChange)
      return () => selectElement.removeEventListener('change', handleChange)
    }
  }, [selectElement])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const getOptions = () => {
    if (!selectElement) return []
    return Array.from(selectElement.options).filter(opt => {
      if (opt.value === '' && opt.disabled) return false
      return true
    })
  }

  const filteredOptions = getOptions().filter(opt => {
    if (!searchTerm) return true
    return opt.textContent.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const selectOption = (value, text) => {
    if (selectElement) {
      selectElement.value = value
      selectElement.dispatchEvent(new Event('change', { bubbles: true }))
      setSelectedValue(value)
      setSelectedText(text)
    }
    setIsOpen(false)
    setSearchTerm('')
  }

  const open = () => {
    if (selectElement && !selectElement.disabled) {
      setIsOpen(true)
    }
  }

  const close = () => {
    setIsOpen(false)
    setSearchTerm('')
  }

  if (!selectElement) return null

  return (
    <div className="searchable-select-wrapper" ref={wrapperRef}>
      <select ref={(el) => { if (el && !selectElement.parentElement) selectElement.parentElement = el.parentElement }} style={{ display: 'none' }} />
      <button
        type="button"
        className={`searchable-select-button ${isOpen ? 'active' : ''} ${selectElement.disabled ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (isOpen) close()
          else open()
        }}
        disabled={selectElement.disabled}
      >
        <span className="searchable-select-text">{selectedText || options.placeholder || 'Search and select...'}</span>
        <span className="searchable-select-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="searchable-select-dropdown show">
          <input
            type="text"
            className="searchable-select-search"
            placeholder={options.searchPlaceholder || 'Type to search...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close()
              else if (e.key === 'Enter') {
                const firstVisible = filteredOptions[0]
                if (firstVisible) {
                  selectOption(firstVisible.value, firstVisible.textContent)
                }
              }
            }}
            autoFocus
          />
          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-no-results">{options.noResultsText || 'No results found'}</div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  className={`searchable-select-option ${option.value === selectedValue ? 'selected' : ''}`}
                  onClick={() => selectOption(option.value, option.textContent)}
                >
                  {option.textContent}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect

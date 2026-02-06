/**
 * Format a date value as "Month Day, Year" and optional 12-hour time.
 * e.g. "January 15, 2025" or "January 15, 2025 2:30 PM"
 * @param {string|Date|number} value - Date string, Date object, or timestamp
 * @param {{ showTime?: boolean }} options - showTime: true to include 12-hour time (default: true if value has time)
 * @returns {string} Formatted string or '—' if invalid
 */
export function formatDocumentDate(value, options = {}) {
  if (value === undefined || value === null || value === '') return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '—'

  const hasTime = options.showTime !== false && (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0)
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  if (!hasTime && options.showTime !== true) {
    return datePart
  }
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  return hasTime ? `${datePart} ${timePart}` : datePart
}

/**
 * Always show date and 12-hour time (for timestamps like date_added).
 * "January 15, 2025 2:30 PM"
 */
export function formatDateTime(value) {
  if (value === undefined || value === null || value === '') return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '—'
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  return `${datePart} ${timePart}`
}

/**
 * Date only: "Month Day, Year" (no time).
 * "January 15, 2025"
 */
export function formatDateOnly(value) {
  if (value === undefined || value === null || value === '') return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

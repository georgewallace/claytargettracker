/**
 * CSV Utility Functions
 *
 * Reusable utilities for generating CSV files from data arrays.
 */

/**
 * Escapes a CSV field value according to RFC 4180
 * - Wraps value in quotes if it contains comma, quote, or newline
 * - Escapes internal quotes by doubling them
 * - Handles null/undefined values
 */
export function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Check if value needs to be quoted (contains comma, quote, or newline)
  const needsQuoting = /[",\n\r]/.test(stringValue)

  if (needsQuoting) {
    // Escape internal quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""')
    return `"${escaped}"`
  }

  return stringValue
}

/**
 * Converts an array of objects to a CSV string
 *
 * @param data - Array of data objects to convert
 * @param fields - Array of field configurations with headers and getValue functions
 * @returns CSV string with headers and data rows
 *
 * @example
 * const csv = arrayToCsv(users, [
 *   { header: 'Name', getValue: (user) => user.name },
 *   { header: 'Email', getValue: (user) => user.email }
 * ])
 */
export function arrayToCsv<T>(
  data: T[],
  fields: Array<{
    header: string
    getValue: (item: T) => string | null | undefined
  }>
): string {
  // Create header row
  const headers = fields.map(field => escapeCsvValue(field.header))
  const csvRows = [headers.join(',')]

  // Create data rows
  for (const item of data) {
    const row = fields.map(field => {
      const value = field.getValue(item)
      return escapeCsvValue(value)
    })
    csvRows.push(row.join(','))
  }

  return csvRows.join('\n')
}

/**
 * Sanitizes a filename by removing or replacing invalid characters
 *
 * @param filename - The filename to sanitize
 * @param maxLength - Maximum length for the filename (default: 100)
 * @returns Sanitized filename safe for file systems
 */
export function sanitizeFilename(filename: string, maxLength: number = 100): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '-') // Replace whitespace with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .substring(0, maxLength) // Limit length
}

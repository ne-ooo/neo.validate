import type { Base64Options } from '../types.js'

/**
 * Check if string is valid JSON
 *
 * @param str - String to validate
 * @returns true if valid JSON, false otherwise
 *
 * @example
 * ```ts
 * isJSON('{"key": "value"}') // true
 * isJSON('[1, 2, 3]') // true
 * isJSON('null') // true
 * isJSON('invalid') // false
 * ```
 */
export function isJSON(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Check if string is valid Base64
 *
 * @param str - String to validate
 * @param options - Base64 options
 * @returns true if valid Base64, false otherwise
 *
 * @example
 * ```ts
 * isBase64('SGVsbG8gV29ybGQ=') // true
 * isBase64('SGVsbG8gV29ybGQ') // true (padding optional)
 * isBase64('SGVsbG8-V29ybGQ', { urlSafe: true }) // true
 * ```
 */
export function isBase64(str: string, options: Base64Options = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const { urlSafe = false } = options

  if (urlSafe) {
    // URL-safe Base64: uses - and _ instead of + and /
    return /^[A-Za-z0-9_-]+={0,2}$/.test(str)
  }

  // Standard Base64
  return /^[A-Za-z0-9+/]+={0,2}$/.test(str)
}

/**
 * Check if string is valid hexadecimal
 *
 * @param str - String to validate
 * @returns true if valid hex, false otherwise
 *
 * @example
 * ```ts
 * isHexadecimal('deadbeef') // true
 * isHexadecimal('DEADBEEF') // true
 * isHexadecimal('0x1234') // false (no 0x prefix)
 * ```
 */
export function isHexadecimal(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  return /^[0-9A-Fa-f]+$/.test(str)
}

/**
 * Check if string is valid hex color
 *
 * @param str - String to validate
 * @returns true if valid hex color, false otherwise
 *
 * @example
 * ```ts
 * isHexColor('#fff') // true (3-digit)
 * isHexColor('#ffffff') // true (6-digit)
 * isHexColor('#ffffffff') // true (8-digit with alpha)
 * isHexColor('fff') // false (missing #)
 * ```
 */
export function isHexColor(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // Supports #RGB, #RRGGBB, #RRGGBBAA
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(str)
}

/**
 * Check if string is valid ISO 8601 date
 *
 * @param str - String to validate
 * @returns true if valid ISO 8601, false otherwise
 *
 * @example
 * ```ts
 * isISO8601('2023-12-25') // true
 * isISO8601('2023-12-25T10:30:00Z') // true
 * isISO8601('2023-12-25T10:30:00+00:00') // true
 * ```
 */
export function isISO8601(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // ISO 8601 regex (supports various formats)
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/

  if (!iso8601Regex.test(str)) {
    return false
  }

  // BUG-8a fix: validate calendar date fields directly instead of relying on
  // Date constructor which silently rolls over invalid dates (e.g. Feb 30 → Mar 2)
  const [datePart] = str.split('T')
  const [year, month, day] = (datePart ?? str).split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return false
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return false

  return true
}

/**
 * Check if string is valid RFC 3339 date-time
 *
 * @param str - String to validate
 * @returns true if valid RFC 3339, false otherwise
 *
 * @example
 * ```ts
 * isRFC3339('2023-12-25T10:30:00Z') // true
 * isRFC3339('2023-12-25T10:30:00+00:00') // true
 * isRFC3339('2023-12-25') // false (requires time)
 * ```
 */
export function isRFC3339(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // RFC 3339 requires full date-time format
  const rfc3339Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/

  if (!rfc3339Regex.test(str)) {
    return false
  }

  // BUG-8b fix: validate calendar date fields directly instead of relying on
  // Date constructor which silently rolls over invalid dates (e.g. Feb 30 → Mar 2)
  const datePart = str.substring(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return false
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return false

  return true
}

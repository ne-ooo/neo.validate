import type { Base64Options } from '../types.js'

const STANDARD_BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const URL_SAFE_BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const STANDARD_BASE64_PATTERN = /^([A-Za-z0-9+/]+)(={0,2})$/
const URL_SAFE_BASE64_PATTERN = /^([A-Za-z0-9_-]+)(={0,2})$/
const HEXADECIMAL_PATTERN = /^[0-9A-Fa-f]+$/
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/
const ISO8601_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-])(\d{2}):(\d{2}))?)?$/
const RFC3339_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/
const ZERO_FRACTION_PATTERN = /^0+$/

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
  const alphabet = urlSafe ? URL_SAFE_BASE64_ALPHABET : STANDARD_BASE64_ALPHABET
  const pattern = urlSafe ? URL_SAFE_BASE64_PATTERN : STANDARD_BASE64_PATTERN
  const match = str.match(pattern)
  if (!match) return false

  const data = match[1] ?? ''
  const paddingLength = match[2]?.length ?? 0
  const remainder = data.length % 4
  if (remainder === 1) return false

  if (paddingLength > 0) {
    if (str.length % 4 !== 0) return false
    if (paddingLength === 1 && remainder !== 3) return false
    if (paddingLength === 2 && remainder !== 2) return false
  }

  const lastValue = alphabet.indexOf(data.at(-1) ?? '')
  if (remainder === 2 && (lastValue & 0b1111) !== 0) return false
  if (remainder === 3 && (lastValue & 0b11) !== 0) return false

  return true
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

  return HEXADECIMAL_PATTERN.test(str)
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
  return HEX_COLOR_PATTERN.test(str)
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

  const match = str.match(ISO8601_PATTERN)
  if (!match) return false

  const [, year, month, day, hour, minute, second, fraction, , offsetHour, offsetMinute] = match
  if (!isValidCalendarDate(Number(year), Number(month), Number(day))) return false

  if (hour !== undefined) {
    if (!isValidIsoTime(Number(hour), Number(minute), Number(second), fraction)) return false
    if (
      offsetHour !== undefined &&
      !isValidIsoOffset(Number(offsetHour), Number(offsetMinute))
    ) {
      return false
    }
  }

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

  const match = str.match(RFC3339_PATTERN)
  if (!match) return false

  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match
  if (!isValidCalendarDate(Number(year), Number(month), Number(day))) return false
  if (!isValidTime(Number(hour), Number(minute), Number(second), true)) return false

  if (
    offsetHour !== undefined &&
    !isValidRfc3339Offset(Number(offsetHour), Number(offsetMinute))
  ) {
    return false
  }

  return true
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1) return false

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= (daysByMonth[month - 1] ?? 0)
}

function isValidTime(
  hour: number,
  minute: number,
  second: number,
  allowLeapSecond: boolean
): boolean {
  const maximumSecond = allowLeapSecond ? 60 : 59
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= maximumSecond
}

function isValidIsoTime(
  hour: number,
  minute: number,
  second: number,
  fraction: string | undefined
): boolean {
  if (hour === 24) {
    return (
      minute === 0 &&
      second === 0 &&
      (fraction === undefined || ZERO_FRACTION_PATTERN.test(fraction))
    )
  }

  return isValidTime(hour, minute, second, false)
}

function isValidIsoOffset(hour: number, minute: number): boolean {
  return hour >= 0 && hour <= 14 && minute >= 0 && minute <= 59 && (hour < 14 || minute === 0)
}

function isValidRfc3339Offset(hour: number, minute: number): boolean {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

import type { NumericOptions, IntOptions, FloatOptions } from '../types.js'

const NUMERIC_PATTERN = /^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/
const SIGNED_LEADING_ZERO_PATTERN = /^[+-]?0[0-9]/
const INTEGER_PATTERN = /^[+-]?[0-9]+$/
const DOT_FLOAT_PATTERN = /^[+-]?([0-9]*\.)?[0-9]+([eE][+-]?[0-9]+)?$/
const COMMA_FLOAT_PATTERN = /^[+-]?([0-9]*,)?[0-9]+([eE][+-]?[0-9]+)?$/

/**
 * Check if string is numeric
 *
 * @param str - String to validate
 * @param options - Numeric validation options (min, max, gt, lt)
 * @returns true if numeric, false otherwise
 *
 * @example
 * ```ts
 * isNumeric('123') // true
 * isNumeric('12.5') // true
 * isNumeric('5', { min: 1, max: 10 }) // true
 * isNumeric('15', { min: 1, max: 10 }) // false
 * ```
 */
export function isNumeric(str: string, options: NumericOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  if (!NUMERIC_PATTERN.test(str)) return false

  return isFiniteNumberInRange(Number(str), options)
}

/**
 * Check if string is an integer
 *
 * @param str - String to validate
 * @param options - Integer validation options
 * @returns true if integer, false otherwise
 *
 * @example
 * ```ts
 * isInt('123') // true
 * isInt('12.5') // false
 * isInt('0123', { allowLeadingZeroes: false }) // false
 * isInt('0123', { allowLeadingZeroes: true }) // true
 * ```
 */
export function isInt(str: string, options: IntOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const { allowLeadingZeroes = false } = options

  // Check for leading zeroes
  if (!allowLeadingZeroes && SIGNED_LEADING_ZERO_PATTERN.test(str)) {
    return false
  }

  if (!INTEGER_PATTERN.test(str)) {
    return false
  }

  return isFiniteNumberInRange(Number(str), options)
}

/**
 * Check if string is a float
 *
 * @param str - String to validate
 * @param options - Float validation options
 * @returns true if float, false otherwise
 *
 * @example
 * ```ts
 * isFloat('12.5') // true
 * isFloat('123') // true
 * isFloat('1.5e10') // true
 * isFloat('12,5', { locale: 'de-DE' }) // true
 * ```
 */
export function isFloat(str: string, options: FloatOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const { locale = 'en-US' } = options

  // Support different decimal separators
  const decimalSeparator = locale.startsWith('en') ? '.' : ','
  const floatRegex =
    decimalSeparator === '.'
      ? DOT_FLOAT_PATTERN
      : COMMA_FLOAT_PATTERN

  if (!floatRegex.test(str)) {
    return false
  }

  return isFiniteNumberInRange(Number(str.replace(',', '.')), options)
}

/**
 * Check if string is a decimal (must have decimal separator)
 *
 * @param str - String to validate
 * @param options - Float validation options
 * @returns true if decimal, false otherwise
 *
 * @example
 * ```ts
 * isDecimal('12.5') // true
 * isDecimal('123') // false (no decimal point)
 * isDecimal('12,5', { locale: 'de-DE' }) // true
 * ```
 */
export function isDecimal(str: string, options: FloatOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const { locale = 'en-US' } = options
  const decimalSeparator = locale.startsWith('en') ? '.' : ','

  if (!str.includes(decimalSeparator)) {
    return false
  }

  return isFloat(str, options)
}

function isFiniteNumberInRange(num: number, options: NumericOptions): boolean {
  if (!Number.isFinite(num)) return false

  const { min, max, gt, lt } = options
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false
  if (gt !== undefined && num <= gt) return false
  if (lt !== undefined && num >= lt) return false

  return true
}

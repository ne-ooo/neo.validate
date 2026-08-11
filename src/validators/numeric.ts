import type { NumericOptions, IntOptions, FloatOptions } from '../types.js'

const NUMERIC_PATTERN = /^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/
const SIGNED_LEADING_ZERO_PATTERN = /^[+-]?0[0-9]/
const INTEGER_PATTERN = /^[+-]?[0-9]+$/
const DOT_FLOAT_PATTERN = /^[+-]?([0-9]*\.)?[0-9]+([eE][+-]?[0-9]+)?$/
const decimalSeparatorCache = new Map<string, string>()

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

  if (!isNumericOptions(options) || !NUMERIC_PATTERN.test(str)) return false

  return isDecimalInRange(str, options)
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

  if (!isIntOptions(options)) return false
  const { allowLeadingZeroes = false } = options

  // Check for leading zeroes
  if (!allowLeadingZeroes && SIGNED_LEADING_ZERO_PATTERN.test(str)) {
    return false
  }

  if (!INTEGER_PATTERN.test(str)) {
    return false
  }

  return isDecimalInRange(str, options)
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

  if (!isFloatOptions(options)) return false
  const { locale = 'en-US' } = options

  const decimalSeparator = getDecimalSeparator(locale)
  if (!decimalSeparator) return false
  if (decimalSeparator !== '.' && str.includes('.')) return false
  const normalized = decimalSeparator === '.' ? str : str.replace(decimalSeparator, '.')

  if (!DOT_FLOAT_PATTERN.test(normalized)) {
    return false
  }

  return isDecimalInRange(normalized, options)
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

  if (!isFloatOptions(options)) return false
  const { locale = 'en-US' } = options
  const decimalSeparator = getDecimalSeparator(locale)
  if (!decimalSeparator) return false

  if (!str.includes(decimalSeparator)) {
    return false
  }

  return isFloat(str, options)
}

function isDecimalInRange(value: string, options: NumericOptions): boolean {
  if (!hasRange(options)) return true
  const parsedValue = parseDecimal(value)
  if (!parsedValue) return false
  const { min, max, gt, lt } = options
  if (min !== undefined && compareDecimals(parsedValue, parseFiniteNumber(min)) < 0) return false
  if (max !== undefined && compareDecimals(parsedValue, parseFiniteNumber(max)) > 0) return false
  if (gt !== undefined && compareDecimals(parsedValue, parseFiniteNumber(gt)) <= 0) return false
  if (lt !== undefined && compareDecimals(parsedValue, parseFiniteNumber(lt)) >= 0) return false

  return true
}

interface DecimalParts {
  negative: boolean
  digits: string
  exponent: number
}

function parseDecimal(value: string): DecimalParts | null {
  let unsigned = value
  let negative = false
  if (unsigned.startsWith('-') || unsigned.startsWith('+')) {
    negative = unsigned[0] === '-'
    unsigned = unsigned.slice(1)
  }

  const exponentIndex = unsigned.search(/[eE]/)
  const coefficient = exponentIndex === -1 ? unsigned : unsigned.slice(0, exponentIndex)
  const exponentText = exponentIndex === -1 ? '0' : unsigned.slice(exponentIndex + 1)
  const parsedExponent = Number(exponentText)
  if (Number.isNaN(parsedExponent)) return null

  const decimalIndex = coefficient.indexOf('.')
  const fractionLength = decimalIndex === -1 ? 0 : coefficient.length - decimalIndex - 1
  let digits = coefficient.replace('.', '').replace(/^0+/, '')
  if (!digits) return { negative: false, digits: '0', exponent: 0 }

  let lastSignificantIndex = digits.length
  while (lastSignificantIndex > 0 && digits.charCodeAt(lastSignificantIndex - 1) === 48) {
    lastSignificantIndex -= 1
  }
  const trailingZeroes = digits.length - lastSignificantIndex
  digits = digits.slice(0, lastSignificantIndex)

  return {
    negative,
    digits,
    exponent: parsedExponent - fractionLength + trailingZeroes,
  }
}

function parseFiniteNumber(value: number): DecimalParts {
  return parseDecimal(String(value))!
}

function compareDecimals(left: DecimalParts, right: DecimalParts): number {
  if (left.digits === '0' && right.digits === '0') return 0
  if (left.digits === '0') return right.negative ? 1 : -1
  if (right.digits === '0') return left.negative ? -1 : 1
  if (left.negative !== right.negative) return left.negative ? -1 : 1

  const magnitude = compareMagnitudes(left, right)
  return left.negative ? -magnitude : magnitude
}

function compareMagnitudes(left: DecimalParts, right: DecimalParts): number {
  const leftOrder = left.digits.length + left.exponent
  const rightOrder = right.digits.length + right.exponent
  if (leftOrder !== rightOrder) return leftOrder < rightOrder ? -1 : 1

  const maximumLength = Math.max(left.digits.length, right.digits.length)
  for (let index = 0; index < maximumLength; index++) {
    const leftDigit = left.digits[index] ?? '0'
    const rightDigit = right.digits[index] ?? '0'
    if (leftDigit !== rightDigit) return leftDigit < rightDigit ? -1 : 1
  }

  return 0
}

function getDecimalSeparator(locale: string): string | null {
  const cached = decimalSeparatorCache.get(locale)
  if (cached) return cached

  let separator: string | undefined
  try {
    separator = new Intl.NumberFormat(locale, { useGrouping: false })
      .formatToParts(1.1)
      .find((part) => part.type === 'decimal')?.value
  } catch {
    return null
  }

  if (!separator) return null
  if (decimalSeparatorCache.size >= 32) decimalSeparatorCache.clear()
  decimalSeparatorCache.set(locale, separator)
  return separator
}

function hasRange(options: NumericOptions): boolean {
  return (
    options.min !== undefined ||
    options.max !== undefined ||
    options.gt !== undefined ||
    options.lt !== undefined
  )
}

function isNumericOptions(value: unknown): value is NumericOptions {
  if (!value || typeof value !== 'object') return false
  const { min, max, gt, lt } = value as NumericOptions
  return [min, max, gt, lt].every(
    (bound) => bound === undefined || (typeof bound === 'number' && Number.isFinite(bound))
  )
}

function isIntOptions(value: unknown): value is IntOptions {
  if (!isNumericOptions(value)) return false
  const { allowLeadingZeroes } = value as IntOptions
  return allowLeadingZeroes === undefined || typeof allowLeadingZeroes === 'boolean'
}

function isFloatOptions(value: unknown): value is FloatOptions {
  if (!isNumericOptions(value)) return false
  const { locale } = value as FloatOptions
  return locale === undefined || typeof locale === 'string'
}

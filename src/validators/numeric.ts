import type { NumericOptions, IntOptions, FloatOptions } from '../types.js'
import { INVALID_OPTION, readOwnDataOption } from '../options.js'

const NUMERIC_PATTERN = /^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/
const SIGNED_LEADING_ZERO_PATTERN = /^[+-]?0[0-9]/
const INTEGER_PATTERN = /^[+-]?[0-9]+$/
const DOT_FLOAT_PATTERN = /^[+-]?([0-9]*\.)?[0-9]+([eE][+-]?[0-9]+)?$/
const MAX_LOCALE_LENGTH = 128
const MAX_DECIMAL_SEPARATOR_CACHE_ENTRIES = 32
const decimalSeparatorCache = new Map<string, string | null>()

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

  const resolvedOptions = resolveNumericOptions(options)
  if (!resolvedOptions || !NUMERIC_PATTERN.test(str)) return false

  return isDecimalInRange(str, resolvedOptions)
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

  const resolvedOptions = resolveIntOptions(options)
  if (!resolvedOptions) return false
  const { allowLeadingZeroes } = resolvedOptions

  // Check for leading zeroes
  if (!allowLeadingZeroes && SIGNED_LEADING_ZERO_PATTERN.test(str)) {
    return false
  }

  if (!INTEGER_PATTERN.test(str)) {
    return false
  }

  return isDecimalInRange(str, resolvedOptions)
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

  const resolvedOptions = resolveFloatOptions(options)
  return resolvedOptions ? validateFloat(str, resolvedOptions) : false
}

function validateFloat(str: string, options: ResolvedFloatOptions): boolean {
  const { locale } = options

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

  const resolvedOptions = resolveFloatOptions(options)
  if (!resolvedOptions) return false
  const { locale } = resolvedOptions
  const decimalSeparator = getDecimalSeparator(locale)
  if (!decimalSeparator) return false

  if (!str.includes(decimalSeparator)) {
    return false
  }

  return validateFloat(str, resolvedOptions)
}

interface ResolvedNumericOptions {
  min?: number
  max?: number
  gt?: number
  lt?: number
}

interface ResolvedIntOptions extends ResolvedNumericOptions {
  allowLeadingZeroes: boolean
}

interface ResolvedFloatOptions extends ResolvedNumericOptions {
  locale: string
}

function isDecimalInRange(value: string, options: ResolvedNumericOptions): boolean {
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
  if (locale.length > MAX_LOCALE_LENGTH) return null
  if (decimalSeparatorCache.has(locale)) {
    const cached = decimalSeparatorCache.get(locale) ?? null
    decimalSeparatorCache.delete(locale)
    decimalSeparatorCache.set(locale, cached)
    return cached
  }

  let separator: string | undefined
  try {
    separator = new Intl.NumberFormat(locale, { useGrouping: false })
      .formatToParts(1.1)
      .find((part) => part.type === 'decimal')?.value
  } catch {
    cacheDecimalSeparator(locale, null)
    return null
  }

  if (!separator) {
    cacheDecimalSeparator(locale, null)
    return null
  }
  cacheDecimalSeparator(locale, separator)
  return separator
}

function cacheDecimalSeparator(locale: string, separator: string | null): void {
  if (decimalSeparatorCache.has(locale)) decimalSeparatorCache.delete(locale)
  if (decimalSeparatorCache.size >= MAX_DECIMAL_SEPARATOR_CACHE_ENTRIES) {
    const oldestKey = decimalSeparatorCache.keys().next().value
    if (oldestKey !== undefined) decimalSeparatorCache.delete(oldestKey)
  }
  decimalSeparatorCache.set(locale, separator)
}

function hasRange(options: ResolvedNumericOptions): boolean {
  return (
    options.min !== undefined ||
    options.max !== undefined ||
    options.gt !== undefined ||
    options.lt !== undefined
  )
}

function resolveNumericOptions(value: unknown): ResolvedNumericOptions | null {
  const min = readOwnDataOption(value, 'min', undefined)
  const max = readOwnDataOption(value, 'max', undefined)
  const gt = readOwnDataOption(value, 'gt', undefined)
  const lt = readOwnDataOption(value, 'lt', undefined)
  const bounds = [min, max, gt, lt]
  if (
    bounds.some((bound) => bound === INVALID_OPTION) ||
    !bounds.every(
    (bound) => bound === undefined || (typeof bound === 'number' && Number.isFinite(bound))
    )
  ) {
    return null
  }
  return { min, max, gt, lt } as ResolvedNumericOptions
}

function resolveIntOptions(value: unknown): ResolvedIntOptions | null {
  const numericOptions = resolveNumericOptions(value)
  const allowLeadingZeroes = readOwnDataOption(value, 'allowLeadingZeroes', false)
  if (!numericOptions || typeof allowLeadingZeroes !== 'boolean') return null
  return { ...numericOptions, allowLeadingZeroes }
}

function resolveFloatOptions(value: unknown): ResolvedFloatOptions | null {
  const numericOptions = resolveNumericOptions(value)
  const locale = readOwnDataOption(value, 'locale', 'en-US')
  if (!numericOptions || typeof locale !== 'string') return null
  return { ...numericOptions, locale }
}

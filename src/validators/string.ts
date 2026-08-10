import type { LengthOptions } from '../types.js'

const ASCII_ALPHA_PATTERN = /^[A-Za-z]+$/
const UNICODE_ALPHA_PATTERN = /^(?:\p{L}\p{M}*)+$/u
const ASCII_ALPHANUMERIC_PATTERN = /^[A-Za-z0-9]+$/
const UNICODE_ALPHANUMERIC_PATTERN = /^(?:[\p{L}\p{N}]\p{M}*)+$/u
const ASCII_PATTERN = /^[\x00-\x7F]*$/

/**
 * Check if string contains only letters (a-z, A-Z)
 *
 * @param str - String to validate
 * @param locale - Locale for character set (default: 'en-US')
 * @returns true if contains only letters, false otherwise
 *
 * @example
 * ```ts
 * isAlpha('hello') // true
 * isAlpha('hello123') // false
 * isAlpha('café', 'fr-FR') // true
 * ```
 */
export function isAlpha(str: string, locale: string = 'en-US'): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const alphaRegex = locale.toLowerCase().startsWith('en')
    ? ASCII_ALPHA_PATTERN
    : UNICODE_ALPHA_PATTERN

  return alphaRegex.test(str)
}

/**
 * Check if string contains only letters and numbers
 *
 * @param str - String to validate
 * @param locale - Locale for character set (default: 'en-US')
 * @returns true if contains only alphanumeric characters, false otherwise
 *
 * @example
 * ```ts
 * isAlphanumeric('hello123') // true
 * isAlphanumeric('hello-world') // false
 * isAlphanumeric('café123', 'fr-FR') // true
 * ```
 */
export function isAlphanumeric(str: string, locale: string = 'en-US'): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const alphanumericRegex = locale.toLowerCase().startsWith('en')
    ? ASCII_ALPHANUMERIC_PATTERN
    : UNICODE_ALPHANUMERIC_PATTERN

  return alphanumericRegex.test(str)
}

/**
 * Check if string length is within range
 *
 * @param str - String to validate
 * @param options - Length options (min, max)
 * @returns true if length is within range, false otherwise
 *
 * @example
 * ```ts
 * isLength('hello', { min: 1, max: 10 }) // true
 * isLength('hello', { min: 10 }) // false
 * isLength('hello', { max: 3 }) // false
 * ```
 */
export function isLength(str: string, options: LengthOptions): boolean {
  if (typeof str !== 'string') {
    return false
  }

  const { min = 0, max = Infinity } = options
  const length = [...str].length

  return length >= min && length <= max
}

/**
 * Check if string contains only ASCII characters
 *
 * @param str - String to validate
 * @returns true if contains only ASCII, false otherwise
 *
 * @example
 * ```ts
 * isAscii('hello') // true
 * isAscii('hello123') // true
 * isAscii('café') // false
 * isAscii('你好') // false
 * ```
 */
export function isAscii(str: string): boolean {
  if (typeof str !== 'string') {
    return false
  }

  return ASCII_PATTERN.test(str)
}

/**
 * Check if string is lowercase
 *
 * @param str - String to validate
 * @returns true if lowercase, false otherwise
 *
 * @example
 * ```ts
 * isLowercase('hello') // true
 * isLowercase('Hello') // false
 * isLowercase('hello123') // true
 * ```
 */
export function isLowercase(str: string): boolean {
  return typeof str === 'string' && str === str.toLowerCase()
}

/**
 * Check if string is uppercase
 *
 * @param str - String to validate
 * @returns true if uppercase, false otherwise
 *
 * @example
 * ```ts
 * isUppercase('HELLO') // true
 * isUppercase('Hello') // false
 * isUppercase('HELLO123') // true
 * ```
 */
export function isUppercase(str: string): boolean {
  return typeof str === 'string' && str === str.toUpperCase()
}

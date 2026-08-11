import type { LengthOptions } from '../types.js'

const ASCII_ALPHA_PATTERN = /^[A-Za-z]+$/
const ASCII_ALPHANUMERIC_PATTERN = /^[A-Za-z0-9]+$/
const ASCII_PATTERN = /^[\x00-\x7F]*$/
const LANGUAGE_SCRIPTS: Readonly<Record<string, readonly string[]>> = {
  ar: ['Arabic'],
  az: ['Latin'],
  bg: ['Cyrillic'],
  bn: ['Bengali'],
  cs: ['Latin'],
  da: ['Latin'],
  de: ['Latin'],
  el: ['Greek'],
  eo: ['Latin'],
  es: ['Latin'],
  fa: ['Arabic'],
  fi: ['Latin'],
  fr: ['Latin'],
  gu: ['Gujarati'],
  he: ['Hebrew'],
  hi: ['Devanagari'],
  hu: ['Latin'],
  it: ['Latin'],
  ja: ['Han', 'Hiragana', 'Katakana'],
  kk: ['Cyrillic'],
  kn: ['Kannada'],
  ko: ['Hangul'],
  ku: ['Arabic'],
  ml: ['Malayalam'],
  nb: ['Latin'],
  nl: ['Latin'],
  nn: ['Latin'],
  or: ['Oriya'],
  pa: ['Gurmukhi'],
  pl: ['Latin'],
  pt: ['Latin'],
  ru: ['Cyrillic'],
  si: ['Sinhala'],
  sk: ['Latin'],
  sl: ['Latin'],
  sr: ['Cyrillic'],
  sv: ['Latin'],
  ta: ['Tamil'],
  te: ['Telugu'],
  th: ['Thai'],
  tr: ['Latin'],
  uk: ['Cyrillic'],
  vi: ['Latin'],
  zh: ['Han', 'Bopomofo'],
}
const localePatternCache = new Map<string, RegExp>()
const resolvedLocalePatternCache = new Map<string, RegExp | null>()

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

  if (typeof locale !== 'string') return false

  const alphaRegex = getLocalePattern(locale, false)

  return alphaRegex?.test(str) ?? false
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

  if (typeof locale !== 'string') return false

  const alphanumericRegex = getLocalePattern(locale, true)

  return alphanumericRegex?.test(str) ?? false
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
export function isLength(str: string, options: LengthOptions = {}): boolean {
  if (typeof str !== 'string') {
    return false
  }

  if (!isLengthOptions(options)) return false

  const { min = 0, max = Infinity } = options
  let length = 0
  for (const _character of str) {
    length += 1
    if (length > max) return false
  }

  return length >= min && length <= max
}

function getLocalePattern(locale: string, alphanumeric: boolean): RegExp | null {
  if (locale === 'en-US') {
    return alphanumeric ? ASCII_ALPHANUMERIC_PATTERN : ASCII_ALPHA_PATTERN
  }

  const resolvedCacheKey = `${alphanumeric ? 'alphanumeric' : 'alpha'}:${locale}`
  if (resolvedLocalePatternCache.has(resolvedCacheKey)) {
    return resolvedLocalePatternCache.get(resolvedCacheKey) ?? null
  }

  const latinOverride = locale.toLowerCase().endsWith('@latin')
  const localeName = latinOverride ? locale.slice(0, -6) : locale
  let parsedLocale: Intl.Locale
  try {
    parsedLocale = new Intl.Locale(localeName)
  } catch {
    cacheResolvedLocale(resolvedCacheKey, null)
    return null
  }

  if (parsedLocale.language === 'en') {
    const pattern = alphanumeric ? ASCII_ALPHANUMERIC_PATTERN : ASCII_ALPHA_PATTERN
    cacheResolvedLocale(resolvedCacheKey, pattern)
    return pattern
  }

  const scripts =
    parsedLocale.language === 'sr' && (parsedLocale.script === 'Latn' || latinOverride)
      ? ['Latin']
      : LANGUAGE_SCRIPTS[parsedLocale.language]
  if (!scripts) {
    cacheResolvedLocale(resolvedCacheKey, null)
    return null
  }

  const cacheKey = `${alphanumeric ? 'alphanumeric' : 'alpha'}:${scripts.join(',')}`
  const cached = localePatternCache.get(cacheKey)
  if (cached) {
    cacheResolvedLocale(resolvedCacheKey, cached)
    return cached
  }

  const scriptParts = scripts.map((script) => `\\p{Script=${script}}`)
  if (alphanumeric) scriptParts.push('[0-9]')
  const scriptPattern = scriptParts.join('|')
  const allowedCategory = alphanumeric ? '[\\p{L}\\p{N}]' : '\\p{L}'
  const pattern = new RegExp(
    `^(?:(?=${allowedCategory})(?:${scriptPattern})\\p{M}*)+$`,
    'u'
  )
  localePatternCache.set(cacheKey, pattern)
  cacheResolvedLocale(resolvedCacheKey, pattern)
  return pattern
}

function cacheResolvedLocale(key: string, pattern: RegExp | null): void {
  if (resolvedLocalePatternCache.size >= 64) resolvedLocalePatternCache.clear()
  resolvedLocalePatternCache.set(key, pattern)
}

function isLengthOptions(value: unknown): value is LengthOptions {
  if (!value || typeof value !== 'object') return false
  const { min, max } = value as LengthOptions
  if (min !== undefined && (!Number.isSafeInteger(min) || min < 0)) return false
  if (max !== undefined && (!Number.isSafeInteger(max) || max < 0)) return false
  return min === undefined || max === undefined || min <= max
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

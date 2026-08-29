import type { LengthOptions } from '../types.js'
import { INVALID_OPTION, readOwnDataOption } from '../options.js'

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
  en: ['Latin'],
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
const MAX_LOCALE_LENGTH = 128
const MAX_LOCALE_CACHE_ENTRIES = 64
const localePatternCache = new Map<string, RegExp | null>()
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

  const resolvedOptions = resolveLengthOptions(options)
  if (!resolvedOptions) return false

  const { min, max } = resolvedOptions
  if (min === 0 && max === Infinity) return true
  if (str.length < min) return false
  if (min === 0 && str.length <= max) return true

  let length = 0
  for (const _character of str) {
    length += 1
    if (length > max) return false
    if (max === Infinity && length >= min) return true
  }

  return length >= min && length <= max
}

function getLocalePattern(locale: string, alphanumeric: boolean): RegExp | null {
  if (locale.length > MAX_LOCALE_LENGTH) return null
  if (locale === 'en-US') {
    return alphanumeric ? ASCII_ALPHANUMERIC_PATTERN : ASCII_ALPHA_PATTERN
  }

  const resolvedCacheKey = `${alphanumeric ? 'alphanumeric' : 'alpha'}:${locale}`
  if (resolvedLocalePatternCache.has(resolvedCacheKey)) {
    const cached = resolvedLocalePatternCache.get(resolvedCacheKey) ?? null
    resolvedLocalePatternCache.delete(resolvedCacheKey)
    resolvedLocalePatternCache.set(resolvedCacheKey, cached)
    return cached
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

  const defaultScripts = LANGUAGE_SCRIPTS[parsedLocale.language]
  if (!defaultScripts) {
    cacheResolvedLocale(resolvedCacheKey, null)
    return null
  }

  const scripts = latinOverride
    ? ['Latin']
    : parsedLocale.script
      ? [parsedLocale.script]
      : defaultScripts

  if (
    parsedLocale.language === 'en' &&
    (scripts[0] === 'Latin' || scripts[0] === 'Latn')
  ) {
    const pattern = alphanumeric ? ASCII_ALPHANUMERIC_PATTERN : ASCII_ALPHA_PATTERN
    cacheResolvedLocale(resolvedCacheKey, pattern)
    return pattern
  }

  const cacheKey = `${alphanumeric ? 'alphanumeric' : 'alpha'}:${scripts.join(',')}`
  if (localePatternCache.has(cacheKey)) {
    const cached = localePatternCache.get(cacheKey) ?? null
    localePatternCache.delete(cacheKey)
    localePatternCache.set(cacheKey, cached)
    cacheResolvedLocale(resolvedCacheKey, cached)
    return cached
  }

  const scriptParts = scripts.map((script) => `\\p{Script=${script}}`)
  if (alphanumeric) scriptParts.push('[0-9]')
  const scriptPattern = scriptParts.join('|')
  const allowedCategory = alphanumeric ? '[\\p{L}\\p{N}]' : '\\p{L}'
  let pattern: RegExp
  try {
    pattern = new RegExp(
      `^(?:(?=${allowedCategory})(?:${scriptPattern})\\p{M}*)+$`,
      'u'
    )
  } catch {
    cacheLocalePattern(cacheKey, null)
    cacheResolvedLocale(resolvedCacheKey, null)
    return null
  }
  cacheLocalePattern(cacheKey, pattern)
  cacheResolvedLocale(resolvedCacheKey, pattern)
  return pattern
}

function cacheResolvedLocale(key: string, pattern: RegExp | null): void {
  if (resolvedLocalePatternCache.has(key)) resolvedLocalePatternCache.delete(key)
  if (resolvedLocalePatternCache.size >= MAX_LOCALE_CACHE_ENTRIES) {
    const oldestKey = resolvedLocalePatternCache.keys().next().value
    if (oldestKey !== undefined) resolvedLocalePatternCache.delete(oldestKey)
  }
  resolvedLocalePatternCache.set(key, pattern)
}

function cacheLocalePattern(key: string, pattern: RegExp | null): void {
  if (localePatternCache.has(key)) localePatternCache.delete(key)
  if (localePatternCache.size >= MAX_LOCALE_CACHE_ENTRIES) {
    const oldestKey = localePatternCache.keys().next().value
    if (oldestKey !== undefined) localePatternCache.delete(oldestKey)
  }
  localePatternCache.set(key, pattern)
}

function resolveLengthOptions(value: unknown): { min: number; max: number } | null {
  const min = readOwnDataOption(value, 'min', undefined)
  const max = readOwnDataOption(value, 'max', undefined)
  if (min === INVALID_OPTION || max === INVALID_OPTION) return null
  if (
    min !== undefined &&
    (typeof min !== 'number' || !Number.isSafeInteger(min) || min < 0)
  ) {
    return null
  }
  if (
    max !== undefined &&
    (typeof max !== 'number' || !Number.isSafeInteger(max) || max < 0)
  ) {
    return null
  }
  if (min !== undefined && max !== undefined && min > max) return null
  return { min: min ?? 0, max: max ?? Infinity }
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

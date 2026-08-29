import type { NormalizeEmailOptions } from '../types.js'
import { INVALID_OPTION, readOwnDataOption } from '../options.js'

const DOT_PATTERN = /\./g
const NON_ASCII_PATTERN = /[^\x00-\x7F]/
const LOW_CONTROL_PATTERN = /[\x00-\x1F\x7F]/g
const LOW_CONTROL_EXCEPT_NEWLINES_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
const NORMALIZABLE_LOCAL_PART_PATTERN = /^[\p{L}\p{N}\p{M}!#$%&'*+/=?^_`{|}~.-]+$/u
const INVALID_NORMALIZABLE_DOMAIN_CHARACTER_PATTERN = /[^\p{L}\p{N}\p{M}.-]/u
const NORMALIZABLE_DOMAIN_LABEL_PATTERN =
  /^[\p{L}\p{N}\p{M}](?:[\p{L}\p{N}\p{M}-]*[\p{L}\p{N}\p{M}])?$/u
const utf8Encoder = new TextEncoder()

/**
 * Trim whitespace from both ends of string
 *
 * @param str - String to trim
 * @param chars - Characters to trim (default: whitespace)
 * @returns Trimmed string
 *
 * @example
 * ```ts
 * trim('  hello  ') // 'hello'
 * trim('__hello__', '_') // 'hello'
 * ```
 */
export function trim(str: string, chars?: string): string {
  if (typeof str !== 'string') {
    return ''
  }

  if (chars !== undefined && typeof chars !== 'string') return ''

  if (!chars) {
    return str.trim()
  }

  const trimCharacters = new Set(chars)
  const start = findLeftTrimIndex(str, trimCharacters)
  const end = findRightTrimIndex(str, trimCharacters, start)
  return str.slice(start, end)
}

/**
 * Trim whitespace from left side of string
 *
 * @param str - String to trim
 * @param chars - Characters to trim (default: whitespace)
 * @returns Left-trimmed string
 *
 * @example
 * ```ts
 * ltrim('  hello  ') // 'hello  '
 * ltrim('__hello__', '_') // 'hello__'
 * ```
 */
export function ltrim(str: string, chars?: string): string {
  if (typeof str !== 'string') {
    return ''
  }

  if (chars !== undefined && typeof chars !== 'string') return ''

  if (!chars) {
    return str.trimStart()
  }

  const trimCharacters = new Set(chars)
  return str.slice(findLeftTrimIndex(str, trimCharacters))
}

/**
 * Trim whitespace from right side of string
 *
 * @param str - String to trim
 * @param chars - Characters to trim (default: whitespace)
 * @returns Right-trimmed string
 *
 * @example
 * ```ts
 * rtrim('  hello  ') // '  hello'
 * rtrim('__hello__', '_') // '__hello'
 * ```
 */
export function rtrim(str: string, chars?: string): string {
  if (typeof str !== 'string') {
    return ''
  }

  if (chars !== undefined && typeof chars !== 'string') return ''

  if (!chars) {
    return str.trimEnd()
  }

  const trimCharacters = new Set(chars)
  return str.slice(0, findRightTrimIndex(str, trimCharacters, 0))
}

/**
 * Normalize email address
 *
 * @param email - Email to normalize
 * @param options - Normalization options
 * @returns Normalized email
 *
 * @example
 * ```ts
 * normalizeEmail('Test.User+tag@Gmail.com')
 * // 'testuser@gmail.com'
 *
 * normalizeEmail('user+tag@example.com', { gmailRemoveSubaddress: false })
 * // 'user+tag@example.com'
 * ```
 */
export function normalizeEmail(email: string, options: NormalizeEmailOptions = {}): string {
  if (typeof email !== 'string') return ''
  if (!email.includes('@')) {
    return email
  }

  const resolvedOptions = resolveNormalizeEmailOptions(options)
  if (!resolvedOptions) return email

  const atIndex = email.indexOf('@')
  if (atIndex <= 0 || atIndex !== email.lastIndexOf('@') || atIndex === email.length - 1) {
    return email
  }

  const {
    allLowercase = true,
    gmailRemoveDots = true,
    gmailRemoveSubaddress = true,
    outlookRemoveSubaddress = true,
    yahooRemoveSubaddress = true,
    gmailConvertGooglemail = true,
  } = resolvedOptions

  let local = email.slice(0, atIndex)
  let domain = email.slice(atIndex + 1)
  if (
    exceedsUtf8Length(email, 254) ||
    !isNormalizableLocalPart(local) ||
    !isNormalizableDomain(domain)
  ) {
    return email
  }

  const canonicalDomain = domain.toLowerCase()
  const providerDomain = canonicalDomain.endsWith('.')
    ? canonicalDomain.slice(0, -1)
    : canonicalDomain

  // Convert to lowercase
  if (allLowercase) {
    local = local.toLowerCase()
    domain = canonicalDomain
  }

  // Gmail-specific normalization
  if (
    providerDomain === 'gmail.com' ||
    providerDomain === 'googlemail.com'
  ) {
    // Convert googlemail.com to gmail.com
    if (gmailConvertGooglemail && providerDomain === 'googlemail.com') {
      domain = canonicalDomain.endsWith('.') ? 'gmail.com.' : 'gmail.com'
    }

    // Remove dots from Gmail addresses (Gmail ignores dots)
    if (gmailRemoveDots) {
      local = local.replace(DOT_PATTERN, '')
    }

    // Remove subaddress (+tag)
    if (gmailRemoveSubaddress) {
      const plusIndex = local.indexOf('+')
      if (plusIndex !== -1) {
        local = local.slice(0, plusIndex)
      }
    }
  }

  // Outlook-specific normalization
  if (
    outlookRemoveSubaddress &&
    (providerDomain === 'outlook.com' ||
      providerDomain === 'hotmail.com' ||
      providerDomain === 'live.com')
  ) {
    const plusIndex = local.indexOf('+')
    if (plusIndex !== -1) {
      local = local.slice(0, plusIndex)
    }
  }

  // Yahoo-specific normalization
  if (yahooRemoveSubaddress && providerDomain === 'yahoo.com') {
    const hyphenIndex = local.indexOf('-')
    if (hyphenIndex !== -1) {
      local = local.slice(0, hyphenIndex)
    }
  }

  return isNormalizableLocalPart(local) ? `${local}@${domain}` : email
}

function findLeftTrimIndex(value: string, trimCharacters: ReadonlySet<string>): number {
  let index = 0
  for (const character of value) {
    if (!trimCharacters.has(character)) break
    index += character.length
  }

  return index
}

function findRightTrimIndex(
  value: string,
  trimCharacters: ReadonlySet<string>,
  minimumIndex: number
): number {
  let index = value.length
  while (index > minimumIndex) {
    const finalCodeUnit = value.charCodeAt(index - 1)
    const hasSurrogatePair =
      finalCodeUnit >= 0xdc00 &&
      finalCodeUnit <= 0xdfff &&
      index - 2 >= minimumIndex &&
      value.charCodeAt(index - 2) >= 0xd800 &&
      value.charCodeAt(index - 2) <= 0xdbff
    const characterLength = hasSurrogatePair ? 2 : 1
    const character = value.slice(index - characterLength, index)
    if (!trimCharacters.has(character)) break
    index -= characterLength
  }

  return index
}

function isNormalizableLocalPart(value: string): boolean {
  return (
    value.length > 0 &&
    !exceedsUtf8Length(value, 64) &&
    !value.startsWith('.') &&
    !value.endsWith('.') &&
    !value.includes('..') &&
    NORMALIZABLE_LOCAL_PART_PATTERN.test(value)
  )
}

function isNormalizableDomain(value: string): boolean {
  const withoutTrailingDot = value.endsWith('.') ? value.slice(0, -1) : value
  if (
    !withoutTrailingDot ||
    exceedsUtf8Length(value, 254) ||
    INVALID_NORMALIZABLE_DOMAIN_CHARACTER_PATTERN.test(withoutTrailingDot)
  ) {
    return false
  }

  return withoutTrailingDot
    .split('.')
    .every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        NORMALIZABLE_DOMAIN_LABEL_PATTERN.test(label)
    )
}

function exceedsUtf8Length(value: string, maximumLength: number): boolean {
  if (value.length > maximumLength) return true
  return NON_ASCII_PATTERN.test(value) && utf8Encoder.encode(value).length > maximumLength
}

/**
 * Remove control characters (ASCII 0-31 and 127)
 *
 * @param str - String to strip
 * @param keepNewLines - Keep newline characters (default: false)
 * @returns String with control characters removed
 *
 * @example
 * ```ts
 * stripLow('hello\x00world') // 'helloworld'
 * stripLow('hello\nworld', true) // 'hello\nworld'
 * ```
 */
export function stripLow(str: string, keepNewLines: boolean = false): string {
  if (typeof str !== 'string') {
    return ''
  }

  if (typeof keepNewLines !== 'boolean') return ''

  if (keepNewLines) {
    // Remove control characters except \n (10), \r (13), \t (9)
    return str.replace(LOW_CONTROL_EXCEPT_NEWLINES_PATTERN, '')
  }

  // Remove all control characters
  return str.replace(LOW_CONTROL_PATTERN, '')
}

function resolveNormalizeEmailOptions(value: unknown): Required<NormalizeEmailOptions> | null {
  const allLowercase = readOwnDataOption(value, 'allLowercase', true)
  const gmailRemoveDots = readOwnDataOption(value, 'gmailRemoveDots', true)
  const gmailRemoveSubaddress = readOwnDataOption(value, 'gmailRemoveSubaddress', true)
  const outlookRemoveSubaddress = readOwnDataOption(value, 'outlookRemoveSubaddress', true)
  const yahooRemoveSubaddress = readOwnDataOption(value, 'yahooRemoveSubaddress', true)
  const gmailConvertGooglemail = readOwnDataOption(
    value,
    'gmailConvertGooglemail',
    true
  )
  const resolved = {
    allLowercase,
    gmailRemoveDots,
    gmailRemoveSubaddress,
    outlookRemoveSubaddress,
    yahooRemoveSubaddress,
    gmailConvertGooglemail,
  }
  if (
    Object.values(resolved).some(
      (option) => option === INVALID_OPTION || typeof option !== 'boolean'
    )
  ) {
    return null
  }
  return resolved as Required<NormalizeEmailOptions>
}

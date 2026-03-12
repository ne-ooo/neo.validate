import type { NormalizeEmailOptions } from '../types.js'

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

  if (!chars) {
    return str.trim()
  }

  // Escape special regex characters
  const escapedChars = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^[${escapedChars}]+|[${escapedChars}]+$`, 'g')
  return str.replace(regex, '')
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

  if (!chars) {
    return str.trimStart()
  }

  const escapedChars = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^[${escapedChars}]+`, 'g')
  return str.replace(regex, '')
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

  if (!chars) {
    return str.trimEnd()
  }

  const escapedChars = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`[${escapedChars}]+$`, 'g')
  return str.replace(regex, '')
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
  if (typeof email !== 'string' || !email.includes('@')) {
    return email
  }

  const {
    allLowercase = true,
    gmailRemoveDots = true,
    gmailRemoveSubaddress = true,
    outlookRemoveSubaddress = true,
    yahooRemoveSubaddress = true,
    gmailConvertGooglemail = true,
  } = options

  let [local, domain] = email.split('@') as [string, string]

  // Convert to lowercase
  if (allLowercase) {
    local = local.toLowerCase()
    domain = domain.toLowerCase()
  }

  // Gmail-specific normalization
  if (
    domain === 'gmail.com' ||
    (gmailConvertGooglemail && domain === 'googlemail.com')
  ) {
    // Convert googlemail.com to gmail.com
    if (gmailConvertGooglemail && domain === 'googlemail.com') {
      domain = 'gmail.com'
    }

    // Remove dots from Gmail addresses (Gmail ignores dots)
    if (gmailRemoveDots) {
      local = local.replace(/\./g, '')
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
    (domain === 'outlook.com' ||
      domain === 'hotmail.com' ||
      domain === 'live.com')
  ) {
    const plusIndex = local.indexOf('+')
    if (plusIndex !== -1) {
      local = local.slice(0, plusIndex)
    }
  }

  // Yahoo-specific normalization
  if (yahooRemoveSubaddress && domain === 'yahoo.com') {
    const hyphenIndex = local.indexOf('-')
    if (hyphenIndex !== -1) {
      local = local.slice(0, hyphenIndex)
    }
  }

  return `${local}@${domain}`
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

  if (keepNewLines) {
    // Remove control characters except \n (10), \r (13), \t (9)
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  }

  // Remove all control characters
  return str.replace(/[\x00-\x1F\x7F]/g, '')
}

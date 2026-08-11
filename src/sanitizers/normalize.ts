import type { NormalizeEmailOptions } from '../types.js'

const DOT_PATTERN = /\./g
const LOW_CONTROL_PATTERN = /[\x00-\x1F\x7F]/g
const LOW_CONTROL_EXCEPT_NEWLINES_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

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

  const escapedChars = escapeCharacterClass(chars)
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

  if (chars !== undefined && typeof chars !== 'string') return ''

  if (!chars) {
    return str.trimStart()
  }

  const escapedChars = escapeCharacterClass(chars)
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

  if (chars !== undefined && typeof chars !== 'string') return ''

  if (!chars) {
    return str.trimEnd()
  }

  const escapedChars = escapeCharacterClass(chars)
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
  if (typeof email !== 'string') return ''
  if (!email.includes('@')) {
    return email
  }

  if (!isNormalizeEmailOptions(options)) return email

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
  } = options

  let local = email.slice(0, atIndex)
  let domain = email.slice(atIndex + 1)

  // Convert to lowercase
  if (allLowercase) {
    local = local.toLowerCase()
    domain = domain.toLowerCase()
  }

  // Gmail-specific normalization
  if (
    domain === 'gmail.com' ||
    domain === 'googlemail.com'
  ) {
    // Convert googlemail.com to gmail.com
    if (gmailConvertGooglemail && domain === 'googlemail.com') {
      domain = 'gmail.com'
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

function escapeCharacterClass(value: string): string {
  return [...value]
    .map((character) =>
      character === '\\' || character === '-' || character === ']' || character === '^'
        ? `\\${character}`
        : character
    )
    .join('')
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

function isNormalizeEmailOptions(value: unknown): value is NormalizeEmailOptions {
  if (!value || typeof value !== 'object') return false
  const options = value as NormalizeEmailOptions
  return [
    options.allLowercase,
    options.gmailRemoveDots,
    options.gmailRemoveSubaddress,
    options.outlookRemoveSubaddress,
    options.yahooRemoveSubaddress,
    options.gmailConvertGooglemail,
  ].every((option) => option === undefined || typeof option === 'boolean')
}

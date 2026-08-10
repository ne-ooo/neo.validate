import type { EmailOptions } from '../types.js'

const utf8Encoder = new TextEncoder()
const DISPLAY_ADDRESS_PATTERN = /^(.+?)\s*<([^<>]+)>$/
const DISPLAY_NAME_CONTROL_PATTERN = /[\x00-\x1F\x7F]/
const INVALID_UNQUOTED_DISPLAY_NAME_PATTERN = /[.";<>]/
const UTF8_LOCAL_PART_PATTERN = /^[\p{L}\p{N}\p{M}!#$%&'*+/=?^_`{|}~.-]+$/u
const ASCII_LOCAL_PART_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/
const INVALID_DOMAIN_CHARACTER_PATTERN = /[^\p{L}\p{N}\p{M}.-]/u
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
const TLD_PATTERN = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i

/**
 * Validate email address (RFC 5322 practical regex)
 *
 * Uses practical 99.99% accurate regex instead of full RFC 5322
 * (full RFC regex is 6,343 chars and impractical)
 *
 * @param str - String to validate
 * @param options - Email validation options
 * @returns true if valid email, false otherwise
 *
 * @example
 * ```ts
 * isEmail('test@example.com') // true
 * isEmail('invalid') // false
 * isEmail('test@localhost', { requireTld: false }) // true
 * isEmail('test@spam.com', { hostBlacklist: ['spam.com'] }) // false
 * ```
 */
export function isEmail(str: string, options: EmailOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  if (!options || typeof options !== 'object') return false

  const {
    allowDisplayName = false,
    requireDisplayName = false,
    allowUtf8LocalPart = true,
    requireTld = true,
    blacklistedChars = '',
    hostBlacklist = [],
    hostWhitelist = [],
  } = options

  if (
    typeof blacklistedChars !== 'string' ||
    !Array.isArray(hostBlacklist) ||
    !Array.isArray(hostWhitelist)
  ) {
    return false
  }

  const parsedDisplay = parseDisplayAddress(str)
  if (parsedDisplay) {
    if (!allowDisplayName && !requireDisplayName) return false
    if (!isValidDisplayName(parsedDisplay.displayName)) return false
  } else if (requireDisplayName) {
    return false
  }

  const address = parsedDisplay?.address ?? str
  if (byteLength(address) > 254) return false

  const atIndex = address.indexOf('@')
  if (atIndex <= 0 || atIndex !== address.lastIndexOf('@')) return false

  const localPart = address.slice(0, atIndex)
  const rawDomain = address.slice(atIndex + 1)
  if (byteLength(localPart) > 64 || byteLength(rawDomain) > 254) return false

  const localPartPattern = allowUtf8LocalPart
    ? UTF8_LOCAL_PART_PATTERN
    : ASCII_LOCAL_PART_PATTERN
  if (
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..') ||
    !localPartPattern.test(localPart)
  ) {
    return false
  }

  for (const character of blacklistedChars) {
    if (localPart.includes(character)) return false
  }

  const domain = normalizeDomain(rawDomain, requireTld)
  if (!domain) return false

  if (hostWhitelist.length > 0 && !includesDomain(hostWhitelist, domain)) return false
  if (includesDomain(hostBlacklist, domain)) return false

  return true
}

function parseDisplayAddress(value: string): { displayName: string; address: string } | null {
  const match = value.match(DISPLAY_ADDRESS_PATTERN)
  if (!match) return null

  return {
    displayName: match[1]?.trim() ?? '',
    address: match[2]?.trim() ?? '',
  }
}

function isValidDisplayName(value: string): boolean {
  if (!value || DISPLAY_NAME_CONTROL_PATTERN.test(value)) return false

  const isQuoted = value.startsWith('"') && value.endsWith('"')
  const unquoted = isQuoted ? value.slice(1, -1) : value
  if (!unquoted.trim()) return false

  return isQuoted || !INVALID_UNQUOTED_DISPLAY_NAME_PATTERN.test(unquoted)
}

function includesDomain(hosts: string[], domain: string): boolean {
  for (const host of hosts) {
    const normalizedHost = normalizeDomain(host, false)
    if (normalizedHost === domain) return true
  }

  return false
}

function normalizeDomain(value: string, requireTld: boolean): string | null {
  if (typeof value !== 'string' || !value) return null

  const withoutTrailingDot = value.endsWith('.') ? value.slice(0, -1) : value
  if (
    !withoutTrailingDot ||
    INVALID_DOMAIN_CHARACTER_PATTERN.test(withoutTrailingDot)
  ) {
    return null
  }

  let asciiDomain: string
  try {
    asciiDomain = new URL(`http://${withoutTrailingDot}`).hostname.toLowerCase()
  } catch {
    return null
  }

  if (!asciiDomain || asciiDomain.length > 253) return null
  const labels = asciiDomain.split('.')
  if (requireTld && labels.length < 2) return null
  if (
    labels.some(
      (label) =>
        label.length === 0 ||
        label.length > 63 ||
        !DOMAIN_LABEL_PATTERN.test(label)
    )
  ) {
    return null
  }

  if (requireTld) {
    const tld = labels.at(-1) ?? ''
    if (!TLD_PATTERN.test(tld)) return null
  }

  return asciiDomain
}

function byteLength(value: string): number {
  return utf8Encoder.encode(value).length
}

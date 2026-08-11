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
const DEFAULT_MAX_EMAIL_LENGTH = 254

/**
 * Validate the supported practical email-address subset
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
    maxLength = DEFAULT_MAX_EMAIL_LENGTH,
    allowDisplayName = false,
    requireDisplayName = false,
    allowUtf8LocalPart = true,
    requireTld = true,
    blacklistedChars = '',
    hostBlacklist = [],
    hostWhitelist = [],
  } = options

  if (
    !isPositiveInteger(maxLength) ||
    typeof allowDisplayName !== 'boolean' ||
    typeof requireDisplayName !== 'boolean' ||
    typeof allowUtf8LocalPart !== 'boolean' ||
    typeof requireTld !== 'boolean' ||
    typeof blacklistedChars !== 'string' ||
    !Array.isArray(hostBlacklist) ||
    !Array.isArray(hostWhitelist) ||
    !hostBlacklist.every((host) => typeof host === 'string') ||
    !hostWhitelist.every((host) => typeof host === 'string')
  ) {
    return false
  }

  if (str.length > maxLength) return false

  const hasDisplaySyntax = str.includes('<') || str.includes('>')
  const parsedDisplay = hasDisplaySyntax ? parseDisplayAddress(str) : null
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

  const normalizedWhitelist = normalizeDomains(hostWhitelist)
  const normalizedBlacklist = normalizeDomains(hostBlacklist)
  if (!normalizedWhitelist || !normalizedBlacklist) return false
  if (normalizedWhitelist.length > 0 && !normalizedWhitelist.includes(domain)) return false
  if (normalizedBlacklist.includes(domain)) return false

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

  const startsWithQuote = value.startsWith('"')
  const endsWithQuote = value.endsWith('"')
  if (startsWithQuote || endsWithQuote) {
    if (!startsWithQuote || !endsWithQuote) return false
    return isValidQuotedDisplayName(value.slice(1, -1))
  }

  return Boolean(value.trim()) && !INVALID_UNQUOTED_DISPLAY_NAME_PATTERN.test(value)
}

function isValidQuotedDisplayName(value: string): boolean {
  if (!value.trim()) return false

  for (let index = 0; index < value.length; index++) {
    const character = value[index]
    if (character === '"') return false
    if (character !== '\\') continue
    index += 1
    if (index >= value.length) return false
  }

  return true
}

function normalizeDomains(hosts: string[]): string[] | null {
  const normalized: string[] = []
  for (const host of hosts) {
    const normalizedHost = normalizeDomain(host, false)
    if (!normalizedHost) return null
    normalized.push(normalizedHost)
  }

  return normalized
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

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

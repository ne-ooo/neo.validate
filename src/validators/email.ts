import type { EmailOptions } from '../types.js'
import { normalizeEmailDomain } from '../email-domain.js'
import { copyOwnStringArray, INVALID_OPTION, readOwnDataOption } from '../options.js'
import { exceedsUtf8Length } from '../utf8.js'

const DISPLAY_NAME_CONTROL_PATTERN = /[\x00-\x1F\x7F]/
const INVALID_UNQUOTED_DISPLAY_NAME_PATTERN = /[.";<>]/
const UTF8_LOCAL_PART_PATTERN = /^[\p{L}\p{N}\p{M}!#$%&'*+/=?^_`{|}~.-]+$/u
const ASCII_LOCAL_PART_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/
const DEFAULT_MAX_EMAIL_LENGTH = 254
const ALWAYS_INVALID_EMAIL = (_str: string): boolean => false

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
export function isEmail(
  str: string,
  options: EmailOptions | undefined = undefined
): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const resolvedOptions = options === undefined
    ? DEFAULT_RESOLVED_EMAIL_OPTIONS
    : resolveEmailOptions(options)
  return resolvedOptions ? validateEmail(str, resolvedOptions) : false
}

/**
 * Compile an immutable email-validation policy for repeated use
 *
 * Invalid options produce a validator that always returns false.
 */
export function createEmailValidator(
  options: EmailOptions | undefined = undefined
): (str: string) => boolean {
  const resolvedOptions = options === undefined
    ? DEFAULT_RESOLVED_EMAIL_OPTIONS
    : resolveEmailOptions(options)
  return resolvedOptions
    ? (str: string) => validateEmail(str, resolvedOptions)
    : ALWAYS_INVALID_EMAIL
}

interface ResolvedEmailOptions {
  maxLength: number
  allowDisplayName: boolean
  requireDisplayName: boolean
  allowUtf8LocalPart: boolean
  requireTld: boolean
  blacklistedChars: string
  hostBlacklist: ReadonlySet<string>
  hostWhitelist: ReadonlySet<string>
}

const DEFAULT_RESOLVED_EMAIL_OPTIONS = Object.freeze(resolveEmailOptions({})!)

function validateEmail(str: string, options: ResolvedEmailOptions): boolean {
  if (typeof str !== 'string' || str.length === 0) return false
  const {
    maxLength,
    allowDisplayName,
    requireDisplayName,
    allowUtf8LocalPart,
    requireTld,
    blacklistedChars,
    hostBlacklist,
    hostWhitelist,
  } = options

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
  if (exceedsUtf8Length(address, 254)) return false

  const atIndex = address.indexOf('@')
  if (atIndex <= 0 || atIndex !== address.lastIndexOf('@')) return false

  const localPart = address.slice(0, atIndex)
  const rawDomain = address.slice(atIndex + 1)
  if (
    exceedsUtf8Length(localPart, 64) ||
    exceedsUtf8Length(rawDomain, 254)
  ) {
    return false
  }

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

  const domain = normalizeEmailDomain(rawDomain, requireTld)
  if (!domain) return false

  if (hostWhitelist.size > 0 && !hostWhitelist.has(domain)) return false
  if (hostBlacklist.has(domain)) return false

  return true
}

function resolveEmailOptions(value: unknown): ResolvedEmailOptions | null {
  if (!value || typeof value !== 'object') return null

  try {
    const maxLength = readOwnDataOption(value, 'maxLength', DEFAULT_MAX_EMAIL_LENGTH)
    const allowDisplayName = readOwnDataOption(value, 'allowDisplayName', false)
    const requireDisplayName = readOwnDataOption(value, 'requireDisplayName', false)
    const allowUtf8LocalPart = readOwnDataOption(value, 'allowUtf8LocalPart', true)
    const requireTld = readOwnDataOption(value, 'requireTld', true)
    const blacklistedChars = readOwnDataOption(value, 'blacklistedChars', '')
    const hostBlacklistValue = readOwnDataOption(value, 'hostBlacklist', [])
    const hostWhitelistValue = readOwnDataOption(value, 'hostWhitelist', [])
    const hostBlacklistValues = copyOwnStringArray(hostBlacklistValue)
    const hostWhitelistValues = copyOwnStringArray(hostWhitelistValue)

    if (
      maxLength === INVALID_OPTION ||
      allowDisplayName === INVALID_OPTION ||
      requireDisplayName === INVALID_OPTION ||
      allowUtf8LocalPart === INVALID_OPTION ||
      requireTld === INVALID_OPTION ||
      blacklistedChars === INVALID_OPTION ||
      hostBlacklistValue === INVALID_OPTION ||
      hostWhitelistValue === INVALID_OPTION ||
      !isPositiveInteger(maxLength) ||
      typeof allowDisplayName !== 'boolean' ||
      typeof requireDisplayName !== 'boolean' ||
      typeof allowUtf8LocalPart !== 'boolean' ||
      typeof requireTld !== 'boolean' ||
      typeof blacklistedChars !== 'string' ||
      !hostBlacklistValues ||
      !hostWhitelistValues
    ) {
      return null
    }

    const hostBlacklist = normalizeDomains(hostBlacklistValues)
    const hostWhitelist = normalizeDomains(hostWhitelistValues)
    if (!hostBlacklist || !hostWhitelist) return null

    return {
      maxLength,
      allowDisplayName,
      requireDisplayName,
      allowUtf8LocalPart,
      requireTld,
      blacklistedChars,
      hostBlacklist,
      hostWhitelist,
    }
  } catch {
    return null
  }
}

function parseDisplayAddress(value: string): { displayName: string; address: string } | null {
  if (!value.endsWith('>')) return null

  const openingBracketIndex = value.indexOf('<')
  const closingBracketIndex = value.length - 1
  if (
    openingBracketIndex <= 0 ||
    openingBracketIndex !== value.lastIndexOf('<') ||
    closingBracketIndex !== value.indexOf('>')
  ) {
    return null
  }

  return {
    displayName: value.slice(0, openingBracketIndex).trim(),
    address: value.slice(openingBracketIndex + 1, closingBracketIndex).trim(),
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

function normalizeDomains(hosts: string[]): ReadonlySet<string> | null {
  const normalized = new Set<string>()
  for (const host of hosts) {
    const normalizedHost = normalizeEmailDomain(host, false)
    if (!normalizedHost) return null
    normalized.add(normalizedHost)
  }

  return normalized
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

import type { EmailOptions } from '../types.js'

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

  const {
    allowDisplayName: _allowDisplayName = false,
    requireDisplayName: _requireDisplayName = false,
    allowUtf8LocalPart = true,
    requireTld = true,
    blacklistedChars = '',
    hostBlacklist = [],
    hostWhitelist = [],
  } = options

  // Practical email regex (99.99% accurate)
  // Adjust regex based on requirements
  let emailRegex: RegExp

  if (allowUtf8LocalPart) {
    // UTF-8 support — reject consecutive dots, leading/trailing dots in local part
    emailRegex = requireTld
      ? /^[^\s@.][^\s@]*@[^\s@]+\.[^\s@]+$/  // Requires TLD (dot in domain)
      : /^[^\s@.][^\s@]*@[^\s@]+$/           // No TLD required
  } else {
    // ASCII-only - strict RFC 5322-based regex
    emailRegex = requireTld
      ? /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      : /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  }

  if (!emailRegex.test(str)) {
    return false
  }

  // Reject consecutive dots in local part (RFC 5322)
  const localPart = str.split('@')[0]!
  if (localPart.includes('..') || localPart.endsWith('.')) {
    return false
  }

  // Extract parts
  const parts = str.split('@')
  if (parts.length !== 2) {
    return false
  }

  const domain = parts[1]
  if (!domain) {
    return false
  }

  // TLD validation
  if (requireTld && !domain.includes('.')) {
    return false
  }

  // Blacklisted chars
  if (blacklistedChars && new RegExp(`[${blacklistedChars}]`).test(str)) {
    return false
  }

  // Host whitelist/blacklist
  if (hostWhitelist.length > 0 && !hostWhitelist.includes(domain)) {
    return false
  }
  if (hostBlacklist.length > 0 && hostBlacklist.includes(domain)) {
    return false
  }

  return true
}

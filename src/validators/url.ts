import type { URLOptions } from '../types.js'

/**
 * Validate URL (RFC 3986)
 *
 * Supports http, https, ftp, file, data URLs
 *
 * @param str - String to validate
 * @param options - URL validation options
 * @returns true if valid URL, false otherwise
 *
 * @example
 * ```ts
 * isURL('https://example.com') // true
 * isURL('example.com', { requireProtocol: false }) // true
 * isURL('ftp://files.example.com') // true
 * isURL('http://spam.com', { disallowedHosts: ['spam.com'] }) // false
 * ```
 */
export function isURL(str: string, options: URLOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const {
    protocols = ['http', 'https', 'ftp'],
    requireProtocol = true,  // Changed to true to match validator.js behavior
    requireHost = true,
    requirePort = false,
    requireValidProtocol = true,
    allowQueryComponents = true,
    allowFragments = true,
    allowDataUrl = false,
    allowedHosts = [],
    disallowedHosts = [],
  } = options

  try {
    const url = new URL(str)

    // Protocol validation
    const protocol = url.protocol.slice(0, -1) // Remove trailing ':'

    // Data URL handling (check before protocol validation)
    if (protocol === 'data') {
      return allowDataUrl
    }

    if (requireValidProtocol && !protocols.includes(protocol)) {
      return false
    }

    // Host validation
    if (requireHost && !url.hostname) {
      return false
    }

    // Port validation
    if (requirePort && !url.port) {
      return false
    }

    // Allowed/disallowed hosts
    if (allowedHosts.length > 0 && !allowedHosts.includes(url.hostname)) {
      return false
    }
    if (disallowedHosts.length > 0 && disallowedHosts.includes(url.hostname)) {
      return false
    }

    // Query/fragment validation
    if (!allowQueryComponents && url.search) {
      return false
    }
    if (!allowFragments && url.hash) {
      return false
    }

    return true
  } catch {
    // Invalid URL
    if (requireProtocol) {
      return false
    }

    // Try with default protocol
    try {
      const url = new URL(`http://${str}`)
      // Ensure the URL has a valid hostname
      if (!url.hostname) {
        return false
      }
      return true
    } catch {
      return false
    }
  }
}

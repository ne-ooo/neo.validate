import type { MACAddressOptions } from '../types.js'

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/
const IPV6_PATTERN =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
const MAC_NO_SEPARATOR_PATTERN = /^[0-9A-Fa-f]{12}$/
const MAC_COLON_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/
const MAC_HYPHEN_PATTERN = /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/
const MAC_DOT_PATTERN = /^([0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}$/
const PORT_PATTERN = /^[0-9]+$/

/**
 * Check if string is a valid IP address (IPv4 or IPv6)
 *
 * @param str - String to validate
 * @param version - IP version (4, 6, or undefined for both)
 * @returns true if valid IP, false otherwise
 *
 * @example
 * ```ts
 * isIP('192.168.1.1') // true
 * isIP('192.168.1.1', 4) // true
 * isIP('2001:db8::1') // true
 * isIP('2001:db8::1', 6) // true
 * isIP('invalid') // false
 * ```
 */
export function isIP(str: string, version?: 4 | 6): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  if (version === 4) {
    return isIPv4(str)
  }

  if (version === 6) {
    return isIPv6(str)
  }

  // Both versions allowed
  return isIPv4(str) || isIPv6(str)
}

/**
 * Check if string is a valid IPv4 address
 */
function isIPv4(str: string): boolean {
  // BUG-8c fix: tightened regex to reject leading zeros in octets.
  // [01]?[0-9][0-9]? matched "001", "007", etc. because the optional [01]? combined with
  // the required [0-9] allowed two leading zeros. Use explicit alternation without [01]? prefix.
  return IPV4_PATTERN.test(str)
}

/**
 * Check if string is a valid IPv6 address
 */
function isIPv6(str: string): boolean {
  // Simplified IPv6 validation (supports standard and compressed formats)
  return IPV6_PATTERN.test(str)
}

/**
 * Check if string is a valid MAC address
 *
 * @param str - String to validate
 * @param options - MAC address options
 * @returns true if valid MAC address, false otherwise
 *
 * @example
 * ```ts
 * isMACAddress('00:1B:63:84:45:E6') // true
 * isMACAddress('00-1B-63-84-45-E6') // true
 * isMACAddress('001B.6384.45E6') // true (Cisco format)
 * isMACAddress('001B638445E6', { noSeparator: true }) // true
 * ```
 */
export function isMACAddress(str: string, options: MACAddressOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const {
    noSeparator = false,
    allowColon = true,
    allowHyphen = true,
    allowDot = false,
  } = options

  // No separator (12 hex characters)
  if (noSeparator) {
    return MAC_NO_SEPARATOR_PATTERN.test(str)
  }

  // Colon separator (00:1B:63:84:45:E6)
  if (allowColon && MAC_COLON_PATTERN.test(str)) {
    return true
  }

  // Hyphen separator (00-1B-63-84-45-E6)
  if (allowHyphen && MAC_HYPHEN_PATTERN.test(str)) {
    return true
  }

  // Dot separator - Cisco format (001B.6384.45E6)
  if (allowDot && MAC_DOT_PATTERN.test(str)) {
    return true
  }

  return false
}

/**
 * Check if string is a valid port number
 *
 * @param str - String to validate
 * @returns true if valid port (1-65535), false otherwise
 *
 * @example
 * ```ts
 * isPort('80') // true
 * isPort('8080') // true
 * isPort('65535') // true
 * isPort('0') // false (ports start at 1)
 * isPort('65536') // false (max is 65535)
 * ```
 */
export function isPort(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // Check if numeric
  if (!PORT_PATTERN.test(str)) {
    return false
  }

  const port = Number(str)

  // Valid port range: 1-65535
  return port >= 1 && port <= 65535
}

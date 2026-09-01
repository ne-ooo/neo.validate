import type { MACAddressOptions } from '../types.js'
import { INVALID_OPTION, readOwnDataOption } from '../options.js'

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/
const IPV6_HEXTET_PATTERN = /^[0-9A-Fa-f]{1,4}$/
const IPV6_ZONE_PATTERN = /^[0-9A-Za-z_.~-]+$/
const MAX_IPV6_ADDRESS_LENGTH = 45
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

  if (version !== undefined) return false

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
  const zoneSeparatorIndex = str.slice(0, MAX_IPV6_ADDRESS_LENGTH + 1).indexOf('%')
  if (zoneSeparatorIndex === -1 && str.length > MAX_IPV6_ADDRESS_LENGTH) return false
  let address = str
  if (zoneSeparatorIndex !== -1) {
    if (zoneSeparatorIndex !== str.lastIndexOf('%')) return false
    const zone = str.slice(zoneSeparatorIndex + 1)
    if (!IPV6_ZONE_PATTERN.test(zone)) return false
    address = str.slice(0, zoneSeparatorIndex)
  }
  if (address.length > MAX_IPV6_ADDRESS_LENGTH) return false

  const compressionIndex = address.indexOf('::')
  const hasCompression = compressionIndex !== -1
  if (hasCompression && compressionIndex !== address.lastIndexOf('::')) return false

  const leftText = hasCompression ? address.slice(0, compressionIndex) : address
  const rightText = hasCompression ? address.slice(compressionIndex + 2) : ''
  const leftParts = leftText ? leftText.split(':') : []
  const rightParts = rightText ? rightText.split(':') : []
  const parts = [...leftParts, ...rightParts]
  if (parts.some((part) => part.length === 0)) return false

  let unitCount = 0
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]!
    if (part.includes('.')) {
      if (index !== parts.length - 1 || !address.endsWith(part) || !isIPv4(part)) return false
      unitCount += 2
      continue
    }

    if (!IPV6_HEXTET_PATTERN.test(part)) return false
    unitCount += 1
  }

  return hasCompression ? unitCount < 8 : unitCount === 8
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

  const noSeparator = readOwnDataOption(options, 'noSeparator', false)
  const allowColon = readOwnDataOption(options, 'allowColon', true)
  const allowHyphen = readOwnDataOption(options, 'allowHyphen', true)
  const allowDot = readOwnDataOption(options, 'allowDot', false)
  if (
    [noSeparator, allowColon, allowHyphen, allowDot].some(
      (value) => value === INVALID_OPTION || typeof value !== 'boolean'
    )
  ) {
    return false
  }

  // No separator (12 hex characters). This option adds a format; it does not
  // disable the independently configured separated formats.
  if (noSeparator && MAC_NO_SEPARATOR_PATTERN.test(str)) return true

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

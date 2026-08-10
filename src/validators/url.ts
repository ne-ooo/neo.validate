import type { URLOptions } from '../types.js'

const DATA_URL_PATTERN = /^data:/i
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i
const AUTHORITY_END_PATTERN = /[/?#]/
const BRACKETED_HOST_WITH_PORT_PATTERN = /^\[[^\]]+\]:\d+$/
const HOST_WITH_PORT_PATTERN = /:\d+$/
const IPV4_PART_PATTERN = /^\d{1,3}$/
const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
const DNS_TLD_PATTERN = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i

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

  if (!options || typeof options !== 'object') return false

  const {
    protocols = ['http', 'https', 'ftp'],
    requireProtocol = true,
    requireHost = true,
    requireTld = false,
    requirePort = false,
    requireValidProtocol = true,
    allowQueryComponents = true,
    allowFragments = true,
    allowDataUrl = false,
    allowedHosts = [],
    disallowedHosts = [],
  } = options

  if (
    !Array.isArray(protocols) ||
    !Array.isArray(allowedHosts) ||
    !Array.isArray(disallowedHosts)
  ) {
    return false
  }

  const isDataUrl = DATA_URL_PATTERN.test(str)
  const hasProtocol = URL_PROTOCOL_PATTERN.test(str)

  if (!isDataUrl && requireProtocol && !hasProtocol) {
    return false
  }

  // Prefix protocol-less input before parsing. Valid input does not use an exception fallback.
  const valueToParse = isDataUrl || hasProtocol ? str : `http://${str}`

  let url: URL
  try {
    url = new URL(valueToParse)
  } catch {
    return false
  }

  const protocol = url.protocol.slice(0, -1).toLowerCase()

  if (protocol === 'data') {
    if (!allowDataUrl) return false
    if (!allowQueryComponents && url.search) return false
    if (!allowFragments && url.hash) return false
    return true
  }

  if (requireValidProtocol && !includesCaseInsensitive(protocols, protocol)) {
    return false
  }

  if (requireHost && !url.hostname) {
    return false
  }

  if (requirePort && !hasExplicitPort(str)) {
    return false
  }

  const hostname = url.hostname.toLowerCase()
  if (allowedHosts.length > 0 && !includesCaseInsensitive(allowedHosts, hostname)) {
    return false
  }
  if (includesCaseInsensitive(disallowedHosts, hostname)) {
    return false
  }

  if (hostname && !isIpHostname(hostname) && !isValidDnsHostname(hostname, requireTld)) {
    return false
  }

  if (!allowQueryComponents && url.search) {
    return false
  }
  if (!allowFragments && url.hash) {
    return false
  }

  return true
}

function includesCaseInsensitive(values: string[], expected: string): boolean {
  for (const value of values) {
    if (typeof value === 'string' && value.toLowerCase() === expected) return true
  }

  return false
}

function hasExplicitPort(value: string): boolean {
  const protocolMatch = value.match(URL_PROTOCOL_PATTERN)
  const withoutScheme = protocolMatch ? value.slice(protocolMatch[0].length) : value
  const authorityEnd = withoutScheme.search(AUTHORITY_END_PATTERN)
  const authority = authorityEnd === -1 ? withoutScheme : withoutScheme.slice(0, authorityEnd)
  const host = authority.slice(authority.lastIndexOf('@') + 1)

  if (host.startsWith('[')) {
    return BRACKETED_HOST_WITH_PORT_PATTERN.test(host)
  }

  return HOST_WITH_PORT_PATTERN.test(host)
}

function isIpHostname(hostname: string): boolean {
  const unwrapped =
    hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
  if (unwrapped.includes(':')) return true

  const parts = unwrapped.split('.')
  return (
    parts.length === 4 &&
    parts.every(
      (part) => IPV4_PART_PATTERN.test(part) && Number(part) >= 0 && Number(part) <= 255
    )
  )
}

function isValidDnsHostname(hostname: string, requireTld: boolean): boolean {
  const normalized = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname
  if (!normalized || normalized.length > 253) return false

  const labels = normalized.split('.')
  if (requireTld && labels.length < 2) return false
  if (
    labels.some(
      (label) =>
        label.length === 0 ||
        label.length > 63 ||
        !DNS_LABEL_PATTERN.test(label)
    )
  ) {
    return false
  }

  if (!requireTld) return true
  const tld = labels.at(-1) ?? ''
  return DNS_TLD_PATTERN.test(tld)
}

import type { URLOptions } from '../types.js'

const DATA_URL_PATTERN = /^data:/i
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i
const AUTHORITY_END_PATTERN = /[/?#]/
const BRACKETED_HOST_WITH_PORT_PATTERN = /^\[[^\]]+\]:\d+$/
const HOST_WITH_PORT_PATTERN = /:\d+$/
const IPV4_PART_PATTERN = /^\d{1,3}$/
const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
const DNS_TLD_PATTERN = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i
const DEFAULT_MAX_URL_LENGTH = 2084

/**
 * Validate a URL with the WHATWG URL parser and policy options
 *
 * Supports HTTP, HTTPS, and FTP by default. Options can enable file and data URLs.
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
    maxLength = DEFAULT_MAX_URL_LENGTH,
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
    !isPositiveInteger(maxLength) ||
    !Array.isArray(protocols) ||
    !Array.isArray(allowedHosts) ||
    !Array.isArray(disallowedHosts) ||
    !protocols.every((protocol) => typeof protocol === 'string' && protocol.length > 0) ||
    !areBooleanOptions([
      requireProtocol,
      requireHost,
      requireTld,
      requirePort,
      requireValidProtocol,
      allowQueryComponents,
      allowFragments,
      allowDataUrl,
    ])
  ) {
    return false
  }

  if (str.length > maxLength) return false

  const normalizedAllowedHosts = normalizeHostList(allowedHosts)
  const normalizedDisallowedHosts = normalizeHostList(disallowedHosts)
  if (!normalizedAllowedHosts || !normalizedDisallowedHosts) return false

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
    if (normalizedAllowedHosts.length > 0) return false
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

  const hostname = normalizeParsedHostname(url.hostname)
  if (url.hostname && !hostname) return false
  if (
    normalizedAllowedHosts.length > 0 &&
    (!hostname || !normalizedAllowedHosts.includes(hostname))
  ) {
    return false
  }
  if (hostname && normalizedDisallowedHosts.includes(hostname)) {
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

function normalizeHostList(values: string[]): string[] | null {
  const normalized: string[] = []
  for (const value of values) {
    const hostname = normalizeHostname(value)
    if (!hostname) return null
    normalized.push(hostname)
  }

  return normalized
}

function normalizeHostname(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) return null

  const hasBrackets = value.startsWith('[') && value.endsWith(']')
  const candidate = value.includes(':') && !hasBrackets ? `[${value}]` : value

  let parsed: URL
  try {
    parsed = new URL(`http://${candidate}`)
  } catch {
    return null
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/'
  ) {
    return null
  }

  let hostname = parsed.hostname.toLowerCase()
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1)
  } else if (hostname.endsWith('.')) {
    hostname = hostname.slice(0, -1)
  }

  return hostname || null
}

function normalizeParsedHostname(value: string): string | null {
  let hostname = value.toLowerCase()
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1)
  } else if (hostname.endsWith('.')) {
    hostname = hostname.slice(0, -1)
  }

  return hostname || null
}

function areBooleanOptions(values: unknown[]): boolean {
  return values.every((value) => typeof value === 'boolean')
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
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

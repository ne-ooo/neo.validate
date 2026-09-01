import type { URLOptions } from '../types.js'
import { copyOwnStringArray, INVALID_OPTION, readOwnDataOption } from '../options.js'
import { isBase64 } from './format.js'

const DATA_URL_PATTERN = /^data:/i
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:\/\//i
const ABSOLUTE_URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i
const UNSAFE_URL_INPUT_PATTERN = /[\\\x00-\x1F\x7F]/
const INVALID_PERCENT_ENCODING_PATTERN = /%(?![0-9A-Fa-f]{2})/
const AUTHORITY_END_PATTERN = /[/?#]/
const BRACKETED_HOST_WITH_PORT_PATTERN = /^\[[^\]]+\]:\d+$/
const HOST_WITH_PORT_PATTERN = /:\d+$/
const IPV4_PART_PATTERN = /^\d{1,3}$/
const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
const DNS_TLD_PATTERN = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i
const DEFAULT_MAX_URL_LENGTH = 2084
const DEFAULT_PROTOCOLS = ['http', 'https', 'ftp'] as const
const ALWAYS_INVALID_URL = (_str: string): boolean => false

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
export function isURL(
  str: string,
  options: URLOptions | undefined = undefined
): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const resolvedOptions = options === undefined
    ? DEFAULT_RESOLVED_URL_OPTIONS
    : resolveUrlOptions(options)
  return resolvedOptions ? validateURL(str, resolvedOptions) : false
}

/**
 * Compile an immutable URL-validation policy for repeated use
 *
 * Invalid options produce a validator that always returns false.
 */
export function createURLValidator(
  options: URLOptions | undefined = undefined
): (str: string) => boolean {
  const resolvedOptions = options === undefined
    ? DEFAULT_RESOLVED_URL_OPTIONS
    : resolveUrlOptions(options)
  return resolvedOptions
    ? (str: string) => validateURL(str, resolvedOptions)
    : ALWAYS_INVALID_URL
}

function validateURL(str: string, resolvedOptions: ResolvedUrlOptions): boolean {
  if (typeof str !== 'string' || str.length === 0) return false
  const {
    maxLength,
    protocols,
    requireProtocol,
    requireHost,
    requireTld,
    requirePort,
    requireValidProtocol,
    allowQueryComponents,
    allowFragments,
    allowDataUrl,
    allowedHosts,
    disallowedHosts,
  } = resolvedOptions

  if (
    str.length > maxLength ||
    str.startsWith(' ') ||
    str.endsWith(' ') ||
    UNSAFE_URL_INPUT_PATTERN.test(str)
  ) {
    return false
  }

  const isDataUrl = DATA_URL_PATTERN.test(str)
  const hasAbsoluteScheme = ABSOLUTE_URL_SCHEME_PATTERN.test(str)

  if (!isDataUrl && requireProtocol && !hasAbsoluteScheme) {
    return false
  }

  // Prefix only input without an absolute scheme. Absolute schemes are parsed
  // as supplied so protocol and host policy apply to the downstream URL.
  const valueToParse = hasAbsoluteScheme ? str : `http://${str}`

  let url: URL
  try {
    url = new URL(valueToParse)
  } catch {
    return false
  }

  const protocol = url.protocol.slice(0, -1).toLowerCase()
  const { hasQueryComponent, hasFragmentComponent } = getUrlComponentPresence(url)

  if (protocol === 'data') {
    if (!allowDataUrl) return false
    if (!isValidDataUrl(url)) return false
    if (allowedHosts.size > 0) return false
    if (!allowQueryComponents && hasQueryComponent) return false
    if (!allowFragments && hasFragmentComponent) return false
    return true
  }

  if (requireValidProtocol && !protocols.has(protocol)) {
    return false
  }

  if ((requireHost || requirePort) && !url.hostname) {
    return false
  }

  if (requirePort && !hasExplicitPort(str)) {
    return false
  }

  const hostname = normalizeParsedHostname(url.hostname)
  if (url.hostname && !hostname) return false
  if (
    allowedHosts.size > 0 &&
    (!hostname || !allowedHosts.has(hostname))
  ) {
    return false
  }
  if (hostname && disallowedHosts.has(hostname)) {
    return false
  }

  if (hostname && !isIpHostname(hostname) && !isValidDnsHostname(hostname, requireTld)) {
    return false
  }

  if (!allowQueryComponents && hasQueryComponent) {
    return false
  }
  if (!allowFragments && hasFragmentComponent) {
    return false
  }

  return true
}

interface ResolvedUrlOptions {
  maxLength: number
  protocols: ReadonlySet<string>
  requireProtocol: boolean
  requireHost: boolean
  requireTld: boolean
  requirePort: boolean
  requireValidProtocol: boolean
  allowQueryComponents: boolean
  allowFragments: boolean
  allowDataUrl: boolean
  allowedHosts: ReadonlySet<string>
  disallowedHosts: ReadonlySet<string>
}

const DEFAULT_RESOLVED_URL_OPTIONS = Object.freeze(resolveUrlOptions({})!)

function resolveUrlOptions(value: unknown): ResolvedUrlOptions | null {
  if (!value || typeof value !== 'object') return null

  try {
    const maxLength = readOwnDataOption(value, 'maxLength', DEFAULT_MAX_URL_LENGTH)
    const protocolsValue = readOwnDataOption(value, 'protocols', DEFAULT_PROTOCOLS)
    const requireProtocol = readOwnDataOption(value, 'requireProtocol', true)
    const requireHost = readOwnDataOption(value, 'requireHost', true)
    const requireTld = readOwnDataOption(value, 'requireTld', false)
    const requirePort = readOwnDataOption(value, 'requirePort', false)
    const requireValidProtocol = readOwnDataOption(value, 'requireValidProtocol', true)
    const allowQueryComponents = readOwnDataOption(value, 'allowQueryComponents', true)
    const allowFragments = readOwnDataOption(value, 'allowFragments', true)
    const allowDataUrl = readOwnDataOption(value, 'allowDataUrl', false)
    const allowedHostsValue = readOwnDataOption(value, 'allowedHosts', [])
    const disallowedHostsValue = readOwnDataOption(value, 'disallowedHosts', [])
    const protocols = copyOwnStringArray(protocolsValue)
    const allowedHostValues = copyOwnStringArray(allowedHostsValue)
    const disallowedHostValues = copyOwnStringArray(disallowedHostsValue)

    if (
      maxLength === INVALID_OPTION ||
      protocolsValue === INVALID_OPTION ||
      requireProtocol === INVALID_OPTION ||
      requireHost === INVALID_OPTION ||
      requireTld === INVALID_OPTION ||
      requirePort === INVALID_OPTION ||
      requireValidProtocol === INVALID_OPTION ||
      allowQueryComponents === INVALID_OPTION ||
      allowFragments === INVALID_OPTION ||
      allowDataUrl === INVALID_OPTION ||
      allowedHostsValue === INVALID_OPTION ||
      disallowedHostsValue === INVALID_OPTION ||
      !isPositiveInteger(maxLength) ||
      !protocols ||
      protocols.some((protocol) => protocol.length === 0) ||
      !allowedHostValues ||
      !disallowedHostValues ||
      typeof requireProtocol !== 'boolean' ||
      typeof requireHost !== 'boolean' ||
      typeof requireTld !== 'boolean' ||
      typeof requirePort !== 'boolean' ||
      typeof requireValidProtocol !== 'boolean' ||
      typeof allowQueryComponents !== 'boolean' ||
      typeof allowFragments !== 'boolean' ||
      typeof allowDataUrl !== 'boolean'
    ) {
      return null
    }

    const allowedHosts = normalizeHostList(allowedHostValues)
    const disallowedHosts = normalizeHostList(disallowedHostValues)
    if (!allowedHosts || !disallowedHosts) return null

    return {
      maxLength,
      protocols: new Set(protocols.map((protocol) => protocol.toLowerCase())),
      requireProtocol,
      requireHost,
      requireTld,
      requirePort,
      requireValidProtocol,
      allowQueryComponents,
      allowFragments,
      allowDataUrl,
      allowedHosts,
      disallowedHosts,
    }
  } catch {
    return null
  }
}

function getUrlComponentPresence(url: URL): {
  hasQueryComponent: boolean
  hasFragmentComponent: boolean
} {
  const queryIndex = url.href.indexOf('?')
  const fragmentIndex = url.href.indexOf('#')
  return {
    hasQueryComponent:
      queryIndex !== -1 && (fragmentIndex === -1 || queryIndex < fragmentIndex),
    hasFragmentComponent: fragmentIndex !== -1,
  }
}

function isValidDataUrl(url: URL): boolean {
  const value = url.pathname
  const commaIndex = value.indexOf(',')
  if (commaIndex === -1 || INVALID_PERCENT_ENCODING_PATTERN.test(value)) return false

  const hasBase64Marker = findBase64Marker(value, commaIndex)
  if (hasBase64Marker === null) return false
  if (!hasBase64Marker) return true

  let data: string
  try {
    data = decodeURIComponent(value.slice(commaIndex + 1))
  } catch {
    return false
  }
  return data.length === 0 || isBase64(data)
}

function findBase64Marker(value: string, commaIndex: number): boolean | null {
  let partStart = 0
  for (let partEnd = 0; partEnd <= commaIndex; partEnd++) {
    if (partEnd !== commaIndex && value.charCodeAt(partEnd) !== 59) continue
    if (partStart === 0 && partEnd > 0) {
      const slashIndex = value.indexOf('/')
      if (slashIndex <= 0 || slashIndex >= partEnd - 1) return null
    }
    if (isBase64Marker(value, partStart, partEnd)) {
      return partEnd === commaIndex ? true : null
    }
    partStart = partEnd + 1
  }
  return false
}

function isBase64Marker(value: string, start: number, end: number): boolean {
  return (
    end - start === 6 &&
    (value.charCodeAt(start) | 32) === 98 &&
    (value.charCodeAt(start + 1) | 32) === 97 &&
    (value.charCodeAt(start + 2) | 32) === 115 &&
    (value.charCodeAt(start + 3) | 32) === 101 &&
    value.charCodeAt(start + 4) === 54 &&
    value.charCodeAt(start + 5) === 52
  )
}

function normalizeHostList(values: string[]): ReadonlySet<string> | null {
  const normalized = new Set<string>()
  for (const value of values) {
    const hostname = normalizeHostname(value)
    if (!hostname) return null
    normalized.add(hostname)
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

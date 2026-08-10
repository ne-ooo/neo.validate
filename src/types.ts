/**
 * Validator return type
 */
export type ValidatorResult = boolean

/**
 * Email validation options
 */
export interface EmailOptions {
  /** Allow display name (e.g., "John Doe <john@example.com>") */
  allowDisplayName?: boolean
  /** Require display name */
  requireDisplayName?: boolean
  /** Allow UTF-8 characters in local part */
  allowUtf8LocalPart?: boolean
  /** Require top-level domain */
  requireTld?: boolean
  /** Blacklisted characters */
  blacklistedChars?: string
  /** Blacklist specific host domains */
  hostBlacklist?: string[]
  /** Whitelist specific host domains */
  hostWhitelist?: string[]
}

/**
 * URL validation options
 */
export interface URLOptions {
  /** Allowed protocols (default: ['http', 'https', 'ftp']) */
  protocols?: string[]
  /** Require protocol in URL */
  requireProtocol?: boolean
  /** Require host in URL */
  requireHost?: boolean
  /** Require a top-level domain for DNS hostnames */
  requireTld?: boolean
  /** Require port in URL */
  requirePort?: boolean
  /** Require valid protocol from allowed list */
  requireValidProtocol?: boolean
  /** Allow query components */
  allowQueryComponents?: boolean
  /** Allow fragments (#hash) */
  allowFragments?: boolean
  /** Allow data URLs */
  allowDataUrl?: boolean
  /** Allowed host domains */
  allowedHosts?: string[]
  /** Disallowed host domains */
  disallowedHosts?: string[]
}

/**
 * Numeric validation options
 */
export interface NumericOptions {
  /** Minimum value (inclusive) */
  min?: number
  /** Maximum value (inclusive) */
  max?: number
  /** Greater than (exclusive) */
  gt?: number
  /** Less than (exclusive) */
  lt?: number
}

/**
 * Integer validation options
 */
export interface IntOptions extends NumericOptions {
  /** Allow leading zeroes (default: false) */
  allowLeadingZeroes?: boolean
}

/**
 * Float validation options
 */
export interface FloatOptions extends NumericOptions {
  /** Locale for decimal separator (default: 'en-US') */
  locale?: string
}

/**
 * Length validation options
 */
export interface LengthOptions {
  /** Minimum length (inclusive) */
  min?: number
  /** Maximum length (inclusive) */
  max?: number
}

/**
 * Base64 validation options
 */
export interface Base64Options {
  /** Use URL-safe Base64 encoding */
  urlSafe?: boolean
}

/**
 * MAC address validation options
 */
export interface MACAddressOptions {
  /** Allow no separator between octets */
  noSeparator?: boolean
  /** Allow colon separator (default: true) */
  allowColon?: boolean
  /** Allow hyphen separator (default: true) */
  allowHyphen?: boolean
  /** Allow dot separator (default: false) */
  allowDot?: boolean
}

/**
 * Email normalization options
 */
export interface NormalizeEmailOptions {
  /** Convert all to lowercase (default: true) */
  allLowercase?: boolean
  /** Remove dots from Gmail addresses (default: true) */
  gmailRemoveDots?: boolean
  /** Remove subaddress from Gmail (+tag) (default: true) */
  gmailRemoveSubaddress?: boolean
  /** Remove subaddress from Outlook (+tag) (default: true) */
  outlookRemoveSubaddress?: boolean
  /** Remove subaddress from Yahoo (-tag) (default: true) */
  yahooRemoveSubaddress?: boolean
  /** Remove googlemail.com and replace with gmail.com (default: true) */
  gmailConvertGooglemail?: boolean
}

/**
 * Supported credit-card providers
 */
export type CreditCardProvider =
  | 'amex'
  | 'dinersclub'
  | 'discover'
  | 'jcb'
  | 'mastercard'
  | 'unionpay'
  | 'visa'

/**
 * Credit-card validation options
 */
export interface CreditCardOptions {
  /** Require a specific card provider */
  provider?: CreditCardProvider
}

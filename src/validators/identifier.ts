/**
 * Check if string is a valid UUID
 *
 * @param str - String to validate
 * @param version - UUID version (1, 3, 4, 5, or undefined for any)
 * @returns true if valid UUID, false otherwise
 *
 * @example
 * ```ts
 * isUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isUUID('550e8400-e29b-41d4-a716-446655440000', 4) // true
 * isUUID('invalid-uuid') // false
 * ```
 */
export function isUUID(str: string, version?: 1 | 3 | 4 | 5): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  const uuidPatterns = {
    1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    all: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  }

  if (version) {
    return uuidPatterns[version].test(str)
  }

  return uuidPatterns.all.test(str)
}

/**
 * Check if string is a valid ISBN
 *
 * @param str - String to validate
 * @param version - ISBN version (10, 13, or undefined for both)
 * @returns true if valid ISBN, false otherwise
 *
 * @example
 * ```ts
 * isISBN('978-0-596-52068-7') // true (ISBN-13)
 * isISBN('0-596-52068-9') // true (ISBN-10)
 * isISBN('9780596520687', 13) // true
 * ```
 */
export function isISBN(str: string, version?: 10 | 13): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // Remove hyphens and spaces
  const sanitized = str.replace(/[\s-]/g, '')

  if (version === 10) {
    return isISBN10(sanitized)
  }

  if (version === 13) {
    return isISBN13(sanitized)
  }

  // Both versions allowed
  return isISBN10(sanitized) || isISBN13(sanitized)
}

/**
 * Validate ISBN-10
 */
function isISBN10(str: string): boolean {
  if (!/^[0-9]{9}[0-9X]$/i.test(str)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(str[i]!, 10) * (10 - i)
  }

  const checksum = str[9]!.toUpperCase()
  sum += checksum === 'X' ? 10 : parseInt(checksum, 10)

  return sum % 11 === 0
}

/**
 * Validate ISBN-13
 */
function isISBN13(str: string): boolean {
  if (!/^[0-9]{13}$/.test(str)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(str[i]!, 10) * (i % 2 === 0 ? 1 : 3)
  }

  const checksum = parseInt(str[12]!, 10)
  return (10 - (sum % 10)) % 10 === checksum
}

/**
 * Check if string is a valid MongoDB ObjectId
 *
 * @param str - String to validate
 * @returns true if valid ObjectId, false otherwise
 *
 * @example
 * ```ts
 * isMongoId('507f1f77bcf86cd799439011') // true
 * isMongoId('invalid') // false
 * ```
 */
export function isMongoId(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // MongoDB ObjectId is 24 hex characters
  return /^[0-9a-f]{24}$/i.test(str)
}

/**
 * Check if string is a valid JSON Web Token (JWT)
 *
 * @param str - String to validate
 * @returns true if valid JWT structure, false otherwise
 *
 * @example
 * ```ts
 * isJWT('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U') // true
 * isJWT('invalid.token') // false
 * ```
 */
export function isJWT(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // JWT has 3 parts separated by dots
  const parts = str.split('.')
  if (parts.length !== 3) {
    return false
  }

  // Each part should be base64url encoded (alphanumeric, -, _)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/

  return parts.every((part) => base64UrlRegex.test(part))
}

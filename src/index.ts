/**
 * @lpm.dev/neo.validate
 *
 * Zero-dependency string validation and sanitization
 * Tree-shakeable alternative to validator.js
 */

// Export types
export type * from './types.js'

// Export email validators
export { createEmailValidator, isEmail } from './validators/email.js'

// Export URL validators
export { createURLValidator, isURL } from './validators/url.js'

// Export numeric validators
export { isNumeric, isInt, isFloat, isDecimal } from './validators/numeric.js'

// Export string validators
export {
  isAlpha,
  isAlphanumeric,
  isLength,
  isAscii,
  isLowercase,
  isUppercase,
} from './validators/string.js'

// Export network validators (Phase 2)
export { isIP, isMACAddress, isPort } from './validators/network.js'

// Export format validators (Phase 2)
export {
  isJSON,
  isBase64,
  isHexadecimal,
  isHexColor,
  isISO8601,
  isRFC3339,
} from './validators/format.js'

// Export identifier validators (Phase 3)
export { isUUID, isISBN, isMongoId, isJWT } from './validators/identifier.js'

// Export credit card validator (Phase 3)
export { isCreditCard } from './validators/credit-card.js'

// Export sanitizers (Phase 4)
export { escape, unescape } from './sanitizers/escape.js'
export { trim, ltrim, rtrim, normalizeEmail, stripLow } from './sanitizers/normalize.js'

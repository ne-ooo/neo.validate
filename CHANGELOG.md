# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-03-09

### Added

- **Email** — `isEmail(str, options?)`
- **URL** — `isURL(str, options?)`
- **Numeric** — `isNumeric`, `isInt`, `isFloat`, `isDecimal`
- **String** — `isAlpha`, `isAlphanumeric`, `isLength`, `isAscii`, `isLowercase`, `isUppercase`
- **Network** — `isIP`, `isMACAddress`, `isPort`
- **Format** — `isJSON`, `isBase64`, `isHexadecimal`, `isHexColor`, `isISO8601`, `isRFC3339`
- **Identifiers** — `isUUID`, `isISBN`, `isMongoId`, `isJWT`
- **Payment** — `isCreditCard` (Luhn algorithm)
- **Sanitizers** — `escape`, `unescape`, `trim`, `ltrim`, `rtrim`, `normalizeEmail`, `stripLow`
- Drop-in compatible API with validator.js
- Zero runtime dependencies
- ESM + CJS dual output with TypeScript declaration files
- Tree-shakeable (`sideEffects: false`)

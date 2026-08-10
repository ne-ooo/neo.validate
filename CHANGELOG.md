# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Add CI checks for supported Node.js versions, coverage limits, package imports, and publish contents
- Add validator.js differential tests for the shared API subset

### Fixed

- Enforce URL host, protocol, port, query, and fragment policies for protocol-less inputs
- Validate email display names, domain labels, byte limits, and literal blacklist characters
- Validate ISO 8601 and RFC 3339 time and timezone ranges
- Require supported card issuer patterns before applying the Luhn checksum
- Correct validator.js migration documentation and remove the drop-in compatibility claim
- Reject malformed Base64, non-decimal numeric syntax, and signed leading-zero integers
- Use Unicode-aware alpha and code-point length validation
- Preserve malformed emails during normalization and treat custom trim characters literally

### Changed

- Add optional URL TLD enforcement and credit-card provider restrictions
- Upgrade Vitest to 3.2.7 and add validator.js benchmark declarations
- Hoist hot-path patterns and entity maps, and reduce temporary URL and email allocations
- Replace static benchmark claims with a reproducible LPM benchmark procedure
- Use the LPM lockfile and release commands for the complete prepublish check

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
- Familiar validator.js-style function names with a separate, typed options API
- Zero runtime dependencies
- ESM + CJS dual output with TypeScript declaration files
- Tree-shakeable (`sideEffects: false`)

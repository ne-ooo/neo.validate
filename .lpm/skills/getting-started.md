---
name: getting-started
description: How to use neo.validate — 30+ string validators (isEmail, isURL, isNumeric, isInt, isFloat, isAlpha, isIP, isUUID, isJSON, isBase64, isCreditCard, isISBN, isJWT, isISO8601) and sanitizers (escape, unescape, trim, normalizeEmail, stripLow), options for each validator, tree-shakeable imports, TypeScript types
version: "1.2.0"
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Getting Started with @lpm.dev/neo.validate

## Overview

neo.validate is a zero-dependency string validation and sanitization library. It provides tree-shakeable named functions and a TypeScript-first API. It is not a drop-in validator.js replacement. Option names and defaults can differ.

## Quick Start

```typescript
import { isEmail, isURL, isNumeric, escape, normalizeEmail } from '@lpm.dev/neo.validate'

isEmail('user@example.com')                     // true
isURL('https://example.com')                    // true
isNumeric('123', { min: 1, max: 1000 })         // true
escape('<script>alert("XSS")</script>')         // '&lt;script&gt;...'
normalizeEmail('Test+Tag@GMAIL.COM')            // 'test@gmail.com'
```

All validators return `boolean`. All sanitizers return `string`. No exceptions thrown.

## Email Validation

```typescript
import { isEmail } from '@lpm.dev/neo.validate'

isEmail('user@example.com')           // true
isEmail('user.name@example.com')      // true
isEmail('user+tag@example.com')       // true
isEmail('invalid')                    // false
isEmail('user@localhost')             // false (requires TLD by default)

// Options
isEmail('user@localhost', { requireTld: false })           // true
isEmail('Name <user@example.com>', { allowDisplayName: true })  // true
isEmail('user@blocked.com', { hostBlacklist: ['blocked.com'] }) // false
isEmail('user@allowed.com', { hostWhitelist: ['allowed.com'] }) // true
isEmail('用户@example.com', { allowUtf8LocalPart: true })       // true (default)
```

**EmailOptions**: `maxLength` (default: 254), `allowDisplayName`, `requireDisplayName`, `allowUtf8LocalPart`, `requireTld`, `blacklistedChars`, `hostBlacklist`, `hostWhitelist`

## URL Validation

```typescript
import { isURL } from '@lpm.dev/neo.validate'

isURL('https://example.com')                    // true
isURL('https://example.com/path?q=1#hash')     // true
isURL('http://user:pass@example.com')           // true
isURL('ftp://files.example.com')                // true
isURL('example.com')                            // false (requires protocol)

// Options
isURL('example.com', { requireProtocol: false })           // true
isURL('https://evil.com', { allowedHosts: ['good.com'] })  // false
isURL('data:text/html,...', { allowDataUrl: true })         // true
isURL('https://example.com:8080', { requirePort: true })   // true
```

**URLOptions**: `maxLength` (default: 2084), `protocols`, `requireProtocol`, `requireHost`, `requirePort`, `allowQueryComponents`, `allowFragments`, `allowDataUrl`, `allowedHosts`, `disallowedHosts`

`isURL` checks syntax. It does not make a URL safe to open, redirect to, or fetch.

## Numeric Validators

```typescript
import { isNumeric, isInt, isFloat, isDecimal } from '@lpm.dev/neo.validate'

// isNumeric — any numeric string
isNumeric('123')        // true
isNumeric('-123.45')    // true
isNumeric('1e5')        // false (scientific notation is not decimal syntax)
isNumeric('abc')        // false

// isInt — integers only
isInt('123')            // true
isInt('123.0')          // false (not an integer string)
isInt('0123')           // false (leading zeros rejected)
isInt('0123', { allowLeadingZeroes: true })  // true

// isFloat — numbers with optional decimal
isFloat('123')          // true (integers are valid floats)
isFloat('123.45')       // true
isFloat('1.5e10')       // true

// isDecimal — requires decimal point
isDecimal('123.45')     // true
isDecimal('123')        // false (no decimal point)

// Range validation (all numeric validators)
isInt('50', { min: 1, max: 100 })    // true
isInt('200', { min: 1, max: 100 })   // false
isFloat('5.5', { gt: 0, lt: 10 })    // true (exclusive bounds)
```

**NumericOptions**: `min`, `max` (inclusive), `gt`, `lt` (exclusive)
**IntOptions**: extends NumericOptions + `allowLeadingZeroes` (default: false)
**FloatOptions**: extends NumericOptions + `locale` (decimal separator from `Intl.NumberFormat`)

## String Validators

```typescript
import { isAlpha, isAlphanumeric, isLength, isAscii, isLowercase, isUppercase } from '@lpm.dev/neo.validate'

isAlpha('Hello')                  // true
isAlpha('Hello123')               // false
isAlpha('café', 'en-US')          // false (ASCII only)
isAlpha('café', 'fr-FR')          // true (accented chars)

isAlphanumeric('Hello123')        // true
isAlphanumeric('Hello 123')       // false (spaces)

isLength('hello', { min: 1, max: 10 })  // true
isLength('hi', { min: 3 })              // false

isAscii('Hello!')                 // true
isAscii('Héllo')                  // false

isLowercase('hello')              // true
isUppercase('HELLO')              // true
```

The locale selects a Unicode script. English locales use ASCII letters. An unsupported locale returns `false`.

## Network Validators

```typescript
import { isIP, isMACAddress, isPort } from '@lpm.dev/neo.validate'

// IP addresses
isIP('192.168.1.1')               // true (IPv4)
isIP('::1')                       // true (IPv6)
isIP('192.168.1.1', 4)            // true (force IPv4)
isIP('::1', 6)                    // true (force IPv6)

// MAC addresses
isMACAddress('00:1B:63:84:45:E6')              // true (colon)
isMACAddress('00-1B-63-84-45-E6')              // true (hyphen)
isMACAddress('001B638445E6', { noSeparator: true })  // true (no separator)
isMACAddress('001B.6384.45E6', { allowDot: true })   // true (Cisco)

// Ports
isPort('8080')   // true
isPort('0')      // false (port 0 rejected)
isPort('65536')  // false (> 65535)
```

## Format Validators

```typescript
import { isJSON, isBase64, isHexadecimal, isHexColor, isISO8601, isRFC3339 } from '@lpm.dev/neo.validate'

isJSON('{"key":"value"}')         // true
isJSON('{"key":"value"}', { maxLength: 1024 })  // true
isJSON('{invalid}')               // false

isBase64('SGVsbG8=')              // true
isBase64('SGVsbG8', { urlSafe: true })  // true (URL-safe base64)

isHexadecimal('ff00')             // true
isHexColor('#ff0000')             // true
isHexColor('#f00')                // true (3-digit shorthand)
isHexColor('#ff000080')           // true (8-digit with alpha)

isISO8601('2024-01-15')                    // true (date only)
isISO8601('2024-01-15T10:30:00Z')          // true (full datetime)
isRFC3339('2024-01-15T10:30:00Z')          // true (strict)
isRFC3339('2024-01-15')                    // false (requires time)
```

`isISO8601` supports calendar dates and date-times with seconds. It does not support every ISO 8601 representation.

## Identifier Validators

```typescript
import { isUUID, isISBN, isMongoId, isJWT } from '@lpm.dev/neo.validate'

isUUID('550e8400-e29b-41d4-a716-446655440000')  // true
isUUID('550e8400-e29b-41d4-a716-446655440000', 4)  // true (v4 only)

isISBN('978-3-16-148410-0', 13)   // true (validates checksum)
isISBN('0-306-40615-2', 10)       // true (validates checksum)

isMongoId('507f1f77bcf86cd799439011')  // true (24 hex chars)

isJWT('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl')  // true
```

`isJWT` checks the encoded JSON structure. It does not check the signature, expiry, issuer, audience, or claims.

## Credit Card Validation

```typescript
import { isCreditCard } from '@lpm.dev/neo.validate'

isCreditCard('4111111111111111')   // true (Visa, Luhn valid)
isCreditCard('4111111111111111', { provider: 'visa' }) // true
isCreditCard('1234567890123456')   // false (Luhn invalid)
```

The function validates a supported issuer pattern and the Luhn checksum. The optional `provider` can restrict the accepted issuer. This is format validation only. A payment processor must verify whether a card is usable.

## Sanitizers

### HTML escaping

```typescript
import { escape, unescape } from '@lpm.dev/neo.validate'

escape('<script>alert("XSS")</script>')
// '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'

unescape('&lt;b&gt;bold&lt;&#x2F;b&gt;')
// '<b>bold</b>'
```

Escapes: `&` `<` `>` `"` `'` `/`

WARNING: Do not use `escape` for JavaScript, CSS, URL, or unquoted HTML attribute values. An injection attack can occur.

### Trimming

```typescript
import { trim, ltrim, rtrim } from '@lpm.dev/neo.validate'

trim('  hello  ')           // 'hello'
trim('__hello__', '_')      // 'hello' (custom chars)
ltrim('  hello  ')          // 'hello  '
rtrim('  hello  ')          // '  hello'
```

### Email Normalization

```typescript
import { normalizeEmail } from '@lpm.dev/neo.validate'

normalizeEmail('Test.User+tag@Gmail.com')    // 'testuser@gmail.com'
normalizeEmail('User+tag@Outlook.com')       // 'user@outlook.com'
normalizeEmail('User-tag@Yahoo.com')         // 'user@yahoo.com'

// Options
normalizeEmail('Test.User@Gmail.com', { gmailRemoveDots: false })  // 'test.user@gmail.com'
normalizeEmail('User+tag@gmail.com', { gmailRemoveSubaddress: false })  // 'user+tag@gmail.com'
```

**NormalizeEmailOptions**: `allLowercase` (default: true), `gmailRemoveDots` (default: true), `gmailRemoveSubaddress` (default: true), `outlookRemoveSubaddress` (default: true), `yahooRemoveSubaddress` (default: true), `gmailConvertGooglemail` (default: true)

### Control Character Removal

```typescript
import { stripLow } from '@lpm.dev/neo.validate'

stripLow('hello\x00world')              // 'helloworld'
stripLow('line1\nline2', true)           // 'line1\nline2' (keep newlines)
```

## TypeScript Types

```typescript
import type {
  EmailOptions,
  URLOptions,
  NumericOptions,
  IntOptions,
  FloatOptions,
  LengthOptions,
  Base64Options,
  JSONOptions,
  JWTOptions,
  MACAddressOptions,
  NormalizeEmailOptions,
} from '@lpm.dev/neo.validate'
```

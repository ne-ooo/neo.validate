---
name: anti-patterns
description: Common mistakes when using neo.validate — validators never throw (always return boolean), isDecimal requires decimal point unlike isFloat, isInt rejects leading zeros by default, isEmail requires TLD by default, isURL requires protocol by default, empty string behavior inconsistent across validators, isISO8601 vs isRFC3339 strictness, isJWT validates format only not signature, isPort rejects port 0
version: "1.2.0"
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Anti-Patterns for @lpm.dev/neo.validate

### [CRITICAL] `isDecimal` requires a decimal point — `isFloat` does not

Wrong:

```typescript
// AI uses isDecimal expecting it to accept all numeric values
isDecimal('123')      // false! No decimal point
isDecimal('0')        // false!

// AI uses isFloat expecting it to reject integers
isFloat('123')        // true! Integers are valid floats
```

Correct:

```typescript
// isDecimal — REQUIRES a decimal separator
isDecimal('123.45')   // true
isDecimal('0.5')      // true
isDecimal('123')      // false (no decimal point)

// isFloat — accepts integers AND decimals
isFloat('123')        // true
isFloat('123.45')     // true
isFloat('1.5e10')     // true (scientific notation)

// isInt — integers only, rejects decimal points
isInt('123')          // true
isInt('123.0')        // false

// Choose based on what you're validating:
// Price field (must have cents): isDecimal
// Any number: isFloat or isNumeric
// Whole numbers only: isInt
```

`isDecimal` specifically validates strings with a decimal separator — it's for currency, measurement, and precision-required fields. `isFloat` is the general-purpose "is this a valid number" check. This distinction matches validator.js behavior.

Source: `src/validators/numeric.ts` — isDecimal requires decimal separator in regex

### [CRITICAL] `isInt` rejects leading zeros by default

Wrong:

```typescript
// AI validates ZIP codes or zero-padded IDs with isInt
isInt('07001')    // false! Leading zeros rejected
isInt('0042')     // false!
```

Correct:

```typescript
// Enable leading zeros explicitly
isInt('07001', { allowLeadingZeroes: true })   // true
isInt('0042', { allowLeadingZeroes: true })    // true

// Default behavior (no leading zeros)
isInt('0')        // true (single zero is fine)
isInt('123')      // true
isInt('0123')     // false

// For ZIP codes, use a regex pattern instead of isInt:
/^\d{5}(-\d{4})?$/.test('07001')  // true
```

Leading zeros are rejected by default because they're ambiguous — `0123` could be octal in some languages. Pass `allowLeadingZeroes: true` when validating zero-padded formats.

Source: `src/validators/numeric.ts` — `allowLeadingZeroes` default false

### [HIGH] `isEmail` requires TLD by default — rejects `user@localhost`

Wrong:

```typescript
// AI validates internal/dev email addresses
isEmail('admin@localhost')        // false!
isEmail('user@intranet')          // false!
isEmail('test@192.168.1.1')       // false!
```

Correct:

```typescript
// Disable TLD requirement for internal addresses
isEmail('admin@localhost', { requireTld: false })     // true
isEmail('user@intranet', { requireTld: false })       // true

// Default: requires a real TLD
isEmail('user@example.com')     // true
isEmail('user@example')         // false

// For production: keep requireTld: true (default)
// For development/testing: set requireTld: false
```

By default, `isEmail` requires a top-level domain (`.com`, `.org`, etc.). This rejects `localhost`, IP addresses, and single-label domains. Set `requireTld: false` for development or internal-network email validation.

Source: `src/validators/email.ts` — `requireTld` default true

### [HIGH] `isURL` requires protocol by default — rejects `example.com`

Wrong:

```typescript
// AI validates user-typed URLs without protocol
isURL('example.com')              // false!
isURL('www.example.com')          // false!
isURL('example.com/path')         // false!
```

Correct:

```typescript
// Disable protocol requirement for user input
isURL('example.com', { requireProtocol: false })         // true
isURL('www.example.com', { requireProtocol: false })     // true

// Default: requires protocol
isURL('https://example.com')      // true
isURL('http://example.com')       // true
isURL('ftp://files.example.com')  // true

// For user-facing forms: requireProtocol: false
// For API/config validation: keep default (true)
```

Source: `src/validators/url.ts` — `requireProtocol` default true

### [HIGH] Empty string behavior is inconsistent across validators

Wrong:

```typescript
// AI assumes all validators reject empty strings
isAlpha('')       // false — empty rejected
isAscii('')       // true! — empty accepted
isLowercase('')   // true! — empty accepted
isUppercase('')   // true! — empty accepted
```

Correct:

```typescript
// Validators that REJECT empty strings:
isAlpha('')           // false
isAlphanumeric('')    // false
isEmail('')           // false
isURL('')             // false
isNumeric('')         // false

// Validators that ACCEPT empty strings:
isAscii('')           // true (empty is valid ASCII)
isLowercase('')       // true (vacuously true)
isUppercase('')       // true (vacuously true)

// Always check for empty strings separately if needed:
if (str.length === 0) {
  return 'Field is required'
}
if (!isEmail(str)) {
  return 'Invalid email'
}

// Or use isLength for explicit length validation:
isLength(str, { min: 1 })  // false for empty strings
```

Some validators treat empty strings as vacuously true (all characters satisfy the condition when there are no characters). Always validate required fields with an explicit empty check or `isLength({ min: 1 })` before running format validators.

Source: Various validator files — inconsistent empty string handling

### [HIGH] `isISO8601` is lenient, `isRFC3339` is strict

Wrong:

```typescript
// AI uses isISO8601 when strict datetime validation is needed
isISO8601('2024-01-15')                    // true (date only — no time!)
isISO8601('2024-01-15T10:30:00')           // true (no timezone — ambiguous!)

// AI uses isRFC3339 expecting date-only support
isRFC3339('2024-01-15')                    // false! Requires time component
```

Correct:

```typescript
// isISO8601 — flexible, accepts multiple formats
isISO8601('2024-01-15')                    // true (date only)
isISO8601('2024-01-15T10:30:00')           // true (no timezone)
isISO8601('2024-01-15T10:30:00Z')          // true (UTC)
isISO8601('2024-01-15T10:30:00+05:30')     // true (offset)

// isRFC3339 — strict, requires full datetime with timezone
isRFC3339('2024-01-15T10:30:00Z')          // true
isRFC3339('2024-01-15T10:30:00+05:30')     // true
isRFC3339('2024-01-15')                    // false (no time)
isRFC3339('2024-01-15T10:30:00')           // false (no timezone)

// For API timestamps: use isRFC3339 (unambiguous)
// For user input dates: use isISO8601 (flexible)

// Both reject invalid calendar dates:
isISO8601('2024-02-30')  // false (Feb 30 doesn't exist)
isRFC3339('2024-02-30T00:00:00Z')  // false
```

Use `isRFC3339` for API/interchange formats where timezone is mandatory. Use `isISO8601` for user-facing forms that may accept date-only input.

Source: `src/validators/format.ts` — RFC3339 requires time+timezone, ISO8601 allows date-only

### [MEDIUM] `isJWT` validates format only — not signature or expiry

Wrong:

```typescript
// AI uses isJWT for authentication/authorization
const token = req.headers.authorization?.replace('Bearer ', '')
if (isJWT(token)) {
  // Token is "valid" — safe to trust!  WRONG
  const payload = JSON.parse(atob(token.split('.')[1]))
  // Payload could be forged — isJWT doesn't verify the signature
}
```

Correct:

```typescript
// isJWT checks Base64URL and JSON structure
isJWT('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl')  // true
isJWT('not.a.jwt.at.all')  // false
isJWT('invalidtoken')       // false

// For actual JWT verification, use a JWT library:
import jwt from 'jsonwebtoken'
try {
  const payload = jwt.verify(token, secretKey)  // Verifies signature + expiry
} catch (err) {
  // Invalid, expired, or forged token
}

// isJWT is useful for:
// - Quick format pre-check before passing to verification library
// - Input validation ("does this look like a JWT?")
// - Logging/debugging (identifying token format)
```

`isJWT` checks three Base64URL segments, the JSON objects, and the `alg` header. It does not check the signature or claims.

Use a JWT library for authentication.

Source: `src/validators/identifier.ts` — format check only, no crypto

### [MEDIUM] `isPort` rejects port 0

Wrong:

```typescript
// AI expects port 0 to be valid (used for dynamic port assignment)
isPort('0')      // false!
isPort('80')     // true
isPort('65535')  // true
isPort('65536')  // false
```

Correct:

```typescript
// Valid port range: 1-65535
isPort('1')      // true
isPort('80')     // true
isPort('8080')   // true
isPort('65535')  // true

// Invalid:
isPort('0')      // false (rejected)
isPort('65536')  // false (out of range)
isPort('-1')     // false

// If you need to accept port 0 (dynamic assignment):
const isValidPort = (str: string) => {
  const port = parseInt(str, 10)
  return Number.isInteger(port) && port >= 0 && port <= 65535
}
```

Port 0 is a valid OS concept (the kernel assigns a random available port), but `isPort` rejects it because it's not a valid port to listen on or connect to in most user-facing contexts.

Source: `src/validators/network.ts` — range 1-65535

### [MEDIUM] `normalizeEmail` silently modifies addresses — may break delivery

Wrong:

```typescript
// AI normalizes all emails for storage without understanding the changes
const email = normalizeEmail('John.Doe+newsletter@GoogleMail.com')
// Returns: 'johndoe@gmail.com'
// - Dots removed (Gmail ignores dots)
// - +newsletter subaddress removed
// - googlemail.com → gmail.com
// - Lowercased
// This is great for deduplication but BAD if you store it as the delivery address
```

Correct:

```typescript
// Normalize for DEDUPLICATION/COMPARISON
const normalizedForLookup = normalizeEmail(email)

// Store the ORIGINAL for delivery
const emailForDelivery = email.toLowerCase()  // Only lowercase, no other changes

// Disable specific normalizations as needed:
normalizeEmail(email, {
  gmailRemoveDots: false,          // Keep dots
  gmailRemoveSubaddress: false,    // Keep +tags
  gmailConvertGooglemail: false,   // Keep googlemail.com
})
```

Email normalization is for duplicate detection and comparison, not for storing the canonical delivery address. Gmail ignores dots, but other providers may not. Always keep the original address for actual email delivery.

Source: `src/sanitizers/normalize.ts` — provider-specific transformations

### [HIGH] HTML escaping is context-specific

Wrong:

```typescript
const href = escape(userInput)
// A javascript: URL is unchanged.
```

Correct:

```typescript
// Use escape only for HTML text or a quoted HTML attribute.
const text = escape(userInput)

// Use a URL policy before a value enters href or src.
const safeUrl = isURL(userInput, { protocols: ['https'] }) ? userInput : '#'
```

WARNING: Do not use `escape` for JavaScript, CSS, URL, or unquoted HTML attribute values. An injection attack can occur.

Source: `src/sanitizers/escape.ts` — HTML character encoding only

### [HIGH] URL validation is not an SSRF control

Wrong:

```typescript
if (isURL(userInput)) {
  await fetch(userInput)
}
```

Correct:

```typescript
// Use an exact host allowlist when the destination set is known.
if (isURL(userInput, { protocols: ['https'], allowedHosts: ['api.example.com'] })) {
  await fetch(userInput)
}
```

DNS changes and redirects can reach a prohibited address after validation. Check the resolved address and each redirect before a request.

Source: `src/validators/url.ts` — syntax and host policy checks only

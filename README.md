# @lpm.dev/neo.validate

**Zero-dependency string validation and sanitization — tree-shakeable alternative to validator.js**

## Why neo.validate?

- **Zero dependencies** — no runtime dependencies, nothing to audit
- **Tree-shakeable** — import only `isEmail`, bundle only `isEmail`
- **TypeScript-first** — strict mode, full type inference
- **Familiar API** — named validator functions with explicit TypeScript options
- **Modern** — ESM + CJS, Node.js 18+

## Installation

```bash
lpm install @lpm.dev/neo.validate
```

## Quick Start

```typescript
import { isEmail, isURL, isUUID } from "@lpm.dev/neo.validate";

isEmail("user@example.com"); // true
isURL("https://lpm.dev"); // true
isUUID("550e8400-..."); // true
```

## API Reference

### Email

```typescript
import { isEmail } from "@lpm.dev/neo.validate";

isEmail("user@example.com"); // true
isEmail("user+tag@sub.example.com"); // true
isEmail("not-an-email"); // false
isEmail("user@example.com", {
  allowDisplayName: true, // "Name <user@example.com>"
  requireTld: true, // require TLD (default: true)
  maxLength: 254, // total input limit (default: 254)
});
```

### URL

```typescript
import { isURL } from "@lpm.dev/neo.validate";

isURL("https://example.com"); // true
isURL("http://localhost:3000"); // true
isURL("ftp://files.example.com"); // true
isURL("not-a-url"); // false
isURL("https://example.com", {
  protocols: ["https"], // restrict allowed protocols
  requireProtocol: true, // require protocol prefix
  requireTld: true, // require TLD
  maxLength: 2084, // total input limit (default: 2084)
});
```

### Numeric

```typescript
import { isNumeric, isInt, isFloat, isDecimal } from "@lpm.dev/neo.validate";

isNumeric("123"); // true
isNumeric("123.45"); // true
isNumeric("-123"); // true
isInt("123"); // true
isInt("123.45"); // false
isFloat("123.45"); // true
isDecimal("123.45"); // true
```

### String

```typescript
import {
  isAlpha,
  isAlphanumeric,
  isLength,
  isAscii,
  isLowercase,
  isUppercase,
} from "@lpm.dev/neo.validate";

isAlpha("Hello"); // true (letters only)
isAlpha("Hello123"); // false
isAlphanumeric("Hello123"); // true
isLength("hello", { min: 3, max: 10 }); // true
isAscii("hello"); // true
isLowercase("hello"); // true
isUppercase("HELLO"); // true
```

The locale selects a Unicode script. English locales use ASCII letters. An unsupported locale returns `false`.

### Network

```typescript
import { isIP, isMACAddress, isPort } from "@lpm.dev/neo.validate";

isIP("192.168.1.1"); // true (IPv4 or IPv6)
isIP("192.168.1.1", 4); // true (IPv4 only)
isIP("::1", 6); // true (IPv6 only)
isMACAddress("00:1A:2B:3C:4D:5E"); // true
isPort("8080"); // true
isPort("99999"); // false
```

### Format

```typescript
import {
  isJSON,
  isBase64,
  isHexadecimal,
  isHexColor,
  isISO8601,
  isRFC3339,
} from "@lpm.dev/neo.validate";

isJSON('{"key":"value"}'); // true
isJSON('{"key":"value"}', { maxLength: 1024 }); // true
isBase64("SGVsbG8="); // true
isHexadecimal("deadbeef"); // true
isHexColor("#ff0000"); // true
isHexColor("#f00"); // true
isISO8601("2024-01-15T10:30:00Z"); // true
isRFC3339("2024-01-15T10:30:00Z"); // true
```

`isISO8601` supports calendar dates and date-times with seconds. It does not support every ISO 8601 representation.

### Identifiers

```typescript
import { isUUID, isISBN, isMongoId, isJWT } from "@lpm.dev/neo.validate";

isUUID("550e8400-e29b-41d4-a716-446655440000"); // true
isUUID("550e8400-...", 4); // true (v4 only)
isISBN("978-3-16-148410-0"); // true
isMongoId("507f1f77bcf86cd799439011"); // true
isJWT("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl"); // true
```

`isJWT` checks the encoded JSON structure. It does not check the signature, expiry, issuer, audience, or claims.

### Credit Card

```typescript
import { isCreditCard } from "@lpm.dev/neo.validate";

isCreditCard("4111111111111111"); // true (Visa test number, Luhn valid)
isCreditCard("4111111111111111", { provider: "visa" }); // true
isCreditCard("1234567890123456"); // false
```

### Sanitizers

```typescript
import {
  escape,
  unescape,
  trim,
  ltrim,
  rtrim,
  normalizeEmail,
  stripLow,
} from "@lpm.dev/neo.validate";

escape('<script>alert("xss")</script>');
// '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

unescape("&lt;p&gt;Hello&lt;/p&gt;");
// '<p>Hello</p>'

trim("  hello  "); // 'hello'
ltrim("  hello  "); // 'hello  '
rtrim("  hello  "); // '  hello'

normalizeEmail("Hello+Tag@GMAIL.COM");
// 'hello@gmail.com'

stripLow("Hello\x00World"); // 'HelloWorld'
```

`escape` is for HTML text and quoted HTML attributes. It is not an encoder for JavaScript, CSS, or URL values.

## Security boundaries

Validation does not make untrusted content safe for every use. Read [SECURITY.md](./SECURITY.md) before security-sensitive use.

The URL validator does not provide complete SSRF protection. The JWT validator does not provide authentication.

All validators return a boolean for malformed runtime arguments. All sanitizers return a string.

## Migration from validator.js

neo.validate uses familiar function names, but it is not a drop-in replacement for
validator.js. Option names, defaults, supported formats, and non-string input behavior
can differ. Map options explicitly and run compatibility tests before migrating.

```typescript
// Before
import { isEmail, isURL } from "validator";

// After
import { isEmail, isURL } from "@lpm.dev/neo.validate";
```

For example, validator.js uses `require_protocol` and `host_whitelist`; neo.validate
uses `requireProtocol` and `allowedHosts`. See the included migration guide for the
known mappings and behavioral differences.

## License

MIT

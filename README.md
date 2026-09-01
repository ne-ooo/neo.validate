# @lpm.dev/neo.validate

`@lpm.dev/neo.validate` provides zero-dependency string validators and
sanitizers for Node.js and JavaScript bundlers.

## Features

- **Validation:** The package validates email addresses, URLs, numbers, network
  values, formats, and identifiers.
- **Sanitization:** The package escapes HTML text, trims strings, normalizes
  email addresses, and removes control characters.
- **Reusable policies:** Compiled email and URL validators snapshot their
  options.
- **TypeScript support:** The package includes strict TypeScript declarations.
- **Dependency surface:** The package has no runtime dependencies.
- **Module formats:** The package provides ESM and CommonJS builds.

## Install

Install the package with LPM:

```bash
lpm install @lpm.dev/neo.validate
```

## Quick start

```typescript
import { isEmail, isURL, isUUID } from "@lpm.dev/neo.validate";

isEmail("user@example.com"); // true
isURL("https://lpm.dev"); // true
isUUID("550e8400-e29b-41d4-a716-446655440000"); // true
```

## API

### Email

```typescript
import { createEmailValidator, isEmail } from "@lpm.dev/neo.validate";

isEmail("user@example.com"); // true
isEmail("user+tag@sub.example.com"); // true
isEmail("not-an-email"); // false
isEmail("user@example.com", {
  allowDisplayName: true,
  requireTld: true,
  maxLength: 254,
});

const isCompanyEmail = createEmailValidator({
  hostWhitelist: ["example.com"],
});
isCompanyEmail("user@example.com"); // true
```

If the same policy validates many values, use `createEmailValidator()`. The
function validates and snapshots the options once.

### URL

```typescript
import { createURLValidator, isURL } from "@lpm.dev/neo.validate";

isURL("https://example.com"); // true
isURL("http://localhost:3000"); // true
isURL("ftp://files.example.com"); // true
isURL("not-a-url"); // false
isURL("https://example.com", {
  protocols: ["https"],
  requireProtocol: true,
  requireTld: true,
  maxLength: 2084,
});

const isApprovedURL = createURLValidator({
  protocols: ["https"],
  allowedHosts: ["example.com"],
});
isApprovedURL("https://example.com/docs"); // true
```

Use `createURLValidator()` for repeated policy checks. Later changes to the
input policy arrays do not change a compiled validator.

Protocol-less mode accepts hostnames without a colon. If a URL contains a port,
include an explicit scheme.

This scheme prevents confusion with an absolute non-HTTP scheme. Other absolute
schemes require explicit `protocols` and a matching host policy.

### Numeric values

```typescript
import { isDecimal, isFloat, isInt, isNumeric } from "@lpm.dev/neo.validate";

isNumeric("123"); // true
isNumeric("123.45"); // true
isNumeric("-123"); // true
isInt("123"); // true
isInt("123.45"); // false
isFloat("123.45"); // true
isDecimal("123.45"); // true
```

### Strings

```typescript
import {
  isAlpha,
  isAlphanumeric,
  isAscii,
  isLength,
  isLowercase,
  isUppercase,
} from "@lpm.dev/neo.validate";

isAlpha("Hello"); // true
isAlpha("Hello123"); // false
isAlphanumeric("Hello123"); // true
isLength("hello", { min: 3, max: 10 }); // true
isAscii("hello"); // true
isLowercase("hello"); // true
isUppercase("HELLO"); // true
```

The locale selects a Unicode script. Explicit script subtags such as `az-Cyrl`
and `pa-Arab` take precedence over language defaults.

English Latin locales use ASCII letters. An unsupported locale returns `false`.

### Network values

```typescript
import { isIP, isMACAddress, isPort } from "@lpm.dev/neo.validate";

isIP("192.168.1.1"); // true
isIP("192.168.1.1", 4); // true
isIP("::1", 6); // true
isMACAddress("00:1A:2B:3C:4D:5E"); // true
isMACAddress("001A2B3C4D5E", { noSeparator: true }); // true
isPort("8080"); // true
isPort("99999"); // false
```

### Formats

```typescript
import {
  isBase64,
  isHexadecimal,
  isHexColor,
  isISO8601,
  isJSON,
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
isRFC3339("2016-12-31T23:59:60Z"); // true
```

`isISO8601()` supports calendar dates and date-times with seconds. It does not
support every ISO 8601 representation.

### Identifiers

```typescript
import { isISBN, isJWT, isMongoId, isUUID } from "@lpm.dev/neo.validate";

isUUID("550e8400-e29b-41d4-a716-446655440000"); // true
isUUID("550e8400-e29b-41d4-a716-446655440000", 4); // true
isUUID("019535d9-3df7-7a28-8a7f-9f4bc7c8e101", 7); // true
isUUID("00000000-0000-0000-0000-000000000000"); // true
isISBN("978-3-16-148410-0"); // true
isMongoId("507f1f77bcf86cd799439011"); // true
isJWT("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl"); // true
```

`isJWT()` checks the encoded JSON structure. It does not check the signature,
expiry, issuer, audience, or claims.

Generic UUID validation supports RFC 9562 versions 1 through 8, nil UUIDs, and
max UUIDs.

ISBN-13 validation requires a `978` or `979` Bookland prefix.

### Credit cards

```typescript
import { isCreditCard } from "@lpm.dev/neo.validate";

isCreditCard("4111111111111111"); // true
isCreditCard("4111111111111111", { provider: "visa" }); // true
isCreditCard("1234567890123456"); // false
```

### Sanitizers

```typescript
import {
  escape,
  ltrim,
  normalizeEmail,
  rtrim,
  stripLow,
  trim,
  unescape,
} from "@lpm.dev/neo.validate";

escape('<script>alert("xss")</script>');
// "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"

unescape("&lt;p&gt;Hello&lt;/p&gt;");
// "<p>Hello</p>"

trim("  hello  "); // "hello"
ltrim("  hello  "); // "hello  "
rtrim("  hello  "); // "  hello"

normalizeEmail("Hello+Tag@GMAIL.COM");
// "hello@gmail.com"

normalizeEmail("User@éxample.com");
// "user@xn--xample-9ua.com"

stripLow("Hello\x00World"); // "HelloWorld"
```

`escape()` is for HTML text and quoted HTML attributes. It is not an encoder for
JavaScript, CSS, or URL values.

## Behavior and limits

- Email input is `254` characters or fewer by default.
- URL input is `2084` characters or fewer by default.
- `isJSON()` accepts a configurable `maxLength` limit.
- Validators return `false` for malformed runtime arguments.
- Sanitizers return a string.

## Security

`@lpm.dev/neo.validate` checks string formats. It does not make untrusted
content safe for every output or network request.

- The URL validator does not provide complete SSRF protection.
- The JWT validator does not provide authentication.
- The HTML escape function does not encode JavaScript, CSS, or URL values.
- The application must apply controls for the destination context.

Read [SECURITY.md](./SECURITY.md) before you use the package at a security
boundary.

## Migration from `validator.js`

`@lpm.dev/neo.validate` uses familiar function names, but it is not a drop-in
replacement for `validator.js`.

Option names, defaults, supported formats, and non-string input behavior can
differ. Map options explicitly and run compatibility tests.

```diff
- import { isEmail, isURL } from "validator";
+ import { isEmail, isURL } from "@lpm.dev/neo.validate";
```

For example, `validator.js` uses `require_protocol` and `host_whitelist`. This
package uses `requireProtocol` and `allowedHosts`.

## Performance

The repository contains reproducible benchmarks for representative validators.

See [BENCHMARKS.md](./BENCHMARKS.md) for the method, results, and limits.

Run the benchmark suite:

```bash
lpm run bench
```

Benchmark results depend on the runtime, computer, options, and input data.

## Runtime support

- **Node.js:** 18 or later
- **Browsers:** Supported through JavaScript bundlers
- **Module formats:** ESM and CommonJS
- **TypeScript:** Declaration files are included

## License

MIT. See [LICENSE](./LICENSE).

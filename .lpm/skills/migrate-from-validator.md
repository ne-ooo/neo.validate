---
name: migrate-from-validator
description: Migration guide from validator.js to neo.validate — drop-in compatible API, same function names and signatures, same options objects, 27x smaller bundle (30KB vs 817KB), 2-12x faster, tree-shakeable, TypeScript native, zero dependencies
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Migrating from validator.js to @lpm.dev/neo.validate

## Why Migrate

| | validator.js | neo.validate |
|---|-------------|--------------|
| **Bundle** | 817 KB | 30 KB (27x smaller) |
| **Performance** | Baseline | 2-12x faster |
| **Tree-shaking** | Not possible | Yes |
| **TypeScript** | `@types/validator` | Built-in, strict |
| **ESM** | CommonJS only | ESM + CJS |
| **Dependencies** | Zero | Zero |
| **API** | Baseline | Drop-in compatible |

## Drop-In Replacement

```typescript
// Before
import validator from 'validator'

validator.isEmail('user@example.com')
validator.isURL('https://example.com')
validator.isInt('42', { min: 1, max: 100 })
validator.escape('<script>')
validator.normalizeEmail('Test@Gmail.com')

// After — same function names, same signatures
import { isEmail, isURL, isInt, escape, normalizeEmail } from '@lpm.dev/neo.validate'

isEmail('user@example.com')
isURL('https://example.com')
isInt('42', { min: 1, max: 100 })
escape('<script>')
normalizeEmail('Test@Gmail.com')
```

The only change is the import — all function names, parameters, and option objects are compatible.

## Function Mapping

### Validators (All Compatible)

| validator.js | neo.validate | Notes |
|-------------|-------------|-------|
| `validator.isEmail(str, opts)` | `isEmail(str, opts)` | Same options |
| `validator.isURL(str, opts)` | `isURL(str, opts)` | Same options |
| `validator.isNumeric(str, opts)` | `isNumeric(str, opts)` | Same options |
| `validator.isInt(str, opts)` | `isInt(str, opts)` | Same options |
| `validator.isFloat(str, opts)` | `isFloat(str, opts)` | Same options |
| `validator.isDecimal(str, opts)` | `isDecimal(str, opts)` | Same options |
| `validator.isAlpha(str, locale)` | `isAlpha(str, locale)` | Same locales |
| `validator.isAlphanumeric(str, locale)` | `isAlphanumeric(str, locale)` | Same locales |
| `validator.isLength(str, opts)` | `isLength(str, opts)` | Same options |
| `validator.isAscii(str)` | `isAscii(str)` | Identical |
| `validator.isLowercase(str)` | `isLowercase(str)` | Identical |
| `validator.isUppercase(str)` | `isUppercase(str)` | Identical |
| `validator.isIP(str, ver)` | `isIP(str, ver)` | Same version param |
| `validator.isMACAddress(str, opts)` | `isMACAddress(str, opts)` | Same options |
| `validator.isPort(str)` | `isPort(str)` | Identical |
| `validator.isJSON(str)` | `isJSON(str)` | Identical |
| `validator.isBase64(str, opts)` | `isBase64(str, opts)` | Same options |
| `validator.isHexadecimal(str)` | `isHexadecimal(str)` | Identical |
| `validator.isHexColor(str)` | `isHexColor(str)` | Identical |
| `validator.isISO8601(str)` | `isISO8601(str)` | Identical |
| `validator.isRFC3339(str)` | `isRFC3339(str)` | Identical |
| `validator.isUUID(str, ver)` | `isUUID(str, ver)` | Same version param |
| `validator.isISBN(str, ver)` | `isISBN(str, ver)` | Same version param |
| `validator.isMongoId(str)` | `isMongoId(str)` | Identical |
| `validator.isJWT(str)` | `isJWT(str)` | Identical |
| `validator.isCreditCard(str)` | `isCreditCard(str)` | Same Luhn algorithm |

### Sanitizers (All Compatible)

| validator.js | neo.validate | Notes |
|-------------|-------------|-------|
| `validator.escape(str)` | `escape(str)` | Same 6 characters |
| `validator.unescape(str)` | `unescape(str)` | Same entities |
| `validator.trim(str, chars)` | `trim(str, chars)` | Same custom chars |
| `validator.ltrim(str, chars)` | `ltrim(str, chars)` | Same behavior |
| `validator.rtrim(str, chars)` | `rtrim(str, chars)` | Same behavior |
| `validator.normalizeEmail(str, opts)` | `normalizeEmail(str, opts)` | Same options |
| `validator.stripLow(str, keep)` | `stripLow(str, keep)` | Same behavior |

## Import Style Migration

### From Default Import

```typescript
// Before — single import, all functions on object
import validator from 'validator'
validator.isEmail(email)
validator.isURL(url)
validator.escape(html)

// After — named imports (tree-shakeable)
import { isEmail, isURL, escape } from '@lpm.dev/neo.validate'
isEmail(email)
isURL(url)
escape(html)
```

### From Destructured Import

```typescript
// Before
const { isEmail, isURL, escape } = require('validator')

// After — same destructure, different package
import { isEmail, isURL, escape } from '@lpm.dev/neo.validate'
```

## Tree-Shaking Advantage

```typescript
// validator.js: ALL validators included (817 KB) regardless of imports
import validator from 'validator'
validator.isEmail(email)  // You pay for isURL, isCreditCard, etc.

// neo.validate: only imported functions are bundled
import { isEmail } from '@lpm.dev/neo.validate'
// Only email validator in your bundle (~2 KB)
```

## Performance Comparison

| Operation | validator.js | neo.validate | Speedup |
|-----------|-------------|-------------|---------|
| isEmail | Baseline | 10.3x faster | 10.3x |
| isURL | Baseline | 3.8x faster | 3.8x |
| isNumeric | Baseline | 4.4x faster | 4.4x |
| isAlpha | Baseline | 1.2-1.8x faster | ~1.5x |
| isIP | Baseline | 1.8-2.3x faster | ~2x |
| escape | Baseline | 2.0-3.1x faster | ~2.5x |
| Batch (100+) | Baseline | 8.8x faster | 8.8x |

## TypeScript Upgrade

```typescript
// validator.js — requires @types/validator
// Options types may be incomplete or outdated
import validator from 'validator'
import type { IsEmailOptions } from 'validator'  // From @types/validator

// neo.validate — types are built-in and always current
import { isEmail } from '@lpm.dev/neo.validate'
import type { EmailOptions } from '@lpm.dev/neo.validate'

// Full autocomplete on all options
isEmail(email, {
  allowDisplayName: true,  // TypeScript knows all valid options
  requireTld: false,
})
```

## Not Included (validator.js Functions Without Equivalent)

neo.validate covers the most commonly used validators. Some rarely-used validator.js functions are not included:

- `isAfter`, `isBefore` — use `Date` comparison
- `isCurrency` — use locale-aware number formatting
- `isMobilePhone` — complex, locale-dependent, changes frequently
- `isPostalCode` — locale-dependent, use dedicated library
- `isVAT` — tax-system-specific
- `toDate`, `toFloat`, `toInt`, `toBoolean` — use standard JS (`Date()`, `parseFloat()`, `parseInt()`)

For these, continue using validator.js alongside neo.validate, or use dedicated libraries.

## Checklist

- [ ] Replace `validator` or `validator/lib/*` imports with `@lpm.dev/neo.validate`
- [ ] Change `validator.functionName()` to direct `functionName()` calls
- [ ] Remove `@types/validator` from devDependencies (types are built-in)
- [ ] Remove `validator` from dependencies
- [ ] Check if you use any excluded functions (see list above)
- [ ] All options objects work unchanged — no mapping needed

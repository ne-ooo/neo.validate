---
name: migrate-from-validator
description: Migration guide from validator.js to neo.validate — map imports and options explicitly, review different defaults and supported formats, and verify behavior with compatibility tests
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Migrating from validator.js to @lpm.dev/neo.validate

neo.validate has many familiar function names, but it is not a drop-in replacement for
validator.js. Do not replace the package import without reviewing every call.

## Import migration

```typescript
// Before
import validator from 'validator'

validator.isEmail(email)
validator.isURL(url, { require_protocol: true })

// After
import { isEmail, isURL } from '@lpm.dev/neo.validate'

isEmail(email)
isURL(url, { requireProtocol: true })
```

neo.validate uses named exports. ESM consumers can tree-shake unused functions.

## Common option mappings

| validator.js | neo.validate |
|---|---|
| `allow_display_name` | `allowDisplayName` |
| `require_display_name` | `requireDisplayName` |
| `allow_utf8_local_part` | `allowUtf8LocalPart` |
| `require_tld` | `requireTld` |
| `blacklisted_chars` | `blacklistedChars` |
| `host_blacklist` | `hostBlacklist` for email, `disallowedHosts` for URL |
| `host_whitelist` | `hostWhitelist` for email, `allowedHosts` for URL |
| `require_protocol` | `requireProtocol` |
| `require_host` | `requireHost` |
| `require_port` | `requirePort` |
| `require_valid_protocol` | `requireValidProtocol` |
| `allow_query_components` | `allowQueryComponents` |
| `allow_fragments` | `allowFragments` |

Do not pass validator.js option objects directly. Unknown JavaScript properties are
ignored at runtime and can silently disable an intended restriction.

## Important behavioral differences

- neo.validate requires a URL protocol by default. Set `requireProtocol: false` to
  accept protocol-less URLs.
- neo.validate email validation requires a TLD by default.
- neo.validate `isJSON` accepts JSON primitives.
- neo.validate standard Base64 accepts correctly formed unpadded input.
- neo.validate validators return `false` for most non-string inputs instead of using
  validator.js's exact error behavior.
- Locale coverage and the complete function set are smaller than validator.js.

## Migration checklist

- [ ] Replace default-object calls with named imports.
- [ ] Map every options object to neo.validate camelCase names.
- [ ] Review default behavior for email, URL, JSON, Base64, locale, and length checks.
- [ ] Keep validator.js for functions that neo.validate does not export.
- [ ] Add tests containing valid, invalid, boundary, and security-sensitive values.
- [ ] Run both libraries over production fixtures and review every differing result.
- [ ] Remove validator.js only after the compatibility suite passes.

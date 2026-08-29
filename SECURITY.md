# Security

## Report a vulnerability

Use a [private GitHub security advisory](https://github.com/ne-ooo/neo.validate/security/advisories/new) to report a vulnerability.

Do not include an unpublished vulnerability in a public issue.

## HTML escaping

`escape` encodes characters for HTML text and quoted HTML attribute values.

WARNING: Do not use `escape` for JavaScript, CSS, URL, or unquoted HTML attribute values. An injection attack can occur.

Use an encoder that is made for the output context.

## URL validation

`isURL` checks URL syntax and the selected options. It does not make a URL safe to fetch or open.

The validator rejects raw backslashes and ASCII control characters to reduce differences between URL parsers. Pass the parsed and canonicalized URL to downstream code instead of reparsing the original input.

WARNING: Do not use `isURL` as the only SSRF control. DNS changes and redirects can reach a prohibited address.

Resolve the host before each request. Reject private and reserved addresses when the application does not require them.

Check each redirect before the application follows it. Use an exact allowlist when the destination set is known.

The `allowDataUrl` option accepts all valid data URL media types. It also accepts active HTML content.

WARNING: Do not display an untrusted data URL in an active browser context. Script execution can occur.

## JWT validation

`isJWT` checks the compact format, Base64URL encoding, JSON objects, and the `alg` header.

It does not check the signature, expiry, issuer, audience, or claims.

WARNING: Do not use `isJWT` for authentication or authorization. A forged token can pass the format check.

Use a JWT library that checks the signature and required claims.

## Email normalization

`normalizeEmail` changes provider-specific addresses. These changes can merge two input strings into one result.

Keep the original address for delivery. Use the normalized address only for a documented comparison policy.

## Input limits

Email, URL, JSON, and JWT validation use default input limits. Use `maxLength` to select a different application limit.

Numeric, Base64, date, string, and sanitizer APIs do not all have built-in length limits. Their work is linear, but a sufficiently large input can still block an event loop.

Set request-body and field limits before validation or normalization. This package cannot prevent allocation of the input string by the caller.

## Unicode identity

Unicode-aware alphabetic, email, and hostname checks accept characters from supported scripts. They do not detect visually confusable characters or prove that two identifiers belong to the same person or organization.

Use a documented canonicalization and confusable-character policy for security-sensitive usernames, domains, and allowlists. Show the original value when a person must verify an identity.

## Credit-card validation

`isCreditCard` checks the issuer pattern and the Luhn checksum. It does not check that the account exists or is usable.

Use a payment processor to check payment-card data. Do not store payment-card data unless the system meets PCI DSS requirements.

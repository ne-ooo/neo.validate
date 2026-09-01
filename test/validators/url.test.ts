import { describe, it, expect } from 'vitest'
import { createURLValidator, isURL } from '../../src/validators/url.js'

describe('isURL', () => {
  describe('valid URLs', () => {
    it('should validate HTTP URLs', () => {
      expect(isURL('http://example.com')).toBe(true)
      expect(isURL('http://www.example.com')).toBe(true)
      expect(isURL('http://subdomain.example.com')).toBe(true)
    })

    it('should validate HTTPS URLs', () => {
      expect(isURL('https://example.com')).toBe(true)
      expect(isURL('https://www.example.com')).toBe(true)
      expect(isURL('https://secure.example.com')).toBe(true)
    })

    it('should validate FTP URLs', () => {
      expect(isURL('ftp://files.example.com')).toBe(true)
      expect(isURL('ftp://ftp.example.com/path')).toBe(true)
    })

    it('should validate URLs with paths', () => {
      expect(isURL('https://example.com/path')).toBe(true)
      expect(isURL('https://example.com/path/to/page')).toBe(true)
      expect(isURL('https://example.com/path/file.html')).toBe(true)
    })

    it('should validate URLs with query strings', () => {
      expect(isURL('https://example.com?query=value')).toBe(true)
      expect(isURL('https://example.com/path?foo=bar&baz=qux')).toBe(true)
    })

    it('should validate URLs with fragments', () => {
      expect(isURL('https://example.com#section')).toBe(true)
      expect(isURL('https://example.com/path#anchor')).toBe(true)
    })

    it('should validate URLs with ports', () => {
      expect(isURL('http://example.com:8080')).toBe(true)
      expect(isURL('https://example.com:443')).toBe(true)
      expect(isURL('http://localhost:3000')).toBe(true)
    })

    it('should validate URLs without protocol when not required', () => {
      expect(isURL('example.com', { requireProtocol: false })).toBe(true)
      expect(isURL('www.example.com', { requireProtocol: false })).toBe(true)
      expect(isURL('subdomain.example.com', { requireProtocol: false })).toBe(true)
    })
  })

  describe('invalid URLs', () => {
    it('should reject empty strings', () => {
      expect(isURL('')).toBe(false)
    })

    it('should reject non-string values', () => {
      expect(isURL(123 as any)).toBe(false)
      expect(isURL(null as any)).toBe(false)
      expect(isURL(undefined as any)).toBe(false)
    })

    it('should reject URLs without protocol by default', () => {
      expect(isURL('example.com')).toBe(false)
      expect(isURL('www.example.com')).toBe(false)
    })

    it('should reject invalid URL formats', () => {
      expect(isURL('not a url')).toBe(false)
      expect(isURL('http://')).toBe(false)
      expect(isURL('://example.com')).toBe(false)
    })

    it('should reject data URLs by default', () => {
      expect(isURL('data:text/plain;base64,SGVsbG8=')).toBe(false)
    })
  })

  describe('options', () => {
    it('should respect requireProtocol option', () => {
      expect(isURL('example.com', { requireProtocol: true })).toBe(false)
      expect(isURL('example.com', { requireProtocol: false })).toBe(true)
    })

    it('should respect protocols option', () => {
      expect(isURL('ftp://example.com', { protocols: ['http', 'https'] })).toBe(false)
      expect(isURL('ftp://example.com', { protocols: ['http', 'https', 'ftp'] })).toBe(
        true
      )
    })

    it('should respect requirePort option', () => {
      expect(isURL('http://example.com', { requirePort: true })).toBe(false)
      expect(isURL('http://example.com:8080', { requirePort: true })).toBe(true)
    })

    it('should respect allowQueryComponents option', () => {
      expect(isURL('http://example.com?query=value', { allowQueryComponents: false })).toBe(
        false
      )
      expect(isURL('http://example.com?query=value', { allowQueryComponents: true })).toBe(
        true
      )
      expect(isURL('http://example.com', { allowQueryComponents: false })).toBe(true)
      expect(isURL('http://example.com?', { allowQueryComponents: false })).toBe(false)
      expect(
        isURL('example.com?', {
          requireProtocol: false,
          allowQueryComponents: false,
        })
      ).toBe(false)
      expect(
        isURL('data:text/plain,hello?', {
          allowDataUrl: true,
          allowQueryComponents: false,
        })
      ).toBe(false)
      expect(
        isURL('http://example.com#?fragment', { allowQueryComponents: false })
      ).toBe(true)
    })

    it('should respect allowFragments option', () => {
      expect(isURL('http://example.com#section', { allowFragments: false })).toBe(false)
      expect(isURL('http://example.com#section', { allowFragments: true })).toBe(true)
      expect(isURL('http://example.com', { allowFragments: false })).toBe(true)
      expect(isURL('http://example.com#', { allowFragments: false })).toBe(false)
      expect(
        isURL('data:text/plain,hello#', {
          allowDataUrl: true,
          allowFragments: false,
        })
      ).toBe(false)
    })

    it('should respect allowDataUrl option', () => {
      expect(
        isURL('data:text/plain;base64,SGVsbG8=', { allowDataUrl: false })
      ).toBe(false)
      expect(
        isURL('data:text/plain;base64,SGVsbG8=', { allowDataUrl: true })
      ).toBe(true)
      expect(isURL('data:,', { allowDataUrl: true })).toBe(true)
      expect(isURL('data:;base64,', { allowDataUrl: true })).toBe(true)
    })

    it('should reject malformed data URLs', () => {
      expect(isURL('data:', { allowDataUrl: true })).toBe(false)
      expect(isURL('data:text/plain', { allowDataUrl: true })).toBe(false)
      expect(isURL('data:text/plain;base64,not-base64!', { allowDataUrl: true })).toBe(false)
      expect(isURL('data:text/plain;base64;charset=utf-8,SGVsbG8=', { allowDataUrl: true })).toBe(false)
      expect(isURL('data:text/plain,%ZZ', { allowDataUrl: true })).toBe(false)
      expect(isURL('data:base64,SGVsbG8=', { allowDataUrl: true })).toBe(false)
      expect(isURL('data:base64,not-base64!', { allowDataUrl: true })).toBe(false)
    })

    it('should respect allowedHosts option', () => {
      expect(
        isURL('http://example.com', { allowedHosts: ['example.com', 'test.com'] })
      ).toBe(true)
      expect(
        isURL('http://other.com', { allowedHosts: ['example.com', 'test.com'] })
      ).toBe(false)
    })

    it('should respect disallowedHosts option', () => {
      expect(
        isURL('http://spam.com', { disallowedHosts: ['spam.com', 'fake.com'] })
      ).toBe(false)
      expect(
        isURL('http://example.com', { disallowedHosts: ['spam.com', 'fake.com'] })
      ).toBe(true)
    })

    it('should canonicalize host policy values', () => {
      expect(isURL('http://example.com./', { disallowedHosts: ['example.com'] })).toBe(false)
      expect(isURL('http://例え.jp/', { disallowedHosts: ['例え.jp'] })).toBe(false)
      expect(isURL('http://[::1]/', { disallowedHosts: ['::1'] })).toBe(false)
      expect(isURL('http://example.com./', { allowedHosts: ['example.com'] })).toBe(true)
      expect(isURL('http://例え.jp/', { allowedHosts: ['例え.jp'] })).toBe(true)
      expect(isURL('http://[::1]/', { allowedHosts: ['::1'] })).toBe(true)
    })

    it('should reject invalid host policy entries instead of failing open', () => {
      expect(
        isURL('http://example.com', { disallowedHosts: [null] } as any)
      ).toBe(false)
      expect(
        isURL('http://example.com', { disallowedHosts: ['example.com/path'] })
      ).toBe(false)
    })

    it('should enforce all restrictions for URLs without a protocol', () => {
      expect(
        isURL('evil.com', { requireProtocol: false, allowedHosts: ['good.com'] })
      ).toBe(false)
      expect(
        isURL('evil.com', { requireProtocol: false, disallowedHosts: ['evil.com'] })
      ).toBe(false)
      expect(isURL('evil.com', { requireProtocol: false, requirePort: true })).toBe(false)
      expect(
        isURL('evil.com?q=1', {
          requireProtocol: false,
          allowQueryComponents: false,
        })
      ).toBe(false)
      expect(
        isURL('evil.com', { requireProtocol: false, protocols: ['https'] })
      ).toBe(false)
    })

    it('should not reinterpret absolute schemes as protocol-less HTTP URLs', () => {
      const options = { requireProtocol: false, allowedHosts: ['example.com'] }
      expect(
        isURL('javascript:alert%281%29%2F%2F@example.com', options)
      ).toBe(false)
      expect(
        isURL(' javascript:alert%281%29%2F%2F@example.com', options)
      ).toBe(false)
      expect(
        createURLValidator(options)('  javascript:alert%281%29%2F%2F@example.com')
      ).toBe(false)
      expect(isURL('mailto:user@example.com', options)).toBe(false)
      expect(isURL('urn:example:test', { requireProtocol: false })).toBe(false)
      expect(isURL('file:/tmp/example.com', options)).toBe(false)
    })

    it('should parse explicitly allowed absolute schemes as supplied', () => {
      expect(
        isURL('file:/tmp/example', { protocols: ['file'], requireHost: false })
      ).toBe(true)
      expect(
        isURL('mailto:user@example.com', {
          protocols: ['mailto'],
          requireHost: false,
        })
      ).toBe(true)
      expect(
        isURL('urn:example:test', { protocols: ['urn'], requireHost: false })
      ).toBe(true)
      expect(
        isURL('urn:example:123', {
          protocols: ['urn'],
          requireHost: false,
          requirePort: true,
        })
      ).toBe(false)
      expect(
        isURL('mailto:user@example.com:123', {
          protocols: ['mailto'],
          requireHost: false,
          requirePort: true,
        })
      ).toBe(false)
    })

    it('should respect requireTld for DNS hostnames', () => {
      expect(isURL('http://localhost', { requireTld: true })).toBe(false)
      expect(isURL('http://example.com', { requireTld: true })).toBe(true)
      expect(isURL('http://127.0.0.1', { requireTld: true })).toBe(true)
      expect(isURL('http://example..com', { requireTld: true })).toBe(false)
      expect(isURL('http://example.c', { requireTld: true })).toBe(false)
    })

    it('should recognize an explicit default port', () => {
      expect(isURL('https://example.com:443', { requirePort: true })).toBe(true)
    })

    it('should reject malformed option shapes without throwing', () => {
      expect(isURL('https://example.com', null as any)).toBe(false)
      expect(isURL('https://example.com', { protocols: null } as any)).toBe(false)
      expect(isURL('https://example.com', { allowedHosts: null } as any)).toBe(false)
      expect(isURL('https://example.com', { disallowedHosts: null } as any)).toBe(false)
      expect(
        isURL('https://example.com', { allowedHosts: [null] } as any)
      ).toBe(false)
      const accessorOptions = Object.defineProperty({}, 'allowDataUrl', {
        get() {
          throw new Error('must not execute option accessors')
        },
      })
      expect(() => isURL('data:text/plain,hello', accessorOptions)).not.toThrow()
      expect(isURL('data:text/plain,hello', accessorOptions)).toBe(false)
      const revoked = Proxy.revocable({}, {})
      revoked.revoke()
      expect(() => isURL('https://example.com', revoked.proxy)).not.toThrow()
      expect(isURL('https://example.com', revoked.proxy)).toBe(false)
    })

    it('should ignore inherited policy values', () => {
      const dataOptions = Object.create({ allowDataUrl: true })
      const protocolOptions = Object.create({ requireValidProtocol: false })
      expect(isURL('data:text/html,<script>alert(1)</script>', dataOptions)).toBe(false)
      expect(isURL('gopher://example.com', protocolOptions)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle URLs with IP addresses', () => {
      expect(isURL('http://192.168.1.1')).toBe(true)
      expect(isURL('http://127.0.0.1:8080')).toBe(true)
    })

    it('should handle URLs with localhost', () => {
      expect(isURL('http://localhost')).toBe(true)
      expect(isURL('http://localhost:3000')).toBe(true)
    })

    it('should handle URLs with authentication', () => {
      expect(isURL('http://user:pass@example.com')).toBe(true)
      expect(isURL('https://admin@example.com')).toBe(true)
    })

    it('should handle very long URLs', () => {
      const longPath = '/path/' + 'a'.repeat(1000)
      expect(isURL(`http://example.com${longPath}`)).toBe(true)
    })

    it('should reject input above the default limit before parsing', () => {
      const oversized = `https://example.com/${'a'.repeat(2084)}`
      expect(isURL(oversized)).toBe(false)
      expect(isURL(oversized, { maxLength: oversized.length })).toBe(true)
    })

    it('should reject raw backslashes and ASCII controls before parsing', () => {
      expect(
        isURL('http://good.com\\@evil.com', { allowedHosts: ['good.com'] })
      ).toBe(false)
      expect(isURL('http://exa\nmple.com')).toBe(false)
      expect(isURL('http://example.com/\r\nX-Test: value')).toBe(false)
    })
  })

  describe('compiled validator', () => {
    it('matches one-off validation with a reusable policy', () => {
      const options = {
        protocols: ['https'],
        requireTld: true,
        allowedHosts: ['example.com'],
      }
      const validate = createURLValidator(options)

      expect(validate('https://example.com/path')).toBe(
        isURL('https://example.com/path', options)
      )
      expect(validate('http://example.com')).toBe(false)
      expect(validate('https://other.com')).toBe(false)
      expect(validate(null as any)).toBe(false)
    })

    it('snapshots mutable protocol and host policies', () => {
      const protocols = ['https']
      const allowedHosts = ['example.com']
      const disallowedHosts = ['spam.com']
      const validate = createURLValidator({ protocols, allowedHosts, disallowedHosts })

      protocols[0] = 'http'
      allowedHosts[0] = 'other.com'
      disallowedHosts[0] = 'example.com'

      expect(validate('https://example.com')).toBe(true)
      expect(validate('http://example.com')).toBe(false)
      expect(validate('https://other.com')).toBe(false)
      expect(validate('https://spam.com')).toBe(false)
    })

    it('returns an always-false validator for invalid options', () => {
      const malformed = createURLValidator({ protocols: [null] } as any)
      const accessorOptions = Object.defineProperty({}, 'allowDataUrl', {
        get() {
          throw new Error('must not execute option accessors')
        },
      })
      expect(malformed('https://example.com')).toBe(false)
      expect(() => createURLValidator(accessorOptions)).not.toThrow()
      expect(createURLValidator(accessorOptions)('https://example.com')).toBe(false)
    })
  })
})

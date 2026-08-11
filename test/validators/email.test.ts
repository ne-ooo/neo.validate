import { describe, it, expect } from 'vitest'
import { isEmail } from '../../src/validators/email.js'

describe('isEmail', () => {
  describe('valid emails', () => {
    it('should validate simple email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true)
      expect(isEmail('user@domain.org')).toBe(true)
      expect(isEmail('hello@world.net')).toBe(true)
    })

    it('should validate emails with subdomains', () => {
      expect(isEmail('test@mail.example.com')).toBe(true)
      expect(isEmail('user@subdomain.domain.co.uk')).toBe(true)
    })

    it('should validate emails with special characters', () => {
      expect(isEmail('user.name@example.com')).toBe(true)
      expect(isEmail('user+tag@example.com')).toBe(true)
      expect(isEmail('first.last@example.com')).toBe(true)
    })

    it('should validate emails with numbers', () => {
      expect(isEmail('user123@example.com')).toBe(true)
      expect(isEmail('123user@example.com')).toBe(true)
      expect(isEmail('test@123domain.com')).toBe(true)
    })

    it('should validate emails with UTF-8 characters when allowed', () => {
      expect(isEmail('用户@example.com', { allowUtf8LocalPart: true })).toBe(true)
      expect(isEmail('user@例え.jp', { allowUtf8LocalPart: true })).toBe(true)
    })

    it('should validate emails without TLD when not required', () => {
      expect(isEmail('admin@localhost', { requireTld: false })).toBe(true)
      expect(isEmail('test@server', { requireTld: false })).toBe(true)
    })
  })

  describe('invalid emails', () => {
    it('should reject empty strings', () => {
      expect(isEmail('')).toBe(false)
    })

    it('should reject non-string values', () => {
      expect(isEmail(123 as any)).toBe(false)
      expect(isEmail(null as any)).toBe(false)
      expect(isEmail(undefined as any)).toBe(false)
    })

    it('should reject emails without @', () => {
      expect(isEmail('userexample.com')).toBe(false)
      expect(isEmail('user.example.com')).toBe(false)
    })

    it('should reject emails without domain', () => {
      expect(isEmail('user@')).toBe(false)
      expect(isEmail('@example.com')).toBe(false)
    })

    it('should reject emails with multiple @ symbols', () => {
      expect(isEmail('user@@example.com')).toBe(false)
      expect(isEmail('user@domain@example.com')).toBe(false)
    })

    it('should reject emails with spaces', () => {
      expect(isEmail('user @example.com')).toBe(false)
      expect(isEmail('user@ example.com')).toBe(false)
      expect(isEmail('user@example .com')).toBe(false)
    })

    it('should reject emails without TLD by default', () => {
      expect(isEmail('admin@localhost')).toBe(false)
      expect(isEmail('test@server')).toBe(false)
    })
  })

  describe('options', () => {
    it('should respect requireTld option', () => {
      expect(isEmail('admin@localhost', { requireTld: true })).toBe(false)
      expect(isEmail('admin@localhost', { requireTld: false })).toBe(true)
    })

    it('should respect allowUtf8LocalPart option', () => {
      expect(isEmail('用户@example.com', { allowUtf8LocalPart: true })).toBe(true)
      expect(isEmail('用户@example.com', { allowUtf8LocalPart: false })).toBe(false)
    })

    it('should respect blacklistedChars option', () => {
      expect(isEmail('user!name@example.com', { blacklistedChars: '!' })).toBe(false)
      expect(isEmail('user#name@example.com', { blacklistedChars: '#' })).toBe(false)
      expect(isEmail('username@example.com', { blacklistedChars: '!' })).toBe(true)
    })

    it('should respect hostWhitelist option', () => {
      expect(
        isEmail('user@example.com', { hostWhitelist: ['example.com', 'test.com'] })
      ).toBe(true)
      expect(
        isEmail('user@other.com', { hostWhitelist: ['example.com', 'test.com'] })
      ).toBe(false)
    })

    it('should respect hostBlacklist option', () => {
      expect(
        isEmail('user@spam.com', { hostBlacklist: ['spam.com', 'fake.com'] })
      ).toBe(false)
      expect(
        isEmail('user@example.com', { hostBlacklist: ['spam.com', 'fake.com'] })
      ).toBe(true)
    })

    it('should support allowed and required display names', () => {
      expect(
        isEmail('Alice <alice@example.com>', { allowDisplayName: true })
      ).toBe(true)
      expect(isEmail('alice@example.com', { requireDisplayName: true })).toBe(false)
      expect(
        isEmail('Alice <alice@example.com>', { requireDisplayName: true })
      ).toBe(true)
    })

    it('should validate quoted display-name escapes', () => {
      expect(
        isEmail('"Alice \\"Example\\"" <alice@example.com>', { allowDisplayName: true })
      ).toBe(true)
      expect(
        isEmail('"Alice "Example"" <alice@example.com>', { allowDisplayName: true })
      ).toBe(false)
      expect(
        isEmail('"Alice\\" <alice@example.com>', { allowDisplayName: true })
      ).toBe(false)
    })

    it('should compare host restrictions case-insensitively', () => {
      expect(
        isEmail('user@EXAMPLE.COM', { hostWhitelist: ['example.com'] })
      ).toBe(true)
      expect(
        isEmail('user@SPAM.COM', { hostBlacklist: ['spam.com'] })
      ).toBe(false)
    })

    it('should treat blacklistedChars as literal characters', () => {
      expect(() =>
        isEmail('user@example.com', { blacklistedChars: '\\' })
      ).not.toThrow()
      expect(isEmail('user@example.com', { blacklistedChars: '\\' })).toBe(true)
    })

    it('should not disable a non-empty whitelist containing invalid hosts', () => {
      expect(
        isEmail('user@example.com', { hostWhitelist: ['not_a_domain'] })
      ).toBe(false)
    })

    it('should reject malformed option shapes without throwing', () => {
      expect(isEmail('user@example.com', null as any)).toBe(false)
      expect(
        isEmail('user@example.com', { blacklistedChars: null } as any)
      ).toBe(false)
      expect(
        isEmail('user@example.com', { hostWhitelist: null } as any)
      ).toBe(false)
      expect(
        isEmail('user@example.com', { hostBlacklist: null } as any)
      ).toBe(false)
      expect(
        isEmail('user@example.com', { hostWhitelist: [null] } as any)
      ).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle very long emails', () => {
      const longLocal = 'a'.repeat(64)
      const longEmail = `${longLocal}@example.com`
      expect(isEmail(longEmail)).toBe(true)
    })

    it('should reject emails with consecutive dots in local part', () => {
      // RFC 5322 does NOT allow consecutive dots in the local part
      expect(isEmail('user..name@example.com')).toBe(false)
      expect(isEmail('..user@example.com')).toBe(false)
      expect(isEmail('user..@example.com')).toBe(false)
    })

    it('should reject emails with leading or trailing dots in local part', () => {
      expect(isEmail('.user@example.com')).toBe(false)
      expect(isEmail('user.@example.com')).toBe(false)
    })

    it('should allow single dots in local part', () => {
      expect(isEmail('user.name@example.com')).toBe(true)
      expect(isEmail('first.middle.last@example.com')).toBe(true)
    })

    it('should handle emails with dashes in domain', () => {
      expect(isEmail('user@my-domain.com')).toBe(true)
      expect(isEmail('user@sub-domain.example.com')).toBe(true)
    })

    it('should handle emails with trailing dot in domain', () => {
      // Trailing dot is technically valid DNS (FQDN) but most validators reject it
      expect(isEmail('user@example.com.')).toBe(true)
    })

    it('should reject malformed domain labels', () => {
      expect(isEmail('a@example..com')).toBe(false)
      expect(isEmail('a@-example.com')).toBe(false)
      expect(isEmail('a@example-.com')).toBe(false)
      expect(isEmail('a@exam_ple.com')).toBe(false)
      expect(isEmail('a@example.c')).toBe(false)
      expect(isEmail('a@example.123')).toBe(false)
      expect(isEmail('a@example.com:443')).toBe(false)
      expect(isEmail('a@example.com?query')).toBe(false)
    })

    it('should enforce the local-part byte limit', () => {
      expect(isEmail(`${'a'.repeat(65)}@example.com`)).toBe(false)
    })

    it('should enforce the configurable total-input limit', () => {
      const email = `Alice ${'a'.repeat(240)} <alice@example.com>`
      expect(isEmail(email, { allowDisplayName: true })).toBe(false)
      expect(isEmail(email, { allowDisplayName: true, maxLength: email.length })).toBe(true)
    })
  })
})

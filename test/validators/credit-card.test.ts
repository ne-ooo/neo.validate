import { describe, it, expect } from 'vitest'
import { isCreditCard } from '../../src/index.js'

// All numbers below are well-known public test numbers safe for use in tests.
// They pass the Luhn algorithm but are not real card numbers.

describe('isCreditCard', () => {
  describe('valid card numbers', () => {
    it('accepts a valid Visa card number', () => {
      expect(isCreditCard('4532015112830366')).toBe(true)
    })
    it('accepts a valid Mastercard number', () => {
      expect(isCreditCard('5425233430109903')).toBe(true)
    })
    it('accepts a valid American Express number', () => {
      expect(isCreditCard('374245455400126')).toBe(true)
    })
    it('accepts a valid Discover card number', () => {
      expect(isCreditCard('6011111111111117')).toBe(true)
    })
    it('accepts number with spaces', () => {
      expect(isCreditCard('4532 0151 1283 0366')).toBe(true)
    })
    it('accepts number with hyphens', () => {
      expect(isCreditCard('4532-0151-1283-0366')).toBe(true)
    })
    it('accepts a card from the required provider', () => {
      expect(isCreditCard('4532015112830366', { provider: 'visa' })).toBe(true)
    })
    it('accepts current Discover issuer ranges', () => {
      expect(isCreditCard('6221260000000000', { provider: 'discover' })).toBe(true)
      expect(isCreditCard('6229250000000003', { provider: 'discover' })).toBe(true)
      expect(isCreditCard('6440000000000005', { provider: 'discover' })).toBe(true)
    })
    it('accepts current JCB range boundaries', () => {
      expect(isCreditCard('3528000000000007', { provider: 'jcb' })).toBe(true)
      expect(isCreditCard('3589000000000003', { provider: 'jcb' })).toBe(true)
    })
  })

  describe('invalid card numbers', () => {
    it('rejects a number that fails the Luhn check', () => {
      // Visa number with last digit changed to fail Luhn
      expect(isCreditCard('4532015112830367')).toBe(false)
    })
    it('rejects Mastercard with wrong check digit', () => {
      expect(isCreditCard('5425233430109900')).toBe(false)
    })
    it('rejects a number that is too short (12 digits)', () => {
      expect(isCreditCard('453201511283')).toBe(false)
    })
    it('rejects a number that is too long (20 digits)', () => {
      expect(isCreditCard('45320151128303661234')).toBe(false)
    })
    it('rejects non-numeric input', () => {
      expect(isCreditCard('not-a-card-number')).toBe(false)
    })
    it('rejects all zeros (degenerate number no issuer uses)', () => {
      // Fixed: all-identical-digit numbers are now rejected explicitly.
      expect(isCreditCard('0000000000000000')).toBe(false)
    })
    it('rejects a Luhn-valid number outside supported issuer ranges', () => {
      expect(isCreditCard('1234567812345670')).toBe(false)
    })
    it('rejects a card from a different required provider', () => {
      expect(isCreditCard('4532015112830366', { provider: 'mastercard' })).toBe(false)
    })
    it('rejects values outside current JCB issuer ranges', () => {
      expect(isCreditCard('3500000000000009', { provider: 'jcb' })).toBe(false)
      expect(isCreditCard('3590000000000000', { provider: 'jcb' })).toBe(false)
    })
    it('rejects malformed provider options without throwing', () => {
      expect(isCreditCard('4532015112830366', null as any)).toBe(false)
      expect(isCreditCard('4532015112830366', { provider: 'unknown' } as any)).toBe(false)
    })
    it('rejects non-conventional whitespace separators', () => {
      expect(isCreditCard('4532\n0151\n1283\n0366')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isCreditCard('')).toBe(false)
    })
  })
})

import { describe, expect, it } from 'vitest'
import {
  isAlpha,
  isAlphanumeric,
  isBase64,
  isCreditCard,
  isDecimal,
  isEmail,
  isFloat,
  isInt,
  isJSON,
  isLength,
  isMACAddress,
  isNumeric,
  isURL,
  isJWT,
  ltrim,
  normalizeEmail,
  rtrim,
  stripLow,
  trim,
} from '../../src/index.js'

describe('runtime argument contract', () => {
  it('returns false for malformed validator options', () => {
    const calls = [
      () => isEmail('user@example.com', null as any),
      () => isURL('https://example.com', { requireHost: 'yes' } as any),
      () => isNumeric('1', null as any),
      () => isInt('1', null as any),
      () => isFloat('1', null as any),
      () => isDecimal('1.0', null as any),
      () => isAlpha('abc', null as any),
      () => isAlphanumeric('abc1', 1 as any),
      () => isLength('abc', null as any),
      () => isBase64('YQ==', null as any),
      () => isJSON('{}', null as any),
      () => isMACAddress('00:00:00:00:00:00', null as any),
      () => isJWT('a.a.a', null as any),
      () => isCreditCard('4111111111111111', null as any),
    ]

    for (const call of calls) {
      expect(call).not.toThrow()
      expect(call()).toBe(false)
    }
  })

  it('returns a string for malformed sanitizer arguments', () => {
    const calls = [
      () => trim('abc', null as any),
      () => ltrim('abc', 1 as any),
      () => rtrim('abc', {} as any),
      () => normalizeEmail(null as any),
      () => normalizeEmail('a@example.com', null as any),
      () => stripLow('abc', 'yes' as any),
    ]

    for (const call of calls) {
      expect(call).not.toThrow()
      expect(typeof call()).toBe('string')
    }
  })
})

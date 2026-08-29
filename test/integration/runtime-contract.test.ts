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

  it('rejects option accessors and revoked proxies without executing them', () => {
    const accessor = (key: string) =>
      Object.defineProperty({}, key, {
        get() {
          throw new Error('option accessors must not execute')
        },
      })
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJl'
    const accessorCalls = [
      () => isEmail('user@example.com', accessor('requireTld')),
      () => isURL('https://example.com', accessor('requireHost')),
      () => isNumeric('1', accessor('min')),
      () => isInt('1', accessor('allowLeadingZeroes')),
      () => isFloat('1.5', accessor('locale')),
      () => isDecimal('1.5', accessor('locale')),
      () => isLength('abc', accessor('min')),
      () => isBase64('YQ==', accessor('urlSafe')),
      () => isJSON('{}', accessor('maxLength')),
      () => isMACAddress('00:00:00:00:00:00', accessor('allowColon')),
      () => isJWT(jwt, accessor('maxLength')),
      () => isCreditCard('4111111111111111', accessor('provider')),
    ]

    for (const call of accessorCalls) {
      expect(call).not.toThrow()
      expect(call()).toBe(false)
    }
    expect(() => normalizeEmail('User@Example.com', accessor('allLowercase'))).not.toThrow()
    expect(normalizeEmail('User@Example.com', accessor('allLowercase'))).toBe(
      'User@Example.com'
    )

    const revoked = Proxy.revocable({}, {})
    revoked.revoke()
    const proxyCalls = [
      () => isEmail('user@example.com', revoked.proxy),
      () => isURL('https://example.com', revoked.proxy),
      () => isNumeric('1', revoked.proxy),
      () => isInt('1', revoked.proxy),
      () => isFloat('1.5', revoked.proxy),
      () => isDecimal('1.5', revoked.proxy),
      () => isLength('abc', revoked.proxy),
      () => isBase64('YQ==', revoked.proxy),
      () => isJSON('{}', revoked.proxy),
      () => isMACAddress('00:00:00:00:00:00', revoked.proxy),
      () => isJWT(jwt, revoked.proxy),
      () => isCreditCard('4111111111111111', revoked.proxy),
    ]
    for (const call of proxyCalls) {
      expect(call).not.toThrow()
      expect(call()).toBe(false)
    }
    expect(normalizeEmail('User@Example.com', revoked.proxy)).toBe('User@Example.com')
  })

  it('ignores inherited option policies across the public API', () => {
    const inherited = (key: string, value: unknown) => Object.create({ [key]: value })
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJl'

    expect(isEmail('user@localhost', inherited('requireTld', false))).toBe(false)
    expect(isURL('data:text/plain,hello', inherited('allowDataUrl', true))).toBe(false)
    expect(isNumeric('1', inherited('min', 2))).toBe(true)
    expect(isInt('01', inherited('allowLeadingZeroes', true))).toBe(false)
    expect(isFloat('1.5', inherited('locale', 'de-DE'))).toBe(true)
    expect(isDecimal('1.5', inherited('locale', 'de-DE'))).toBe(true)
    expect(isLength('abc', inherited('min', 4))).toBe(true)
    expect(isBase64('_w==', inherited('urlSafe', true))).toBe(false)
    expect(isJSON('{}', inherited('maxLength', 1))).toBe(true)
    expect(
      isMACAddress('00:00:00:00:00:00', inherited('allowColon', false))
    ).toBe(true)
    expect(isJWT(jwt, inherited('maxLength', 1))).toBe(true)
    expect(
      isCreditCard('4111111111111111', inherited('provider', 'amex'))
    ).toBe(true)
    expect(normalizeEmail('User@Example.com', inherited('allLowercase', false))).toBe(
      'user@example.com'
    )
  })
})

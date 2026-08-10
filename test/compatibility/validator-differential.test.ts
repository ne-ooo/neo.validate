import { describe, expect, it } from 'vitest'
import validator from 'validator'
import {
  escape,
  isAlpha,
  isAlphanumeric,
  isAscii,
  isBase64,
  isCreditCard,
  isEmail,
  isFloat,
  isHexColor,
  isHexadecimal,
  isInt,
  isIP,
  isJSON,
  isMongoId,
  isNumeric,
  isURL,
  isUUID,
  normalizeEmail,
  stripLow,
  trim,
  unescape,
} from '../../src/index.js'

function expectSameResult(
  values: string[],
  neoValidator: (value: string) => boolean,
  referenceValidator: (value: string) => boolean
): void {
  for (const value of values) {
    expect(neoValidator(value), value).toBe(referenceValidator(value))
  }
}

describe('validator.js differential checks for the shared contract', () => {
  it('matches email results for shared syntax and mapped options', () => {
    expectSameResult(
      [
        'user@example.com',
        'user+tag@example.com',
        '用户@example.com',
        'user@例え.jp',
        'invalid',
        'a@example..com',
        'a@-example.com',
      ],
      isEmail,
      validator.isEmail
    )

    const displayAddress = 'Alice Example <alice@example.com>'
    expect(isEmail(displayAddress, { allowDisplayName: true })).toBe(
      validator.isEmail(displayAddress, { allow_display_name: true })
    )
    expect(isEmail('user@localhost', { requireTld: false })).toBe(
      validator.isEmail('user@localhost', { require_tld: false })
    )
    expect(isEmail('user@example.com', { hostWhitelist: ['example.com'] })).toBe(
      validator.isEmail('user@example.com', { host_whitelist: ['example.com'] })
    )
  })

  it('matches URL results when all differing defaults are mapped', () => {
    const values = [
      'https://example.com',
      'https://example.com/path?q=1#part',
      'ftp://files.example.com',
      'http://localhost',
      'not a url',
    ]

    for (const value of values) {
      expect(
        isURL(value, { requireProtocol: true, requireTld: true }),
        value
      ).toBe(
        validator.isURL(value, {
          require_protocol: true,
          require_tld: true,
        })
      )
    }

    expect(
      isURL('example.com', { requireProtocol: false, requireTld: true })
    ).toBe(
      validator.isURL('example.com', {
        require_protocol: false,
        require_tld: true,
      })
    )
  })

  it('matches numeric validators for their shared decimal grammar', () => {
    expectSameResult(
      ['123', '-12.5', '+12.5', '.5', '0x10', '   ', '1e3'],
      isNumeric,
      validator.isNumeric
    )

    for (const value of ['0', '42', '-42', '012', '-01', '1.5']) {
      expect(isInt(value, { allowLeadingZeroes: false }), value).toBe(
        validator.isInt(value, { allow_leading_zeroes: false })
      )
    }

    expectSameResult(
      ['12.5', '-0.5', '.5', '1e3', 'abc'],
      isFloat,
      validator.isFloat
    )
  })

  it('matches shared string, network, identifier, and format checks', () => {
    expectSameResult(['Hello', 'Hello1', ''], isAlpha, validator.isAlpha)
    expectSameResult(['Hello123', 'Hello-123', ''], isAlphanumeric, validator.isAlphanumeric)
    expectSameResult(['ASCII', 'café'], isAscii, validator.isAscii)
    expectSameResult(['127.0.0.1', '2001:db8::1', '999.0.0.1'], isIP, validator.isIP)
    expectSameResult(
      ['550e8400-e29b-41d4-a716-446655440000', 'not-a-uuid'],
      isUUID,
      validator.isUUID
    )
    expectSameResult(
      ['507f1f77bcf86cd799439011', 'not-an-object-id'],
      isMongoId,
      validator.isMongoId
    )
    expectSameResult(['deadbeef', 'xyz'], isHexadecimal, validator.isHexadecimal)
    expectSameResult(['#fff', '#abcdef', 'red'], isHexColor, validator.isHexColor)
    expectSameResult(['{"key":1}', '[1,2]', 'invalid'], isJSON, validator.isJSON)
    expectSameResult(['SGVsbG8=', 'A=', 'not base64'], isBase64, validator.isBase64)
    expectSameResult(
      ['4532015112830366', '1234567812345670', 'not-a-card'],
      isCreditCard,
      validator.isCreditCard
    )
  })

  it('matches shared sanitizer behavior', () => {
    for (const value of ['<script>alert("x")</script>', 'A & B', 'plain text']) {
      expect(escape(value), value).toBe(validator.escape(value))
    }

    for (const value of ['&lt;p&gt;', '&#x27;', 'plain text']) {
      expect(unescape(value), value).toBe(validator.unescape(value))
    }

    expect(trim('__value__', '_')).toBe(validator.trim('__value__', '_'))
    expect(stripLow('a\x00b\nc')).toBe(validator.stripLow('a\x00b\nc'))
    expect(normalizeEmail('Test.User+tag@Gmail.com')).toBe(
      validator.normalizeEmail('Test.User+tag@Gmail.com')
    )
  })
})

import { describe, it, expect } from 'vitest'
import { isJSON, isBase64, isHexadecimal, isHexColor, isISO8601, isRFC3339 } from '../../src/index.js'

describe('isJSON', () => {
  describe('valid JSON', () => {
    it('accepts a JSON object', () => {
      expect(isJSON('{"key": "value"}')).toBe(true)
    })
    it('accepts a JSON array', () => {
      expect(isJSON('[1, 2, 3]')).toBe(true)
    })
    it('accepts JSON null', () => {
      expect(isJSON('null')).toBe(true)
    })
    it('accepts JSON true', () => {
      expect(isJSON('true')).toBe(true)
    })
    it('accepts JSON number', () => {
      expect(isJSON('42')).toBe(true)
    })
    it('accepts JSON string', () => {
      expect(isJSON('"hello"')).toBe(true)
    })
    it('accepts nested object', () => {
      expect(isJSON('{"a": {"b": [1, 2, 3]}}')).toBe(true)
    })
    it('accepts empty object', () => {
      expect(isJSON('{}')).toBe(true)
    })
    it('accepts empty array', () => {
      expect(isJSON('[]')).toBe(true)
    })
  })

  describe('invalid JSON', () => {
    it('rejects plain identifier', () => {
      expect(isJSON('invalid')).toBe(false)
    })
    it('rejects single-quoted string', () => {
      expect(isJSON("'hello'")).toBe(false)
    })
    it('rejects trailing comma object', () => {
      expect(isJSON('{"a": 1,}')).toBe(false)
    })
    it('rejects undefined', () => {
      expect(isJSON('undefined')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isJSON('')).toBe(false)
    })
  })

  it('enforces the configurable input limit', () => {
    const json = JSON.stringify('a'.repeat(100))
    expect(isJSON(json, { maxLength: 50 })).toBe(false)
    expect(isJSON(json, { maxLength: json.length })).toBe(true)
    expect(isJSON(json, null as any)).toBe(false)
  })
})

describe('isBase64', () => {
  describe('standard Base64', () => {
    it('accepts valid Base64 with padding', () => {
      expect(isBase64('SGVsbG8gV29ybGQ=')).toBe(true)
    })
    it('accepts valid Base64 without padding', () => {
      expect(isBase64('SGVsbG8gV29ybGQ')).toBe(true)
    })
    it('accepts Base64 with double padding', () => {
      expect(isBase64('SGVsbG8=')).toBe(true)
    })
    it('accepts long Base64 string', () => {
      expect(isBase64('dGhpcyBpcyBhIGxvbmcgc3RyaW5n')).toBe(true)
    })
    it('accepts valid two- and three-character unpadded Base64', () => {
      expect(isBase64('Zg')).toBe(true)
      expect(isBase64('Zm8')).toBe(true)
    })
    it('rejects Base64url chars in standard mode', () => {
      expect(isBase64('SGVsbG8-V29ybGQ')).toBe(false)
    })
  })

  describe('URL-safe Base64', () => {
    it('accepts URL-safe Base64 with - and _', () => {
      expect(isBase64('SGVsbG8-V29ybGQ', { urlSafe: true })).toBe(true)
    })
    it('accepts standard alphanum in urlSafe mode', () => {
      expect(isBase64('SGVsbG8gV29ybGQ', { urlSafe: true })).toBe(true)
    })
    it('rejects + in urlSafe mode', () => {
      expect(isBase64('SGVs+G8', { urlSafe: true })).toBe(false)
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty string', () => {
      expect(isBase64('')).toBe(false)
    })
    it('rejects string with spaces', () => {
      expect(isBase64('SGVs bG8=')).toBe(false)
    })
    it('rejects padding in the middle', () => {
      expect(isBase64('SGVs=bG8=')).toBe(false)
    })
    it('rejects impossible lengths and padding', () => {
      expect(isBase64('A')).toBe(false)
      expect(isBase64('A=')).toBe(false)
      expect(isBase64('abcde')).toBe(false)
      expect(isBase64('AAAA=')).toBe(false)
      expect(isBase64('AAA==')).toBe(false)
    })
    it('rejects non-canonical trailing bits', () => {
      expect(isBase64('AB==')).toBe(false)
      expect(isBase64('AAB=')).toBe(false)
    })
    it('rejects malformed options without throwing', () => {
      expect(isBase64('SGVsbG8=', null as any)).toBe(false)
      expect(isBase64('SGVsbG8=', { urlSafe: 'yes' } as any)).toBe(false)
    })
  })
})

describe('isHexadecimal', () => {
  it('accepts lowercase hex', () => {
    expect(isHexadecimal('deadbeef')).toBe(true)
  })
  it('accepts uppercase hex', () => {
    expect(isHexadecimal('DEADBEEF')).toBe(true)
  })
  it('accepts mixed case hex', () => {
    expect(isHexadecimal('DeAdBeEf')).toBe(true)
  })
  it('accepts digits only', () => {
    expect(isHexadecimal('1234567890')).toBe(true)
  })
  it('accepts single char', () => {
    expect(isHexadecimal('f')).toBe(true)
  })
  it('rejects 0x prefix', () => {
    expect(isHexadecimal('0xdeadbeef')).toBe(false)
  })
  it('rejects non-hex letter', () => {
    expect(isHexadecimal('ghijkl')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isHexadecimal('')).toBe(false)
  })
  it('rejects string with space', () => {
    expect(isHexadecimal('dead beef')).toBe(false)
  })
})

describe('isHexColor', () => {
  describe('valid formats', () => {
    it('accepts 3-digit hex color', () => {
      expect(isHexColor('#fff')).toBe(true)
    })
    it('accepts 6-digit hex color', () => {
      expect(isHexColor('#ffffff')).toBe(true)
    })
    it('accepts 8-digit hex color with alpha', () => {
      expect(isHexColor('#ffffffff')).toBe(true)
    })
    it('accepts uppercase hex color', () => {
      expect(isHexColor('#FFFFFF')).toBe(true)
    })
    it('accepts mixed case hex color', () => {
      expect(isHexColor('#FfFfFf')).toBe(true)
    })
    it('accepts black', () => {
      expect(isHexColor('#000000')).toBe(true)
    })
  })

  describe('invalid formats', () => {
    it('rejects missing # prefix', () => {
      expect(isHexColor('ffffff')).toBe(false)
    })
    it('rejects 4-digit hex', () => {
      expect(isHexColor('#ffff')).toBe(false)
    })
    it('rejects 5-digit hex', () => {
      expect(isHexColor('#fffff')).toBe(false)
    })
    it('rejects non-hex characters', () => {
      expect(isHexColor('#gggggg')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isHexColor('')).toBe(false)
    })
    it('rejects just #', () => {
      expect(isHexColor('#')).toBe(false)
    })
  })
})

describe('isISO8601', () => {
  describe('valid formats', () => {
    it('accepts date-only format', () => {
      expect(isISO8601('2023-12-25')).toBe(true)
    })
    it('accepts datetime with Z timezone', () => {
      expect(isISO8601('2023-12-25T10:30:00Z')).toBe(true)
    })
    it('accepts datetime with offset', () => {
      expect(isISO8601('2023-12-25T10:30:00+00:00')).toBe(true)
    })
    it('accepts datetime with negative offset', () => {
      expect(isISO8601('2023-12-25T10:30:00-05:00')).toBe(true)
    })
    it('accepts datetime with milliseconds', () => {
      expect(isISO8601('2023-12-25T10:30:00.123Z')).toBe(true)
    })
    it('accepts datetime without timezone', () => {
      expect(isISO8601('2023-12-25T10:30:00')).toBe(true)
    })
    it('accepts fractional seconds longer than milliseconds', () => {
      expect(isISO8601('2023-12-25T10:30:00.123456Z')).toBe(true)
    })
    it('accepts the ISO 8601 end-of-day representation', () => {
      expect(isISO8601('2023-12-25T24:00:00Z')).toBe(true)
      expect(isISO8601('2023-12-25T24:00:00.000Z')).toBe(true)
    })
  })

  describe('invalid formats', () => {
    it('rejects Feb 30 (invalid calendar date)', () => {
      // Fixed: calendar date is now validated directly — Feb 30 does not exist.
      expect(isISO8601('2023-02-30')).toBe(false)
    })
    it('rejects non-ISO format', () => {
      expect(isISO8601('12/25/2023')).toBe(false)
    })
    it('rejects plain text', () => {
      expect(isISO8601('not-a-date')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isISO8601('')).toBe(false)
    })
    it('rejects month 13', () => {
      expect(isISO8601('2023-13-01')).toBe(false)
    })
    it('rejects invalid time and timezone fields', () => {
      expect(isISO8601('2024-01-01T24:00:01Z')).toBe(false)
      expect(isISO8601('2024-01-01T24:00:00.001Z')).toBe(false)
      expect(isISO8601('2024-01-01T23:60:00Z')).toBe(false)
      expect(isISO8601('2024-01-01T23:59:60Z')).toBe(false)
      expect(isISO8601('2024-01-01T23:59:59+24:00')).toBe(false)
      expect(isISO8601('2024-01-01T23:59:59+14:01')).toBe(false)
      expect(isISO8601('2024-01-01T99:99:99+99:99')).toBe(false)
    })
  })
})

describe('isRFC3339', () => {
  describe('valid formats', () => {
    it('accepts datetime with Z', () => {
      expect(isRFC3339('2023-12-25T10:30:00Z')).toBe(true)
    })
    it('accepts datetime with positive offset', () => {
      expect(isRFC3339('2023-12-25T10:30:00+00:00')).toBe(true)
    })
    it('accepts datetime with negative offset', () => {
      expect(isRFC3339('2023-12-25T10:30:00-05:30')).toBe(true)
    })
    it('accepts datetime with fractional seconds', () => {
      expect(isRFC3339('2023-12-25T10:30:00.123Z')).toBe(true)
    })
    it('accepts datetime with nanosecond precision', () => {
      expect(isRFC3339('2023-12-25T10:30:00.123456789Z')).toBe(true)
    })
    it('accepts lowercase t and z and possible UTC leap-second boundaries', () => {
      expect(isRFC3339('2023-12-25t10:30:00z')).toBe(true)
      expect(isRFC3339('2016-12-31T23:59:60Z')).toBe(true)
      expect(isRFC3339('2017-01-01T00:59:60+01:00')).toBe(true)
      expect(isRFC3339('2016-12-31T18:59:60-05:00')).toBe(true)
    })
  })

  describe('invalid formats', () => {
    it('rejects date-only (RFC 3339 requires time)', () => {
      expect(isRFC3339('2023-12-25')).toBe(false)
    })
    it('rejects datetime without timezone', () => {
      expect(isRFC3339('2023-12-25T10:30:00')).toBe(false)
    })
    it('rejects non-RFC format', () => {
      expect(isRFC3339('12/25/2023 10:30:00')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isRFC3339('')).toBe(false)
    })
    it('rejects Feb 30 in RFC format (invalid calendar date)', () => {
      // Fixed: calendar date is now validated directly — Feb 30 does not exist.
      expect(isRFC3339('2023-02-30T10:30:00Z')).toBe(false)
    })
    it('rejects invalid time and timezone fields', () => {
      expect(isRFC3339('2024-01-01T24:00:00Z')).toBe(false)
      expect(isRFC3339('2024-01-01T23:60:00Z')).toBe(false)
      expect(isRFC3339('2024-01-01T23:59:61Z')).toBe(false)
      expect(isRFC3339('2024-01-01T23:59:59+24:00')).toBe(false)
      expect(isRFC3339('2024-01-01T99:99:99+99:99')).toBe(false)
    })
    it('rejects leap seconds away from possible UTC boundaries', () => {
      expect(isRFC3339('2023-12-25T23:59:60Z')).toBe(false)
      expect(isRFC3339('2016-12-31T22:59:60Z')).toBe(false)
      expect(isRFC3339('2017-01-01T00:59:60Z')).toBe(false)
      expect(isRFC3339('2016-12-31T23:59:60+01:00')).toBe(false)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { isIP, isMACAddress, isPort } from '../../src/index.js'

describe('isIP', () => {
  describe('IPv4', () => {
    it('accepts a valid IPv4 address', () => {
      expect(isIP('192.168.1.1')).toBe(true)
    })
    it('accepts loopback address', () => {
      expect(isIP('127.0.0.1')).toBe(true)
    })
    it('accepts broadcast address', () => {
      expect(isIP('255.255.255.255')).toBe(true)
    })
    it('accepts all zeros', () => {
      expect(isIP('0.0.0.0')).toBe(true)
    })
    it('accepts with version 4 constraint', () => {
      expect(isIP('192.168.1.1', 4)).toBe(true)
    })
    it('rejects IPv4 when version is 6', () => {
      expect(isIP('192.168.1.1', 6)).toBe(false)
    })
    it('rejects octets above 255', () => {
      expect(isIP('999.999.999.999')).toBe(false)
    })
    it('rejects partial address', () => {
      expect(isIP('192.168')).toBe(false)
    })
    it('rejects address with leading zeros in octet', () => {
      // Fixed: leading zeros like 01, 001 are now rejected (RFC-conformant).
      expect(isIP('192.168.01.1')).toBe(false)
    })
    it('rejects address with extra octets', () => {
      expect(isIP('192.168.1.1.1')).toBe(false)
    })
  })

  it('rejects an unsupported runtime version', () => {
    expect(isIP('127.0.0.1', 5 as any)).toBe(false)
  })

  describe('IPv6', () => {
    it('accepts a full IPv6 address', () => {
      expect(isIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
    })
    it('accepts compressed IPv6 (::1)', () => {
      expect(isIP('::1')).toBe(true)
    })
    it('accepts all-zeros IPv6', () => {
      expect(isIP('::')).toBe(true)
    })
    it('accepts compressed middle groups', () => {
      expect(isIP('2001:db8::1')).toBe(true)
    })
    it('accepts with version 6 constraint', () => {
      expect(isIP('::1', 6)).toBe(true)
    })
    it('rejects IPv6 when version is 4', () => {
      expect(isIP('::1', 4)).toBe(false)
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty string', () => {
      expect(isIP('')).toBe(false)
    })
    it('rejects plain text', () => {
      expect(isIP('not-an-ip')).toBe(false)
    })
    it('rejects hostname', () => {
      expect(isIP('localhost')).toBe(false)
    })
  })
})

describe('isMACAddress', () => {
  describe('colon separator', () => {
    it('accepts valid colon-separated MAC (uppercase)', () => {
      expect(isMACAddress('00:1B:63:84:45:E6')).toBe(true)
    })
    it('accepts valid colon-separated MAC (lowercase)', () => {
      expect(isMACAddress('00:1b:63:84:45:e6')).toBe(true)
    })
    it('accepts all-zeros MAC', () => {
      expect(isMACAddress('00:00:00:00:00:00')).toBe(true)
    })
  })

  it('rejects malformed options without throwing', () => {
    expect(isMACAddress('00:1B:63:84:45:E6', null as any)).toBe(false)
    expect(
      isMACAddress('00:1B:63:84:45:E6', { allowColon: 'yes' } as any)
    ).toBe(false)
  })

  describe('hyphen separator', () => {
    it('accepts valid hyphen-separated MAC', () => {
      expect(isMACAddress('00-1B-63-84-45-E6')).toBe(true)
    })
    it('accepts lowercase hyphen-separated MAC', () => {
      expect(isMACAddress('00-1b-63-84-45-e6')).toBe(true)
    })
  })

  describe('dot separator (Cisco format)', () => {
    it('accepts Cisco dot-format when allowDot is true', () => {
      expect(isMACAddress('001B.6384.45E6', { allowDot: true })).toBe(true)
    })
    it('rejects Cisco format when allowDot is false (default)', () => {
      expect(isMACAddress('001B.6384.45E6')).toBe(false)
    })
  })

  describe('no separator', () => {
    it('accepts 12-char hex with noSeparator option', () => {
      expect(isMACAddress('001B638445E6', { noSeparator: true })).toBe(true)
    })
    it('rejects 12-char hex without noSeparator option', () => {
      expect(isMACAddress('001B638445E6')).toBe(false)
    })
  })

  describe('options: disable separators', () => {
    it('rejects colon format when allowColon is false', () => {
      expect(isMACAddress('00:1B:63:84:45:E6', { allowColon: false })).toBe(false)
    })
    it('rejects hyphen format when allowHyphen is false', () => {
      expect(isMACAddress('00-1B-63-84-45-E6', { allowHyphen: false })).toBe(false)
    })
  })

  describe('invalid inputs', () => {
    it('rejects short MAC', () => {
      expect(isMACAddress('00:1B:63')).toBe(false)
    })
    it('rejects non-hex characters', () => {
      expect(isMACAddress('GG:HH:II:JJ:KK:LL')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isMACAddress('')).toBe(false)
    })
    it('rejects plain text', () => {
      expect(isMACAddress('not-a-mac')).toBe(false)
    })
  })
})

describe('isPort', () => {
  describe('valid ports', () => {
    it('accepts port 1 (minimum)', () => {
      expect(isPort('1')).toBe(true)
    })
    it('accepts port 80', () => {
      expect(isPort('80')).toBe(true)
    })
    it('accepts port 443', () => {
      expect(isPort('443')).toBe(true)
    })
    it('accepts port 8080', () => {
      expect(isPort('8080')).toBe(true)
    })
    it('accepts port 65535 (maximum)', () => {
      expect(isPort('65535')).toBe(true)
    })
  })

  describe('invalid ports', () => {
    it('rejects port 0 (below minimum)', () => {
      expect(isPort('0')).toBe(false)
    })
    it('rejects port 65536 (above maximum)', () => {
      expect(isPort('65536')).toBe(false)
    })
    it('rejects negative port', () => {
      expect(isPort('-1')).toBe(false)
    })
    it('rejects non-numeric string', () => {
      expect(isPort('abc')).toBe(false)
    })
    it('rejects float', () => {
      expect(isPort('80.5')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isPort('')).toBe(false)
    })
    it('accepts port with leading zeros (Number("080") === 80, which is valid)', () => {
      // The implementation uses Number(str) which drops leading zeros.
      // Stricter validation would reject "080" to avoid ambiguity.
      expect(isPort('080')).toBe(true)
    })
  })
})

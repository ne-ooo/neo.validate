import { describe, it, expect } from 'vitest'
import { isUUID, isISBN, isMongoId, isJWT } from '../../src/index.js'

describe('isUUID', () => {
  describe('any version', () => {
    it('accepts a valid UUIDv4', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })
    it('accepts a valid UUIDv1', () => {
      expect(isUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(true)
    })
    it('accepts a valid UUIDv5', () => {
      expect(isUUID('550e8400-e29b-51d4-a716-446655440000')).toBe(true)
    })
    it('accepts uppercase UUID', () => {
      expect(isUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
    })
    it('rejects UUID with wrong segment count', () => {
      expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false)
    })
    it('rejects UUID with non-hex characters', () => {
      expect(isUUID('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')).toBe(false)
    })
    it('rejects empty string', () => {
      expect(isUUID('')).toBe(false)
    })
    it('rejects plain text', () => {
      expect(isUUID('not-a-uuid')).toBe(false)
    })
  })

  describe('version-specific', () => {
    it('accepts v4 UUID with version=4', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000', 4)).toBe(true)
    })
    it('rejects v1 UUID when version=4 required', () => {
      expect(isUUID('550e8400-e29b-11d4-a716-446655440000', 4)).toBe(false)
    })
    it('accepts v1 UUID with version=1', () => {
      expect(isUUID('550e8400-e29b-11d4-a716-446655440000', 1)).toBe(true)
    })
    it('accepts v5 UUID with version=5', () => {
      expect(isUUID('550e8400-e29b-51d4-a716-446655440000', 5)).toBe(true)
    })
    it('rejects v4 when version=5 required', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000', 5)).toBe(false)
    })
  })
})

describe('isISBN', () => {
  describe('ISBN-13', () => {
    it('accepts valid ISBN-13 with hyphens', () => {
      expect(isISBN('978-0-596-52068-7')).toBe(true)
    })
    it('accepts valid ISBN-13 without hyphens', () => {
      expect(isISBN('9780596520687')).toBe(true)
    })
    it('accepts valid ISBN-13 with version=13', () => {
      expect(isISBN('9780596520687', 13)).toBe(true)
    })
    it('rejects ISBN-13 with wrong check digit', () => {
      expect(isISBN('9780596520688')).toBe(false)
    })
  })

  describe('ISBN-10', () => {
    it('accepts valid ISBN-10 with hyphens', () => {
      expect(isISBN('0-596-52068-9')).toBe(true)
    })
    it('accepts valid ISBN-10 without hyphens', () => {
      expect(isISBN('0596520689')).toBe(true)
    })
    it('accepts valid ISBN-10 with version=10', () => {
      expect(isISBN('0596520689', 10)).toBe(true)
    })
    it('accepts ISBN-10 with X check digit', () => {
      expect(isISBN('0-306-40615-2')).toBe(true)
    })
    it('rejects ISBN-10 with wrong check digit', () => {
      expect(isISBN('0596520680')).toBe(false)
    })
  })

  describe('version mismatch', () => {
    it('rejects ISBN-13 when version=10', () => {
      expect(isISBN('9780596520687', 10)).toBe(false)
    })
    it('rejects ISBN-10 when version=13', () => {
      expect(isISBN('0596520689', 13)).toBe(false)
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty string', () => {
      expect(isISBN('')).toBe(false)
    })
    it('rejects plain text', () => {
      expect(isISBN('not-an-isbn')).toBe(false)
    })
    it('rejects short number', () => {
      expect(isISBN('12345')).toBe(false)
    })
  })
})

describe('isMongoId', () => {
  it('accepts valid 24-char hex ObjectId', () => {
    expect(isMongoId('507f1f77bcf86cd799439011')).toBe(true)
  })
  it('accepts all-zeros ObjectId', () => {
    expect(isMongoId('000000000000000000000000')).toBe(true)
  })
  it('accepts uppercase hex ObjectId', () => {
    expect(isMongoId('507F1F77BCF86CD799439011')).toBe(true)
  })
  it('rejects 23-char string', () => {
    expect(isMongoId('507f1f77bcf86cd7994390')).toBe(false)
  })
  it('rejects 25-char string', () => {
    expect(isMongoId('507f1f77bcf86cd7994390111')).toBe(false)
  })
  it('rejects non-hex characters', () => {
    expect(isMongoId('507f1f77bcf86cd79943901g')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isMongoId('')).toBe(false)
  })
  it('rejects plain text', () => {
    expect(isMongoId('not-a-mongo-id')).toBe(false)
  })
})

describe('isJWT', () => {
  it('accepts a valid JWT structure', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
    expect(isJWT(jwt)).toBe(true)
  })
  it('accepts JWT with URL-safe base64url chars (- and _)', () => {
    const jwt = 'aGVhZGVy.cGF5bG9hZA.c2lnbmF0dXJl-X_Y'
    expect(isJWT(jwt)).toBe(true)
  })
  it('rejects two-part token', () => {
    expect(isJWT('header.payload')).toBe(false)
  })
  it('rejects four-part token', () => {
    expect(isJWT('a.b.c.d')).toBe(false)
  })
  it('rejects token with empty part', () => {
    expect(isJWT('header..signature')).toBe(false)
  })
  it('rejects token with invalid chars in part', () => {
    expect(isJWT('hea der.payload.signature')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isJWT('')).toBe(false)
  })
  it('rejects plain text', () => {
    expect(isJWT('not-a-jwt')).toBe(false)
  })
})

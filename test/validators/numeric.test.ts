import { describe, it, expect } from 'vitest'
import { isNumeric, isInt, isFloat, isDecimal } from '../../src/validators/numeric.js'

describe('isNumeric', () => {
  it('should validate numeric strings', () => {
    expect(isNumeric('123')).toBe(true)
    expect(isNumeric('12.5')).toBe(true)
    expect(isNumeric('0')).toBe(true)
    expect(isNumeric('-123')).toBe(true)
    expect(isNumeric('+123')).toBe(true)
  })

  it('should reject invalid numeric strings', () => {
    expect(isNumeric('')).toBe(false)
    expect(isNumeric('abc')).toBe(false)
    expect(isNumeric('12a')).toBe(false)
    expect(isNumeric('12.5.3')).toBe(false)
    expect(isNumeric('   ')).toBe(false)
    expect(isNumeric('0x10')).toBe(false)
    expect(isNumeric('0b10')).toBe(false)
    expect(isNumeric('1e3')).toBe(false)
  })

  it('should reject non-string values', () => {
    expect(isNumeric(123 as any)).toBe(false)
    expect(isNumeric(null as any)).toBe(false)
    expect(isNumeric(undefined as any)).toBe(false)
  })

  it('should validate with min option', () => {
    expect(isNumeric('5', { min: 1 })).toBe(true)
    expect(isNumeric('1', { min: 1 })).toBe(true)
    expect(isNumeric('0', { min: 1 })).toBe(false)
  })

  it('should validate with max option', () => {
    expect(isNumeric('5', { max: 10 })).toBe(true)
    expect(isNumeric('10', { max: 10 })).toBe(true)
    expect(isNumeric('11', { max: 10 })).toBe(false)
  })

  it('should validate with gt option (greater than)', () => {
    expect(isNumeric('5', { gt: 1 })).toBe(true)
    expect(isNumeric('1', { gt: 1 })).toBe(false)
    expect(isNumeric('0', { gt: 1 })).toBe(false)
  })

  it('should validate with lt option (less than)', () => {
    expect(isNumeric('5', { lt: 10 })).toBe(true)
    expect(isNumeric('10', { lt: 10 })).toBe(false)
    expect(isNumeric('11', { lt: 10 })).toBe(false)
  })

  it('should validate with combined range options', () => {
    expect(isNumeric('5', { min: 1, max: 10 })).toBe(true)
    expect(isNumeric('1', { min: 1, max: 10 })).toBe(true)
    expect(isNumeric('10', { min: 1, max: 10 })).toBe(true)
    expect(isNumeric('0', { min: 1, max: 10 })).toBe(false)
    expect(isNumeric('11', { min: 1, max: 10 })).toBe(false)
  })

  it('should reject Infinity and -Infinity', () => {
    expect(isNumeric('Infinity')).toBe(false)
    expect(isNumeric('-Infinity')).toBe(false)
  })

  it('should preserve exact integer syntax and range comparisons', () => {
    expect(isNumeric('9'.repeat(400))).toBe(true)
    expect(isNumeric('9007199254740993', { max: 9007199254740992 })).toBe(false)
    expect(isNumeric('-9007199254740993', { min: -9007199254740992 })).toBe(false)
  })
})

describe('isInt', () => {
  it('should validate integer strings', () => {
    expect(isInt('123')).toBe(true)
    expect(isInt('0')).toBe(true)
    expect(isInt('-123')).toBe(true)
    expect(isInt('+123')).toBe(true)
  })

  it('should reject non-integer strings', () => {
    expect(isInt('12.5')).toBe(false)
    expect(isInt('12.0')).toBe(false)
    expect(isInt('abc')).toBe(false)
    expect(isInt('12a')).toBe(false)
  })

  it('should reject leading zeroes by default', () => {
    expect(isInt('0123')).toBe(false)
    expect(isInt('0001')).toBe(false)
    expect(isInt('0')).toBe(true) // Single zero is okay
    expect(isInt('-01')).toBe(false)
    expect(isInt('+01')).toBe(false)
  })

  it('should allow leading zeroes when enabled', () => {
    expect(isInt('0123', { allowLeadingZeroes: true })).toBe(true)
    expect(isInt('0001', { allowLeadingZeroes: true })).toBe(true)
    expect(isInt('-01', { allowLeadingZeroes: true })).toBe(true)
    expect(isInt('+01', { allowLeadingZeroes: true })).toBe(true)
  })

  it('should validate with range options', () => {
    expect(isInt('5', { min: 1, max: 10 })).toBe(true)
    expect(isInt('0', { min: 1, max: 10 })).toBe(false)
    expect(isInt('11', { min: 1, max: 10 })).toBe(false)
  })

  it('should reject empty strings', () => {
    expect(isInt('')).toBe(false)
  })

  it('should reject non-string values', () => {
    expect(isInt(123 as any)).toBe(false)
    expect(isInt(null as any)).toBe(false)
  })

  it('should compare large integers without Number precision loss', () => {
    expect(isInt('9'.repeat(400))).toBe(true)
    expect(isInt('9007199254740993', { max: 9007199254740992 })).toBe(false)
    expect(isInt('9007199254740992', { max: 9007199254740992 })).toBe(true)
  })

  it('should match integer range properties across a deterministic sample', () => {
    for (let value = -250; value <= 250; value++) {
      expect(isInt(String(value), { min: -100, max: 100 })).toBe(
        value >= -100 && value <= 100
      )
    }
  })
})

describe('isFloat', () => {
  it('should validate float strings', () => {
    expect(isFloat('12.5')).toBe(true)
    expect(isFloat('0.5')).toBe(true)
    expect(isFloat('.5')).toBe(true)
    expect(isFloat('123')).toBe(true) // Integers are valid floats
    expect(isFloat('-12.5')).toBe(true)
    expect(isFloat('+12.5')).toBe(true)
  })

  it('should validate scientific notation', () => {
    expect(isFloat('1.5e10')).toBe(true)
    expect(isFloat('1e10')).toBe(true)
    expect(isFloat('1.5E10')).toBe(true)
    expect(isFloat('1.5e-10')).toBe(true)
  })

  it('should reject invalid float strings', () => {
    expect(isFloat('abc')).toBe(false)
    expect(isFloat('12.5.3')).toBe(false)
    expect(isFloat('12a')).toBe(false)
    expect(isFloat('')).toBe(false)
  })

  it('should support locale with comma as decimal separator', () => {
    expect(isFloat('12,5', { locale: 'de-DE' })).toBe(true)
    expect(isFloat('0,5', { locale: 'de-DE' })).toBe(true)
    expect(isFloat('12.5', { locale: 'de-DE' })).toBe(false)
  })

  it('should use the decimal separator for the selected locale', () => {
    expect(isFloat('12.5', { locale: 'ja-JP' })).toBe(true)
    expect(isFloat('12,5', { locale: 'ja-JP' })).toBe(false)
    expect(isFloat('12٫5', { locale: 'ar-EG' })).toBe(true)
    expect(isFloat('12.5', { locale: 'invalid_locale' })).toBe(false)
  })

  it('should validate with range options', () => {
    expect(isFloat('5.5', { min: 1, max: 10 })).toBe(true)
    expect(isFloat('0.5', { min: 1, max: 10 })).toBe(false)
    expect(isFloat('10.5', { min: 1, max: 10 })).toBe(false)
    expect(isFloat('0.00000000000000000001', { gt: 0 })).toBe(true)
    expect(isFloat('-0.00000000000000000001', { lt: 0 })).toBe(true)
  })

  it('should reject non-string values', () => {
    expect(isFloat(12.5 as any)).toBe(false)
    expect(isFloat(null as any)).toBe(false)
  })
})

describe('isDecimal', () => {
  it('should validate decimal strings', () => {
    expect(isDecimal('12.5')).toBe(true)
    expect(isDecimal('0.5')).toBe(true)
    expect(isDecimal('.5')).toBe(true)
    expect(isDecimal('-12.5')).toBe(true)
  })

  it('should reject integers (no decimal point)', () => {
    expect(isDecimal('123')).toBe(false)
    expect(isDecimal('0')).toBe(false)
  })

  it('should support locale with comma as decimal separator', () => {
    expect(isDecimal('12,5', { locale: 'de-DE' })).toBe(true)
    expect(isDecimal('0,5', { locale: 'de-DE' })).toBe(true)
    expect(isDecimal('123', { locale: 'de-DE' })).toBe(false)
  })

  it('should validate with range options', () => {
    expect(isDecimal('5.5', { min: 1, max: 10 })).toBe(true)
    expect(isDecimal('0.5', { min: 1, max: 10 })).toBe(false)
  })

  it('should reject invalid formats', () => {
    expect(isDecimal('abc')).toBe(false)
    expect(isDecimal('12.5.3')).toBe(false)
    expect(isDecimal('')).toBe(false)
  })

  it('should reject non-string values without throwing', () => {
    expect(isDecimal(null as any)).toBe(false)
    expect(isDecimal(undefined as any)).toBe(false)
    expect(isDecimal(12.5 as any)).toBe(false)
  })

  it('should reject malformed option values without throwing', () => {
    expect(isNumeric('1', null as any)).toBe(false)
    expect(isInt('1', null as any)).toBe(false)
    expect(isFloat('1', null as any)).toBe(false)
    expect(isDecimal('1.0', null as any)).toBe(false)
    expect(isNumeric('1', { min: Number.NaN })).toBe(false)
    expect(isFloat('1', { locale: null } as any)).toBe(false)
  })
})

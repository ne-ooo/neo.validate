import { describe, it, expect } from 'vitest'
import {
  isAlpha,
  isAlphanumeric,
  isLength,
  isAscii,
  isLowercase,
  isUppercase,
} from '../../src/validators/string.js'

describe('isAlpha', () => {
  it('should validate alphabetic strings', () => {
    expect(isAlpha('hello')).toBe(true)
    expect(isAlpha('HELLO')).toBe(true)
    expect(isAlpha('HelloWorld')).toBe(true)
  })

  it('should reject non-alphabetic strings', () => {
    expect(isAlpha('hello123')).toBe(false)
    expect(isAlpha('hello world')).toBe(false)
    expect(isAlpha('hello-world')).toBe(false)
    expect(isAlpha('hello_world')).toBe(false)
  })

  it('should reject empty strings', () => {
    expect(isAlpha('')).toBe(false)
  })

  it('should reject non-string values', () => {
    expect(isAlpha(123 as any)).toBe(false)
    expect(isAlpha(null as any)).toBe(false)
  })

  it('should support accented characters with non-English locale', () => {
    expect(isAlpha('café', 'fr-FR')).toBe(true)
    expect(isAlpha('naïve', 'fr-FR')).toBe(true)
    expect(isAlpha('café', 'en-US')).toBe(false)
  })

  it('should support Unicode letters without accepting Latin-1 symbols', () => {
    expect(isAlpha('Ελλάδα', 'el-GR')).toBe(true)
    expect(isAlpha('你好', 'zh-CN')).toBe(true)
    expect(isAlpha('cafe\u0301', 'fr-FR')).toBe(true)
    expect(isAlpha('×', 'fr-FR')).toBe(false)
    expect(isAlpha('÷', 'fr-FR')).toBe(false)
  })
})

describe('isAlphanumeric', () => {
  it('should validate alphanumeric strings', () => {
    expect(isAlphanumeric('hello123')).toBe(true)
    expect(isAlphanumeric('HELLO123')).toBe(true)
    expect(isAlphanumeric('123')).toBe(true)
    expect(isAlphanumeric('abc')).toBe(true)
  })

  it('should reject non-alphanumeric strings', () => {
    expect(isAlphanumeric('hello world')).toBe(false)
    expect(isAlphanumeric('hello-123')).toBe(false)
    expect(isAlphanumeric('hello_123')).toBe(false)
    expect(isAlphanumeric('hello@123')).toBe(false)
  })

  it('should reject empty strings', () => {
    expect(isAlphanumeric('')).toBe(false)
  })

  it('should support accented characters with non-English locale', () => {
    expect(isAlphanumeric('café123', 'fr-FR')).toBe(true)
    expect(isAlphanumeric('naïve456', 'fr-FR')).toBe(true)
    expect(isAlphanumeric('café123', 'en-US')).toBe(false)
  })

  it('should support Unicode alphanumeric strings without accepting symbols', () => {
    expect(isAlphanumeric('Ελλάδα123', 'el-GR')).toBe(true)
    expect(isAlphanumeric('你好123', 'zh-CN')).toBe(true)
    expect(isAlphanumeric('×123', 'fr-FR')).toBe(false)
  })
})

describe('isLength', () => {
  it('should validate strings within length range', () => {
    expect(isLength('hello', { min: 1, max: 10 })).toBe(true)
    expect(isLength('hello', { min: 5, max: 5 })).toBe(true)
    expect(isLength('hello', { min: 1 })).toBe(true)
    expect(isLength('hello', { max: 10 })).toBe(true)
  })

  it('should reject strings outside length range', () => {
    expect(isLength('hello', { min: 10 })).toBe(false)
    expect(isLength('hello', { max: 3 })).toBe(false)
    expect(isLength('hello', { min: 6, max: 10 })).toBe(false)
  })

  it('should handle empty strings', () => {
    expect(isLength('', { min: 0, max: 10 })).toBe(true)
    expect(isLength('', { min: 1 })).toBe(false)
  })

  it('should reject non-string values', () => {
    expect(isLength(123 as any, { min: 1, max: 10 })).toBe(false)
    expect(isLength(null as any, { min: 1, max: 10 })).toBe(false)
  })

  it('should validate exact length', () => {
    expect(isLength('hello', { min: 5, max: 5 })).toBe(true)
    expect(isLength('hello', { min: 4, max: 4 })).toBe(false)
  })

  it('should count Unicode code points instead of UTF-16 code units', () => {
    expect(isLength('😀', { min: 1, max: 1 })).toBe(true)
    expect(isLength('a😀b', { min: 3, max: 3 })).toBe(true)
    expect(isLength('😀', { min: 2 })).toBe(false)
  })
})

describe('isAscii', () => {
  it('should validate ASCII strings', () => {
    expect(isAscii('hello')).toBe(true)
    expect(isAscii('HELLO123')).toBe(true)
    expect(isAscii('hello world')).toBe(true)
    expect(isAscii('!@#$%^&*()')).toBe(true)
  })

  it('should reject non-ASCII strings', () => {
    expect(isAscii('café')).toBe(false)
    expect(isAscii('你好')).toBe(false)
    expect(isAscii('hello€')).toBe(false)
    expect(isAscii('naïve')).toBe(false)
  })

  it('should handle empty strings', () => {
    expect(isAscii('')).toBe(true)
  })

  it('should reject non-string values', () => {
    expect(isAscii(123 as any)).toBe(false)
    expect(isAscii(null as any)).toBe(false)
  })
})

describe('isLowercase', () => {
  it('should validate lowercase strings', () => {
    expect(isLowercase('hello')).toBe(true)
    expect(isLowercase('hello world')).toBe(true)
    expect(isLowercase('hello123')).toBe(true)
  })

  it('should reject mixed case strings', () => {
    expect(isLowercase('Hello')).toBe(false)
    expect(isLowercase('HELLO')).toBe(false)
    expect(isLowercase('hEllo')).toBe(false)
  })

  it('should handle empty strings', () => {
    expect(isLowercase('')).toBe(true)
  })

  it('should handle numbers and special characters', () => {
    expect(isLowercase('123')).toBe(true)
    expect(isLowercase('!@#')).toBe(true)
    expect(isLowercase('hello!@#123')).toBe(true)
  })

  it('should reject non-string values', () => {
    expect(isLowercase(123 as any)).toBe(false)
    expect(isLowercase(null as any)).toBe(false)
  })
})

describe('isUppercase', () => {
  it('should validate uppercase strings', () => {
    expect(isUppercase('HELLO')).toBe(true)
    expect(isUppercase('HELLO WORLD')).toBe(true)
    expect(isUppercase('HELLO123')).toBe(true)
  })

  it('should reject mixed case strings', () => {
    expect(isUppercase('Hello')).toBe(false)
    expect(isUppercase('hello')).toBe(false)
    expect(isUppercase('HELLo')).toBe(false)
  })

  it('should handle empty strings', () => {
    expect(isUppercase('')).toBe(true)
  })

  it('should handle numbers and special characters', () => {
    expect(isUppercase('123')).toBe(true)
    expect(isUppercase('!@#')).toBe(true)
    expect(isUppercase('HELLO!@#123')).toBe(true)
  })

  it('should reject non-string values', () => {
    expect(isUppercase(123 as any)).toBe(false)
    expect(isUppercase(null as any)).toBe(false)
  })
})

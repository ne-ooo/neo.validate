import { bench, describe } from 'vitest'
import validator from 'validator'
import {
  isEmail,
  createEmailValidator,
  isURL,
  createURLValidator,
  isNumeric,
  isInt,
  isFloat,
  isAlpha,
  isAlphanumeric,
  isLength,
  isIP,
  isUUID,
  isCreditCard,
  isJSON,
  isBase64,
  escape,
  normalizeEmail,
} from '../../src/index.js'

describe('neo.validate vs validator.js - Performance Comparison', () => {
  describe('Email Validation', () => {
    const validEmail = 'test.user+tag@example.com'
    const invalidEmail = 'invalid@email'
    const emailPolicy = { hostWhitelist: ['example.com'] }
    const validateEmail = createEmailValidator(emailPolicy)

    bench('neo.validate - isEmail (valid)', () => {
      isEmail(validEmail)
    })

    bench('validator.js - isEmail (valid)', () => {
      validator.isEmail(validEmail)
    })

    bench('neo.validate - isEmail (invalid)', () => {
      isEmail(invalidEmail)
    })

    bench('validator.js - isEmail (invalid)', () => {
      validator.isEmail(invalidEmail)
    })

    bench('neo.validate - isEmail (repeated policy)', () => {
      isEmail(validEmail, emailPolicy)
    })

    bench('neo.validate - compiled email policy', () => {
      validateEmail(validEmail)
    })
  })

  describe('URL Validation', () => {
    const validURL = 'https://example.com/path?query=value#hash'
    const invalidURL = 'not a url'
    const urlPolicy = { protocols: ['https'], allowedHosts: ['example.com'] }
    const validateURL = createURLValidator(urlPolicy)

    bench('neo.validate - isURL (valid)', () => {
      isURL(validURL)
    })

    bench('validator.js - isURL (valid)', () => {
      validator.isURL(validURL)
    })

    bench('neo.validate - isURL (invalid)', () => {
      isURL(invalidURL)
    })

    bench('validator.js - isURL (invalid)', () => {
      validator.isURL(invalidURL)
    })

    bench('neo.validate - isURL (repeated policy)', () => {
      isURL(validURL, urlPolicy)
    })

    bench('neo.validate - compiled URL policy', () => {
      validateURL(validURL)
    })
  })

  describe('Numeric Validation', () => {
    const validInt = '12345'
    const validFloat = '123.45'

    bench('neo.validate - isNumeric', () => {
      isNumeric(validInt)
    })

    bench('validator.js - isNumeric', () => {
      validator.isNumeric(validInt)
    })

    bench('neo.validate - isInt', () => {
      isInt(validInt)
    })

    bench('validator.js - isInt', () => {
      validator.isInt(validInt)
    })

    bench('neo.validate - isFloat', () => {
      isFloat(validFloat)
    })

    bench('validator.js - isFloat', () => {
      validator.isFloat(validFloat)
    })
  })

  describe('String Validation', () => {
    const alphaStr = 'HelloWorld'
    const alphanumericStr = 'Hello123'

    bench('neo.validate - isAlpha', () => {
      isAlpha(alphaStr)
    })

    bench('validator.js - isAlpha', () => {
      validator.isAlpha(alphaStr)
    })

    bench('neo.validate - isAlphanumeric', () => {
      isAlphanumeric(alphanumericStr)
    })

    bench('validator.js - isAlphanumeric', () => {
      validator.isAlphanumeric(alphanumericStr)
    })
  })

  describe('Network Validation', () => {
    const ipv4 = '192.168.1.1'
    const ipv6 = '2001:db8::1'

    bench('neo.validate - isIP (IPv4)', () => {
      isIP(ipv4, 4)
    })

    bench('validator.js - isIP (IPv4)', () => {
      validator.isIP(ipv4, 4)
    })

    bench('neo.validate - isIP (IPv6)', () => {
      isIP(ipv6, 6)
    })

    bench('validator.js - isIP (IPv6)', () => {
      validator.isIP(ipv6, 6)
    })
  })

  describe('UUID Validation', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'

    bench('neo.validate - isUUID', () => {
      isUUID(uuid)
    })

    bench('validator.js - isUUID', () => {
      validator.isUUID(uuid)
    })

    bench('neo.validate - isUUID (v4)', () => {
      isUUID(uuid, 4)
    })

    bench('validator.js - isUUID (v4)', () => {
      validator.isUUID(uuid, 4)
    })
  })

  describe('Credit Card Validation', () => {
    const validCard = '4532015112830366' // Visa

    bench('neo.validate - isCreditCard', () => {
      isCreditCard(validCard)
    })

    bench('validator.js - isCreditCard', () => {
      validator.isCreditCard(validCard)
    })
  })

  describe('Format Validation', () => {
    const jsonStr = '{"key":"value","number":123}'
    const base64Str = 'SGVsbG8gV29ybGQ='

    bench('neo.validate - isJSON', () => {
      isJSON(jsonStr)
    })

    bench('validator.js - isJSON', () => {
      validator.isJSON(jsonStr)
    })

    bench('neo.validate - isBase64', () => {
      isBase64(base64Str)
    })

    bench('validator.js - isBase64', () => {
      validator.isBase64(base64Str)
    })
  })

  describe('Sanitization', () => {
    const htmlStr = '<script>alert("XSS")</script>'
    const email = 'Test.User+tag@Gmail.com'

    bench('neo.validate - escape', () => {
      escape(htmlStr)
    })

    bench('validator.js - escape', () => {
      validator.escape(htmlStr)
    })

    bench('neo.validate - normalizeEmail', () => {
      normalizeEmail(email)
    })

    bench('validator.js - normalizeEmail', () => {
      validator.normalizeEmail(email)
    })
  })

  describe('High-Volume Operations', () => {
    const emails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`)
    const urls = Array.from({ length: 100 }, (_, i) => `https://example${i}.com`)
    const numbers = Array.from({ length: 100 }, (_, i) => String(i))

    bench('neo.validate - 100 email validations', () => {
      for (const email of emails) {
        isEmail(email)
      }
    })

    bench('validator.js - 100 email validations', () => {
      for (const email of emails) {
        validator.isEmail(email)
      }
    })

    bench('neo.validate - 100 URL validations', () => {
      for (const url of urls) {
        isURL(url)
      }
    })

    bench('validator.js - 100 URL validations', () => {
      for (const url of urls) {
        validator.isURL(url)
      }
    })

    bench('neo.validate - 100 number validations', () => {
      for (const num of numbers) {
        isNumeric(num)
      }
    })

    bench('validator.js - 100 number validations', () => {
      for (const num of numbers) {
        validator.isNumeric(num)
      }
    })
  })

  describe('Oversized Input Rejection', () => {
    const oversizedText = 'a'.repeat(100_000)
    const oversizedEmail = `${oversizedText}@example.com`
    const oversizedUrl = `https://example.com/${oversizedText}`

    bench('neo.validate - bounded isLength', () => {
      isLength(oversizedText, { max: 10 })
    })

    bench('neo.validate - oversized isEmail', () => {
      isEmail(oversizedEmail)
    })

    bench('neo.validate - oversized isURL', () => {
      isURL(oversizedUrl)
    })
  })
})

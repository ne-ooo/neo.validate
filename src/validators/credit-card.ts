import type { CreditCardOptions, CreditCardProvider } from '../types.js'

const cardPatterns: Record<CreditCardProvider, RegExp> = {
  amex: /^3[47][0-9]{13}$/,
  dinersclub: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12,15}$/,
  jcb: /^(?:2131|1800|35[0-9]{3})[0-9]{11}$/,
  mastercard: /^(?:5[1-5][0-9]{14}|(?:222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12})$/,
  unionpay: /^(?:6[27][0-9]{14}|81[0-9]{14,17})$/,
  visa: /^4[0-9]{12}(?:[0-9]{3,6})?$/,
}

const supportedCardPatterns = Object.values(cardPatterns)
const CARD_SEPARATOR_PATTERN = /[- ]+/g
const CARD_DIGITS_PATTERN = /^[0-9]{13,19}$/

/**
 * Check if string is a valid credit card number (Luhn algorithm)
 *
 * Validates using the Luhn algorithm (mod 10 checksum)
 * Supports Visa, MasterCard, American Express, Discover, and more
 *
 * @param str - String to validate
 * @param options - Optional provider restriction
 * @returns true if valid credit card, false otherwise
 *
 * @example
 * ```ts
 * isCreditCard('4532015112830366') // true (Visa)
 * isCreditCard('5425233430109903') // true (MasterCard)
 * isCreditCard('374245455400126') // true (Amex)
 * isCreditCard('6011111111111117') // true (Discover)
 * isCreditCard('invalid') // false
 * ```
 */
export function isCreditCard(str: string, options: CreditCardOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // Remove conventional visual separators. Other whitespace is invalid.
  const sanitized = str.replace(CARD_SEPARATOR_PATTERN, '')

  // Credit cards are typically 13-19 digits
  if (!CARD_DIGITS_PATTERN.test(sanitized)) {
    return false
  }

  const { provider } = options
  const matchesProvider = provider
    ? cardPatterns[provider]?.test(sanitized) === true
    : supportedCardPatterns.some((pattern) => pattern.test(sanitized))
  if (!matchesProvider) return false

  // Validate using Luhn algorithm
  return luhnCheck(sanitized)
}

/**
 * Luhn algorithm (mod 10 checksum)
 *
 * The Luhn algorithm validates credit card numbers:
 * 1. Starting from the rightmost digit (check digit), double every second digit
 * 2. If doubling results in a two-digit number, add the digits together
 * 3. Sum all the digits
 * 4. If the total modulo 10 is 0, the number is valid
 */
function luhnCheck(str: string): boolean {
  let sum = 0
  let isEven = false

  // Traverse from right to left
  for (let i = str.length - 1; i >= 0; i--) {
    let digit = parseInt(str[i]!, 10)

    if (isEven) {
      digit *= 2
      // If doubling results in two digits, add them together
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

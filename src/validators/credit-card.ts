/**
 * Check if string is a valid credit card number (Luhn algorithm)
 *
 * Validates using the Luhn algorithm (mod 10 checksum)
 * Supports Visa, MasterCard, American Express, Discover, and more
 *
 * @param str - String to validate
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
export function isCreditCard(str: string): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false
  }

  // Remove spaces and hyphens
  const sanitized = str.replace(/[\s-]/g, '')

  // Credit cards are typically 13-19 digits
  if (!/^[0-9]{13,19}$/.test(sanitized)) {
    return false
  }

  // BUG-8d fix: reject trivially degenerate numbers (all identical digits) that pass Luhn
  // because the algorithm produces sum % 10 === 0 for all-zeros and similar patterns.
  if (/^(.)\1+$/.test(sanitized)) {
    return false
  }

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

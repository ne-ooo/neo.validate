const NON_ASCII_PATTERN = /[^\x00-\x7F]/
const utf8Encoder = new TextEncoder()

export function exceedsUtf8Length(value: string, maximumLength: number): boolean {
  if (value.length > maximumLength) return true
  return NON_ASCII_PATTERN.test(value) && utf8Encoder.encode(value).length > maximumLength
}

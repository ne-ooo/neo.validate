const INVALID_DOMAIN_CHARACTER_PATTERN = /[^\p{L}\p{N}\p{M}.-]/u
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
const TLD_PATTERN = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i
const NEEDS_HOST_NORMALIZATION_PATTERN = /[^\x00-\x7F]|xn--/i
const NUMERIC_FINAL_LABEL_PATTERN = /(^|\.)(0x[0-9a-f]*|[0-9]+)$/i

export function normalizeEmailDomain(value: string, requireTld: boolean): string | null {
  if (!value) return null

  const withoutTrailingDot = value.endsWith('.') ? value.slice(0, -1) : value
  if (
    !withoutTrailingDot ||
    INVALID_DOMAIN_CHARACTER_PATTERN.test(withoutTrailingDot)
  ) {
    return null
  }

  let asciiDomain: string
  if (
    NEEDS_HOST_NORMALIZATION_PATTERN.test(withoutTrailingDot) ||
    NUMERIC_FINAL_LABEL_PATTERN.test(withoutTrailingDot)
  ) {
    try {
      asciiDomain = new URL(`http://${withoutTrailingDot}`).hostname.toLowerCase()
    } catch {
      return null
    }
  } else {
    asciiDomain = withoutTrailingDot.toLowerCase()
  }

  if (!asciiDomain || asciiDomain.length > 253) return null
  const labels = asciiDomain.split('.')
  if (requireTld && labels.length < 2) return null
  if (
    labels.some(
      (label) =>
        label.length === 0 ||
        label.length > 63 ||
        !DOMAIN_LABEL_PATTERN.test(label)
    )
  ) {
    return null
  }

  if (requireTld && !TLD_PATTERN.test(labels.at(-1) ?? '')) return null
  return asciiDomain
}

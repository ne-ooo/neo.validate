/**
 * Escape HTML entities to prevent XSS attacks
 *
 * @param str - String to escape
 * @returns Escaped string
 *
 * @example
 * ```ts
 * escape('<script>alert("XSS")</script>')
 * // '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * escape('A & B') // 'A &amp; B'
 * ```
 */
export function escape(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Unescape HTML entities
 *
 * @param str - String to unescape
 * @returns Unescaped string
 *
 * @example
 * ```ts
 * unescape('&lt;script&gt;')
 * // '<script>'
 *
 * unescape('A &amp; B') // 'A & B'
 * ```
 */
export function unescape(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }

  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#39;': "'",
  }

  return str.replace(
    /&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;|&#39;/g,
    (entity) => htmlEntities[entity] || entity
  )
}

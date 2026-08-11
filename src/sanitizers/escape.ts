const HTML_ESCAPE_ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

const HTML_UNESCAPE_ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#39;': "'",
}

const HTML_ESCAPE_PATTERN = /[&<>"'/]/g
const HTML_UNESCAPE_PATTERN = /&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;|&#39;/g

/**
 * Escape characters for HTML text and quoted HTML attribute values
 *
 * This function does not make JavaScript, CSS, or URL values safe.
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

  return str.replace(HTML_ESCAPE_PATTERN, (char) => HTML_ESCAPE_ENTITIES[char] ?? char)
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

  return str.replace(
    HTML_UNESCAPE_PATTERN,
    (entity) => HTML_UNESCAPE_ENTITIES[entity] ?? entity
  )
}

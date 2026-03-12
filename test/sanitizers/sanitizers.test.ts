import { describe, it, expect } from 'vitest'
import { escape, unescape, trim, ltrim, rtrim, normalizeEmail, stripLow } from '../../src/index.js'

describe('escape', () => {
  it('escapes < to &lt;', () => {
    expect(escape('<')).toBe('&lt;')
  })
  it('escapes > to &gt;', () => {
    expect(escape('>')).toBe('&gt;')
  })
  it('escapes & to &amp;', () => {
    expect(escape('&')).toBe('&amp;')
  })
  it('escapes " to &quot;', () => {
    expect(escape('"')).toBe('&quot;')
  })
  it("escapes ' to &#x27;", () => {
    expect(escape("'")).toBe('&#x27;')
  })
  it('escapes / to &#x2F;', () => {
    expect(escape('/')).toBe('&#x2F;')
  })
  it('escapes a full XSS payload', () => {
    expect(escape('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
    )
  })
  it('leaves safe characters untouched', () => {
    expect(escape('Hello World 123')).toBe('Hello World 123')
  })
  it('returns empty string for non-string input', () => {
    // @ts-expect-error intentional wrong type
    expect(escape(null)).toBe('')
  })
})

describe('unescape', () => {
  it('unescapes &lt; to <', () => {
    expect(unescape('&lt;')).toBe('<')
  })
  it('unescapes &gt; to >', () => {
    expect(unescape('&gt;')).toBe('>')
  })
  it('unescapes &amp; to &', () => {
    expect(unescape('&amp;')).toBe('&')
  })
  it('unescapes &quot; to "', () => {
    expect(unescape('&quot;')).toBe('"')
  })
  it("unescapes &#x27; to '", () => {
    expect(unescape('&#x27;')).toBe("'")
  })
  it('unescapes &#x2F; to /', () => {
    expect(unescape('&#x2F;')).toBe('/')
  })
  it('unescapes &#39; to single quote', () => {
    expect(unescape('&#39;')).toBe("'")
  })
  it('round-trips: unescape(escape(s)) === s', () => {
    const original = '<script>alert("XSS & more")</script>'
    expect(unescape(escape(original))).toBe(original)
  })
  it('leaves safe characters untouched', () => {
    expect(unescape('Hello World')).toBe('Hello World')
  })
  it('returns empty string for non-string input', () => {
    // @ts-expect-error intentional wrong type
    expect(unescape(null)).toBe('')
  })
})

describe('trim', () => {
  it('trims leading and trailing spaces', () => {
    expect(trim('  hello  ')).toBe('hello')
  })
  it('trims tabs and newlines', () => {
    expect(trim('\t hello \n')).toBe('hello')
  })
  it('trims custom character', () => {
    expect(trim('__hello__', '_')).toBe('hello')
  })
  it('trims multiple custom characters', () => {
    expect(trim('##hello##', '#')).toBe('hello')
  })
  it('returns empty string when all chars are trimmed', () => {
    expect(trim('   ')).toBe('')
  })
  it('leaves middle content untouched', () => {
    expect(trim('  hel lo  ')).toBe('hel lo')
  })
  it('returns empty string for non-string input', () => {
    // @ts-expect-error intentional wrong type
    expect(trim(null)).toBe('')
  })
})

describe('ltrim', () => {
  it('trims only leading spaces', () => {
    expect(ltrim('  hello  ')).toBe('hello  ')
  })
  it('trims only leading custom character', () => {
    expect(ltrim('__hello__', '_')).toBe('hello__')
  })
  it('does not touch trailing content', () => {
    expect(ltrim('   hello world   ')).toBe('hello world   ')
  })
  it('returns empty string for non-string input', () => {
    // @ts-expect-error intentional wrong type
    expect(ltrim(null)).toBe('')
  })
})

describe('rtrim', () => {
  it('trims only trailing spaces', () => {
    expect(rtrim('  hello  ')).toBe('  hello')
  })
  it('trims only trailing custom character', () => {
    expect(rtrim('__hello__', '_')).toBe('__hello')
  })
  it('does not touch leading content', () => {
    expect(rtrim('   hello world   ')).toBe('   hello world')
  })
  it('returns empty string for non-string input', () => {
    // @ts-expect-error intentional wrong type
    expect(rtrim(null)).toBe('')
  })
})

describe('normalizeEmail', () => {
  describe('Gmail normalization', () => {
    it('lowercases the whole Gmail address', () => {
      expect(normalizeEmail('Test.User@Gmail.com')).toBe('testuser@gmail.com')
    })
    it('removes dots from Gmail local part', () => {
      expect(normalizeEmail('test.user@gmail.com')).toBe('testuser@gmail.com')
    })
    it('removes subaddress (+tag) from Gmail', () => {
      expect(normalizeEmail('user+tag@gmail.com')).toBe('user@gmail.com')
    })
    it('converts googlemail.com to gmail.com by default', () => {
      expect(normalizeEmail('user@googlemail.com')).toBe('user@gmail.com')
    })
    it('preserves subaddress when gmailRemoveSubaddress is false', () => {
      expect(normalizeEmail('user+tag@gmail.com', { gmailRemoveSubaddress: false })).toBe(
        'user+tag@gmail.com'
      )
    })
    it('preserves dots when gmailRemoveDots is false', () => {
      expect(normalizeEmail('test.user@gmail.com', { gmailRemoveDots: false })).toBe(
        'test.user@gmail.com'
      )
    })
  })

  describe('Outlook normalization', () => {
    it('removes subaddress (+tag) from Outlook', () => {
      expect(normalizeEmail('user+tag@outlook.com')).toBe('user@outlook.com')
    })
    it('removes subaddress from hotmail.com', () => {
      expect(normalizeEmail('user+tag@hotmail.com')).toBe('user@hotmail.com')
    })
    it('removes subaddress from live.com', () => {
      expect(normalizeEmail('user+tag@live.com')).toBe('user@live.com')
    })
  })

  describe('Yahoo normalization', () => {
    it('removes Yahoo hyphen subaddress', () => {
      expect(normalizeEmail('user-tag@yahoo.com')).toBe('user@yahoo.com')
    })
  })

  describe('general behavior', () => {
    it('lowercases non-Gmail addresses', () => {
      expect(normalizeEmail('User@Example.COM')).toBe('user@example.com')
    })
    it('returns input unchanged when no @ sign', () => {
      expect(normalizeEmail('notanemail')).toBe('notanemail')
    })
  })
})

describe('stripLow', () => {
  it('removes null byte (\\x00)', () => {
    expect(stripLow('hello\x00world')).toBe('helloworld')
  })
  it('removes all control characters (ASCII 0-31)', () => {
    const withControls = 'a\x01\x02\x03b'
    expect(stripLow(withControls)).toBe('ab')
  })
  it('removes DEL character (\\x7F)', () => {
    expect(stripLow('hello\x7Fworld')).toBe('helloworld')
  })
  it('removes newlines by default', () => {
    expect(stripLow('hello\nworld')).toBe('helloworld')
  })
  it('keeps newlines when keepNewLines is true', () => {
    expect(stripLow('hello\nworld', true)).toBe('hello\nworld')
  })
  it('keeps carriage return when keepNewLines is true', () => {
    expect(stripLow('hello\r\nworld', true)).toBe('hello\r\nworld')
  })
  it('keeps tab when keepNewLines is true', () => {
    expect(stripLow('hello\tworld', true)).toBe('hello\tworld')
  })
  it('still removes other control chars when keepNewLines is true', () => {
    expect(stripLow('a\x01b\nc', true)).toBe('ab\nc')
  })
  it('leaves printable characters untouched', () => {
    expect(stripLow('Hello, World! 123')).toBe('Hello, World! 123')
  })
  it('returns empty string for non-string input', () => {
    // @ts-expect-error intentional wrong type
    expect(stripLow(null)).toBe('')
  })
})

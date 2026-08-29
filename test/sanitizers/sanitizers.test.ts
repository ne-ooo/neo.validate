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
  it('treats hyphen as a literal custom character', () => {
    expect(trim('bbbHello', 'a-z')).toBe('bbbHello')
  })
  it('treats astral custom characters as complete Unicode code points', () => {
    expect(trim('😀hello😀', '😀')).toBe('hello')
    expect(trim('😁hello😁', '😀')).toBe('😁hello😁')
  })
  it('handles long non-matching custom-character runs in linear time', () => {
    const value = `X${'a'.repeat(20_000)}Y`
    expect(trim(value, 'a')).toBe(value)
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
  it('returns empty string for malformed custom characters', () => {
    expect(trim('hello', null as any)).toBe('')
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
  it('does not interpret a custom hyphen as a character range', () => {
    expect(ltrim('bbbHello', 'a-z')).toBe('bbbHello')
  })
  it('trims astral characters without splitting a neighboring code point', () => {
    expect(ltrim('😀hello😀', '😀')).toBe('hello😀')
    expect(ltrim('😁hello', '😀')).toBe('😁hello')
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
  it('does not interpret a custom hyphen as a character range', () => {
    expect(rtrim('Helloaaa', 'a-z')).toBe('Hello')
  })
  it('trims complete astral characters from the right', () => {
    expect(rtrim('😀hello😀', '😀')).toBe('😀hello')
    expect(rtrim('hello😁', '😀')).toBe('hello😁')
  })
  it('handles long non-matching custom-character runs in linear time', () => {
    const value = `X${'a'.repeat(20_000)}Y`
    expect(rtrim(value, 'a')).toBe(value)
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
    it('keeps Googlemail transformations independent from domain conversion', () => {
      expect(
        normalizeEmail('Test.User+tag@googlemail.com', {
          gmailConvertGooglemail: false,
        })
      ).toBe('testuser@googlemail.com')
    })
    it('detects provider domains case-insensitively without forcing output lowercase', () => {
      expect(
        normalizeEmail('Test.User+tag@GMAIL.COM', { allLowercase: false })
      ).toBe('TestUser@GMAIL.COM')
      expect(
        normalizeEmail('Test.User@GOOGLEMAIL.COM', { allLowercase: false })
      ).toBe('TestUser@gmail.com')
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
    it('detects Outlook domains case-insensitively when lowercase output is disabled', () => {
      expect(normalizeEmail('User+tag@OUTLOOK.COM', { allLowercase: false })).toBe(
        'User@OUTLOOK.COM'
      )
    })
  })

  describe('Yahoo normalization', () => {
    it('removes Yahoo hyphen subaddress', () => {
      expect(normalizeEmail('user-tag@yahoo.com')).toBe('user@yahoo.com')
    })
    it('detects Yahoo domains case-insensitively when lowercase output is disabled', () => {
      expect(normalizeEmail('User-tag@YAHOO.COM', { allLowercase: false })).toBe(
        'User@YAHOO.COM'
      )
    })
  })

  describe('general behavior', () => {
    it('lowercases non-Gmail addresses', () => {
      expect(normalizeEmail('User@Example.COM')).toBe('user@example.com')
    })
    it('returns input unchanged when no @ sign', () => {
      expect(normalizeEmail('notanemail')).toBe('notanemail')
    })
    it('returns malformed addresses unchanged instead of dropping data', () => {
      expect(normalizeEmail('a@b@c')).toBe('a@b@c')
      expect(normalizeEmail('@example.com')).toBe('@example.com')
      expect(normalizeEmail('user@')).toBe('user@')
      expect(normalizeEmail('a..b@gmail.com')).toBe('a..b@gmail.com')
      expect(normalizeEmail('+tag@gmail.com')).toBe('+tag@gmail.com')
      expect(normalizeEmail('+tag@outlook.com')).toBe('+tag@outlook.com')
      expect(normalizeEmail('-tag@yahoo.com')).toBe('-tag@yahoo.com')
      expect(normalizeEmail('user@-example.com')).toBe('user@-example.com')
      const oversizedLocal = `${'A'.repeat(65)}@GMAIL.COM`
      expect(normalizeEmail(oversizedLocal)).toBe(oversizedLocal)
    })
    it('returns a string for malformed runtime inputs', () => {
      expect(normalizeEmail(null as any)).toBe('')
      expect(normalizeEmail('user@example.com', null as any)).toBe('user@example.com')
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
  it('returns empty string for a malformed keepNewLines option', () => {
    expect(stripLow('hello', 'yes' as any)).toBe('')
  })
})

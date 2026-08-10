import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = resolve(packageRoot, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const require = createRequire(import.meta.url)

const expectedFunctions = [
  'escape',
  'isAlpha',
  'isAlphanumeric',
  'isAscii',
  'isBase64',
  'isCreditCard',
  'isDecimal',
  'isEmail',
  'isFloat',
  'isHexColor',
  'isHexadecimal',
  'isIP',
  'isISBN',
  'isInt',
  'isISO8601',
  'isJSON',
  'isJWT',
  'isLength',
  'isLowercase',
  'isMACAddress',
  'isMongoId',
  'isNumeric',
  'isPort',
  'isRFC3339',
  'isUppercase',
  'isURL',
  'isUUID',
  'ltrim',
  'normalizeEmail',
  'rtrim',
  'stripLow',
  'trim',
  'unescape',
]

function resolvePackagePath(path) {
  return resolve(packageRoot, path.replace(/^\.\//, ''))
}

function assertPublishedFilesExist() {
  const requiredFiles = ['README.md', 'BENCHMARKS.md', 'CHANGELOG.md', 'LICENSE']
  for (const file of requiredFiles) {
    assert.ok(manifest.files.includes(file), `${file} is missing from package.json files`)
    assert.ok(existsSync(resolve(packageRoot, file)), `${file} does not exist`)
  }

  for (const [subpath, target] of Object.entries(manifest.exports)) {
    if (typeof target === 'string') {
      assert.ok(existsSync(resolvePackagePath(target)), `${subpath} export does not exist`)
      continue
    }

    for (const [format, path] of Object.entries(target)) {
      assert.ok(existsSync(resolvePackagePath(path)), `${subpath} ${format} export does not exist`)
    }
  }
}

function assertSkillVersionsMatch() {
  const skillsDirectory = resolve(packageRoot, '.lpm/skills')
  const skillFiles = readdirSync(skillsDirectory).filter((file) => file.endsWith('.md'))

  assert.ok(skillFiles.length > 0, 'The package must include at least one skill file')
  for (const file of skillFiles) {
    const contents = readFileSync(resolve(skillsDirectory, file), 'utf8')
    const version = contents.match(/^version:\s*"([^"]+)"/m)?.[1]
    assert.equal(version, manifest.version, `${file} version does not match package.json`)
  }
}

function assertRuntime(module, format) {
  for (const name of expectedFunctions) {
    assert.equal(typeof module[name], 'function', `${format} export ${name} is missing`)
  }

  assert.equal(module.isEmail('user@example.com'), true)
  assert.equal(module.isEmail('user@example..com'), false)
  assert.equal(
    module.isURL('evil.com', { requireProtocol: false, allowedHosts: ['good.com'] }),
    false
  )
  assert.equal(module.isBase64('A='), false)
  assert.equal(module.isLength('😀', { min: 1, max: 1 }), true)
  assert.equal(module.normalizeEmail('a@b@c'), 'a@b@c')
}

function assertBundleBudget() {
  const esmEntry = readFileSync(resolvePackagePath(manifest.module))
  const compressedBytes = gzipSync(esmEntry, { level: 9 }).byteLength
  const maximumBytes = 8 * 1024

  assert.ok(
    compressedBytes <= maximumBytes,
    `The gzipped ESM entry is ${compressedBytes} bytes. The limit is ${maximumBytes} bytes.`
  )
  return compressedBytes
}

assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0, 'Runtime dependencies are not allowed')
assertPublishedFilesExist()
assertSkillVersionsMatch()

const esmModule = await import(manifest.name)
const cjsModule = require(manifest.name)
assertRuntime(esmModule, 'ESM')
assertRuntime(cjsModule, 'CommonJS')

const compressedBytes = assertBundleBudget()
console.log(`Package verification passed. Gzipped ESM entry: ${compressedBytes} bytes.`)

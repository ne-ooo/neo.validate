import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = resolve(packageRoot, 'package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const require = createRequire(import.meta.url)
const expectedPublishedPaths = [
  '.lpm/skills',
  'BENCHMARKS.md',
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'SECURITY.md',
  'dist',
]

const expectedFunctions = [
  'createEmailValidator',
  'createURLValidator',
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
  assert.deepEqual(
    [...manifest.files].sort(),
    [...expectedPublishedPaths].sort(),
    'package.json files must use the reviewed publish allowlist'
  )
  const requiredFiles = ['README.md', 'SECURITY.md', 'BENCHMARKS.md', 'CHANGELOG.md', 'LICENSE']
  for (const file of requiredFiles) {
    assert.ok(manifest.files.includes(file), `${file} is missing from package.json files`)
    assert.ok(existsSync(resolve(packageRoot, file)), `${file} does not exist`)
  }

  for (const [subpath, target] of Object.entries(manifest.exports)) {
    assertExportTargetsExist(target, subpath)
  }
}

function assertExportTargetsExist(target, label) {
  if (typeof target === 'string') {
    assert.ok(existsSync(resolvePackagePath(target)), `${label} export does not exist`)
    return
  }

  assert.ok(target && typeof target === 'object', `${label} export target is invalid`)
  for (const [condition, nestedTarget] of Object.entries(target)) {
    assertExportTargetsExist(nestedTarget, `${label} ${condition}`)
  }
}

function assertTypeScriptConsumersCompile() {
  const fixtureConfig = resolve(packageRoot, 'scripts/fixtures/package-consumers/tsconfig.json')
  const tscPath = require.resolve('typescript/bin/tsc')

  try {
    execFileSync(process.execPath, [tscPath, '--project', fixtureConfig], {
      cwd: packageRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n')
    assert.fail(`TypeScript package-consumer fixtures failed:\n${output}`)
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

  assert.equal(module.isEmail.length, 1)
  assert.equal(module.isURL.length, 1)
  assert.equal(module.createEmailValidator.length, 0)
  assert.equal(module.createURLValidator.length, 0)

  assert.equal(module.isEmail('user@example.com'), true)
  assert.equal(module.isEmail('user@example..com'), false)
  assert.equal(
    module.isURL('evil.com', { requireProtocol: false, allowedHosts: ['good.com'] }),
    false
  )
  assert.equal(
    module.isURL('http://example.com./', { disallowedHosts: ['example.com'] }),
    false
  )
  assert.equal(module.isBase64('A='), false)
  assert.equal(module.isLength('😀', { min: 1, max: 1 }), true)
  assert.equal(module.isInt('9007199254740993', { max: 9007199254740992 }), false)
  assert.equal(module.isJWT('a.a.a'), false)
  assert.equal(module.normalizeEmail('a@b@c'), 'a@b@c')
  assert.equal(
    module.createEmailValidator({ hostWhitelist: ['example.com'] })('user@example.com'),
    true
  )
  assert.equal(
    module.createURLValidator({ protocols: ['https'] })('http://example.com'),
    false
  )
  assert.equal(module.isUUID('019535d9-3df7-7a28-8a7f-9f4bc7c8e101', 7), true)
  assert.equal(module.isUUID('550e8400-e29b-41d4-a716-446655440000', 4), true)
  assert.equal(module.isUUID('550e8400-...'), false)
}

function assertDocumentationExamples() {
  const readme = readFileSync(resolve(packageRoot, 'README.md'), 'utf8')
  assert.equal(
    readme.includes('isUUID("550e8400-...")'),
    false,
    'README must not present a truncated UUID as executable input'
  )
}

function assertPublishWorkflowHardening() {
  const workflow = readFileSync(resolve(packageRoot, '.github/workflows/publish.yml'), 'utf8')
  assert.ok(
    workflow.includes('LPM_INSTALLER_SHA256'),
    'publish workflow must verify the pinned LPM installer'
  )
  assert.ok(
    workflow.includes(
      'LPM_LINUX_X64_SHA256: "a9734d76291cf1b160db57e9229f53697c8d5c7f60b815b059eaec62ad9f7394"'
    ),
    'publish workflow must verify the repository-pinned LPM executable digest'
  )
  assert.ok(
    workflow.includes('verified-lpm-${{ github.sha }}'),
    'publish workflow must transfer the verified LPM executable between jobs'
  )
  assert.equal(
    workflow.includes('npm install --global'),
    false,
    'OIDC publish workflow must not run package lifecycle install code'
  )
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
assertTypeScriptConsumersCompile()
assertDocumentationExamples()
assertPublishWorkflowHardening()

const esmModule = await import(manifest.name)
const cjsModule = require(manifest.name)
assertRuntime(esmModule, 'ESM')
assertRuntime(cjsModule, 'CommonJS')

const compressedBytes = assertBundleBudget()
console.log(`Package verification passed. Gzipped ESM entry: ${compressedBytes} bytes.`)

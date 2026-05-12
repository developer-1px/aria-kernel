#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const apply = process.argv.includes('--apply')
const verbose = process.argv.includes('--verbose')

const ariaSrc = 'packages/aria-kernel/src'
const resourceSrc = 'packages/resource/src'

const directoryMoves = [
  [`${ariaSrc}/focus`, `${ariaSrc}/read/focus`],
  [`${ariaSrc}/roving`, `${ariaSrc}/read/roving`],
  [`${ariaSrc}/axes`, `${ariaSrc}/input/keyboard/axes`],
  [`${ariaSrc}/key`, `${ariaSrc}/input/keyboard/key`],
  [`${ariaSrc}/gesture`, `${ariaSrc}/input/gesture`],
  [`${ariaSrc}/state`, `${ariaSrc}/view-state`],
  [`${resourceSrc}/zod-crud`, `${resourceSrc}/adapters/zod-crud`],
]

const fileMoves = [
  [`${ariaSrc}/types.ts`, `${ariaSrc}/intent/events.ts`],
  [`${ariaSrc}/schema.ts`, `${ariaSrc}/intent/schema.ts`],
  [`${ariaSrc}/patterns/usePatternClipboard.ts`, `${ariaSrc}/input/clipboard/usePatternClipboard.ts`],
  [`${ariaSrc}/patterns/usePatternClipboard.test.tsx`, `${ariaSrc}/input/clipboard/usePatternClipboard.test.tsx`],
  [`${resourceSrc}/data.ts`, `${resourceSrc}/store/data.ts`],
  [`${resourceSrc}/routeUiEventToCrud.ts`, `${resourceSrc}/mutation/routeUiEventToCrud.ts`],
]

const textExtensions = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md'])
const sourceExtensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']
const importRegex = /(\bfrom\s*['"])(\.{1,2}\/[^'"]+)(['"])|(\bimport\s*\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g

const log = (...args) => console.log(...args)
const rel = (abs) => path.relative(root, abs)
const abs = (p) => path.resolve(root, p)
const slash = (p) => p.split(path.sep).join('/')

function exists(p) {
  return fs.existsSync(abs(p))
}

function walk(dir, out = []) {
  const full = abs(dir)
  if (!fs.existsSync(full)) return out
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue
      walk(p, out)
    } else {
      out.push(p)
    }
  }
  return out
}

function ensureDir(fileOrDir, isDir = false) {
  const target = isDir ? abs(fileOrDir) : path.dirname(abs(fileOrDir))
  if (!apply) return
  fs.mkdirSync(target, { recursive: true })
}

function read(p) {
  return fs.readFileSync(abs(p), 'utf8')
}

function write(p, content) {
  if (!apply) {
    log(`[write] ${p}`)
    if (verbose) log(content)
    return
  }
  ensureDir(p)
  fs.writeFileSync(abs(p), content)
}

function rename(from, to) {
  if (!exists(from)) {
    log(`[skip missing] ${from}`)
    return
  }
  if (!apply) {
    log(`[move] ${from} -> ${to}`)
    return
  }
  ensureDir(to)
  fs.renameSync(abs(from), abs(to))
}

function listFilesUnder(dir) {
  return walk(dir).filter((p) => textExtensions.has(path.extname(p)))
}

function buildMoveMap() {
  const map = new Map()
  for (const [from, to] of directoryMoves) {
    for (const file of listFilesUnder(from)) {
      map.set(slash(file), slash(path.join(to, path.relative(from, file))))
    }
  }
  for (const [from, to] of fileMoves) {
    if (exists(from)) map.set(slash(from), slash(to))
  }
  return map
}

function fileAfterMove(file, moveMap) {
  return moveMap.get(slash(file)) ?? slash(file)
}

function candidatesFor(spec, baseFile) {
  const base = path.resolve(path.dirname(abs(baseFile)), spec)
  const c = []
  for (const ext of sourceExtensions) c.push(base + ext)
  for (const ext of sourceExtensions) c.push(path.join(base, `index${ext}`))
  c.push(base)
  return c.map((p) => slash(rel(p)))
}

function resolveOldTarget(spec, oldFile, moveMap) {
  for (const candidate of candidatesFor(spec, oldFile)) {
    const full = abs(candidate)
    if (moveMap.has(candidate)) return candidate
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return candidate
  }
  return null
}

function specFromTo(fromFile, toFile, originalSpec) {
  const fromDir = path.dirname(abs(fromFile))
  const targetAbs = abs(toFile)
  let next = slash(path.relative(fromDir, targetAbs))
  if (!next.startsWith('.')) next = `./${next}`
  next = next.replace(/\.(tsx?|jsx?|mjs|cjs|mts|cts)$/, '')

  if (/\/index$/.test(next) && !/\/index$/.test(originalSpec)) {
    next = next.replace(/\/index$/, '')
  }
  return next
}

function rewriteRelativeImports(content, oldFile, moveMap) {
  const newFile = fileAfterMove(oldFile, moveMap)
  return content.replace(importRegex, (full, fromPrefix, fromSpec, fromSuffix, importPrefix, importSpec, importSuffix) => {
    const prefix = fromPrefix ?? importPrefix
    const spec = fromSpec ?? importSpec
    const suffix = fromSuffix ?? importSuffix
    const oldTarget = resolveOldTarget(spec, oldFile, moveMap)
    if (!oldTarget) return full
    const newTarget = fileAfterMove(oldTarget, moveMap)
    const nextSpec = specFromTo(newFile, newTarget, spec)
    return `${prefix}${nextSpec}${suffix}`
  })
}

function collectSourceRewrites(moveMap) {
  const files = [
    ...walk(ariaSrc),
    ...walk(resourceSrc),
  ].filter((p) => sourceExtensions.includes(path.extname(p)))

  const rewrites = new Map()
  for (const file of files) {
    const content = read(file)
    const next = rewriteRelativeImports(content, file, moveMap)
    const target = fileAfterMove(file, moveMap)
    if (next !== content || target !== file) {
      if (!apply) log(`[rewrite] ${file}${target !== file ? ` -> ${target}` : ''}`)
      rewrites.set(target, next)
    }
  }
  return rewrites
}

function writeCollectedRewrites(rewrites) {
  for (const [target, content] of rewrites.entries()) {
    ensureDir(target)
    fs.writeFileSync(abs(target), content)
  }
}

function createShim(oldFile, newFile) {
  const oldExt = path.extname(oldFile)
  if (!['.ts', '.tsx'].includes(oldExt)) return
  if (oldFile.endsWith('.test.ts') || oldFile.endsWith('.test.tsx')) return
  const spec = specFromTo(oldFile, newFile, './placeholder')
  const content = `export * from '${spec}'\n`
  write(oldFile, content)
}

function createDirectoryIndexShim(oldIndex, newIndex) {
  createShim(oldIndex, newIndex)
}

function createCompatibilityShims(moveMap) {
  for (const [oldFile, newFile] of moveMap.entries()) createShim(oldFile, newFile)

  createDirectoryIndexShim(`${ariaSrc}/focus/index.ts`, `${ariaSrc}/read/focus/index.ts`)
  createDirectoryIndexShim(`${ariaSrc}/roving/index.ts`, `${ariaSrc}/read/roving/index.ts`)
  createDirectoryIndexShim(`${ariaSrc}/axes/index.ts`, `${ariaSrc}/input/keyboard/axes/index.ts`)
  createDirectoryIndexShim(`${ariaSrc}/key/index.ts`, `${ariaSrc}/input/keyboard/key/index.ts`)
  createDirectoryIndexShim(`${ariaSrc}/gesture/index.ts`, `${ariaSrc}/input/gesture/index.ts`)
  createDirectoryIndexShim(`${ariaSrc}/state/index.ts`, `${ariaSrc}/view-state/index.ts`)
  createDirectoryIndexShim(`${resourceSrc}/zod-crud/index.ts`, `${resourceSrc}/adapters/zod-crud/index.ts`)
}

function updateJson(file, mutator) {
  const json = JSON.parse(read(file))
  mutator(json)
  write(file, `${JSON.stringify(json, null, 2)}\n`)
}

function updatePackageExports() {
  updateJson('packages/aria-kernel/package.json', (pkg) => {
    pkg.description = pkg.description.replace('ARIA 행동 인프라', 'accessible intent 행동 인프라')
    pkg.exports['./read/*'] = {
      development: './src/read/*/index.ts',
      types: './dist/read/*/index.d.ts',
      import: './dist/read/*/index.js',
      require: './dist/read/*/index.cjs',
    }
    pkg.exports['./read/*/*'] = {
      development: './src/read/*/*.ts',
      types: './dist/read/*/*.d.ts',
      import: './dist/read/*/*.js',
      require: './dist/read/*/*.cjs',
    }
    pkg.exports['./input/*'] = {
      development: './src/input/*/index.ts',
      types: './dist/input/*/index.d.ts',
      import: './dist/input/*/index.js',
      require: './dist/input/*/index.cjs',
    }
    pkg.exports['./input/*/*'] = {
      development: './src/input/*/*.ts',
      types: './dist/input/*/*.d.ts',
      import: './dist/input/*/*.js',
      require: './dist/input/*/*.cjs',
    }
    pkg.exports['./input/keyboard/*'] = {
      development: './src/input/keyboard/*/index.ts',
      types: './dist/input/keyboard/*/index.d.ts',
      import: './dist/input/keyboard/*/index.js',
      require: './dist/input/keyboard/*/index.cjs',
    }
    pkg.exports['./input/keyboard/*/*'] = {
      development: './src/input/keyboard/*/*.ts',
      types: './dist/input/keyboard/*/*.d.ts',
      import: './dist/input/keyboard/*/*.js',
      require: './dist/input/keyboard/*/*.cjs',
    }
    pkg.exports['./intent/*'] = {
      development: './src/intent/*.ts',
      types: './dist/intent/*.d.ts',
      import: './dist/intent/*.js',
      require: './dist/intent/*.cjs',
    }
    pkg.exports['./view-state'] = {
      development: './src/view-state/index.ts',
      types: './dist/view-state/index.d.ts',
      import: './dist/view-state/index.js',
      require: './dist/view-state/index.cjs',
    }
    pkg.exports['./view-state/*'] = {
      development: './src/view-state/*.ts',
      types: './dist/view-state/*.d.ts',
      import: './dist/view-state/*.js',
      require: './dist/view-state/*.cjs',
    }
  })

  updateJson('packages/resource/package.json', (pkg) => {
    pkg.exports['./store'] = './src/store/index.ts'
    pkg.exports['./mutation'] = './src/mutation/index.ts'
    pkg.exports['./adapters/zod-crud'] = './src/adapters/zod-crud/index.ts'
  })
}

function createNewIndexes() {
  write(`${resourceSrc}/store/index.ts`, "export * from './data'\n")
  write(`${resourceSrc}/mutation/index.ts`, "export * from './routeUiEventToCrud'\n")
  write(`${ariaSrc}/input/clipboard/index.ts`, "export * from './usePatternClipboard'\n")
}

function movePhysicalPaths() {
  for (const [from, to] of directoryMoves) rename(from, to)
  for (const [from, to] of fileMoves) rename(from, to)
}

function assertNoNestedOldDirs() {
  const conflicts = [
    `${ariaSrc}/read/focus/focus`,
    `${ariaSrc}/read/roving/roving`,
    `${ariaSrc}/input/keyboard/axes/axes`,
    `${ariaSrc}/input/keyboard/key/key`,
    `${ariaSrc}/input/gesture/gesture`,
    `${ariaSrc}/view-state/state`,
    `${resourceSrc}/adapters/zod-crud/zod-crud`,
  ].filter(exists)
  if (conflicts.length > 0) {
    throw new Error(`Unexpected nested move output:\n${conflicts.join('\n')}`)
  }
}

function main() {
  log(apply ? 'Applying folder reorg...' : 'Dry run. Pass --apply to modify files.')
  const moveMap = buildMoveMap()
  log(`Move map entries: ${moveMap.size}`)

  if (!apply) {
    for (const [from, to] of moveMap.entries()) log(`[map] ${from} -> ${to}`)
    collectSourceRewrites(moveMap)
    log('\nPlanned package export updates and compatibility shims.')
    return
  }

  const rewrites = collectSourceRewrites(moveMap)
  movePhysicalPaths()
  writeCollectedRewrites(rewrites)
  createCompatibilityShims(moveMap)
  createNewIndexes()
  updatePackageExports()
  assertNoNestedOldDirs()
  log('Done. Run: pnpm build && pnpm --filter @p/aria-kernel test')
}

main()

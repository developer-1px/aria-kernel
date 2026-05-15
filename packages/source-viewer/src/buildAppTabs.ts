import { parse, type ParseResult } from '@babel/parser'
import type {
  File,
  Statement,
  ExportNamedDeclaration,
  ImportDeclaration,
} from '@babel/types'

export interface AppTab {
  key: string
  label: string
  filename: string
  source: string
  /** 이 파일을 dep 으로 끌고 들어온 심볼들 — line highlight 대상. roots/non-named 은 빈 배열. */
  symbols: string[]
}

export interface SourceRoot {
  filename: string
  label: string
}

const resolveRelative = (fromDir: string, spec: string): string => {
  const parts = (fromDir ? fromDir.split('/') : []).concat(spec.split('/'))
  const out: string[] = []
  for (const p of parts) {
    if (p === '' || p === '.') continue
    if (p === '..') out.pop()
    else out.push(p)
  }
  return out.join('/')
}

const EXT_CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

export const labelFor = (filename: string): string => {
  const parts = filename.split('/')
  let name = parts.pop()!.replace(/\.(test\.)?(tsx?|jsx?)$/, '')
  if (name === 'index') name = parts.pop() ?? 'index'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const dirOf = (file: string) => (file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '')

const resolveSpec = (
  map: Record<string, string>,
  fromDir: string,
  spec: string,
): string | null => {
  const base = spec.startsWith('.') ? resolveRelative(fromDir, spec) : spec
  for (const ext of EXT_CANDIDATES) {
    const c = base + ext
    if (c in map) return c
  }
  return null
}

const parseCache = new Map<string, ParseResult<File>>()
const parseFile = (file: string, source: string): ParseResult<File> | null => {
  const cached = parseCache.get(file)
  if (cached) return cached
  try {
    const ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    })
    parseCache.set(file, ast)
    return ast
  } catch {
    return null
  }
}

interface ImportInfo {
  spec: string
  /** named import 이름 목록. null = default/namespace/side-effect (barrel 통과 X). */
  names: string[] | null
}

const collectImports = (ast: ParseResult<File>): ImportInfo[] => {
  const out: ImportInfo[] = []
  for (const node of ast.program.body as Statement[]) {
    if (node.type === 'ImportDeclaration') {
      const decl = node as ImportDeclaration
      const names: string[] = []
      let hasNamed = false
      let hasDefault = false
      for (const s of decl.specifiers) {
        if (s.type === 'ImportSpecifier') {
          hasNamed = true
          // imported: barrel 안에서 찾을 이름 (export 된 이름).
          const imported = s.imported.type === 'Identifier' ? s.imported.name : s.imported.value
          names.push(imported)
        } else {
          hasDefault = true // ImportDefaultSpecifier / ImportNamespaceSpecifier
        }
      }
      // 순수 named 만이면 barrel-trace, default/namespace 섞이면 그 파일 자체.
      out.push({
        spec: decl.source.value,
        names: hasNamed && !hasDefault ? names : null,
      })
    } else if (
      node.type === 'ExportNamedDeclaration' &&
      (node as ExportNamedDeclaration).source
    ) {
      const decl = node as ExportNamedDeclaration
      const names = decl.specifiers.map((s) => {
        if (s.type === 'ExportSpecifier') {
          // re-export: 우리가 알고싶은 건 source 안에서의 local 이름. ExportSpecifier.local 이 그것.
          return s.local.name
        }
        return ''
      }).filter(Boolean)
      out.push({ spec: decl.source!.value, names: names.length ? names : null })
    }
  }
  return out
}

/**
 * findDefiningFile — barrel(`export … from`) 을 통과해 name 이 실제로 선언된 파일을 추적.
 * AST 기반 — top-level statement 만 검사.
 */
const findDefiningFile = (
  map: Record<string, string>,
  file: string,
  name: string,
  visited: Set<string> = new Set(),
): string | null => {
  if (visited.has(file) || !(file in map)) return null
  visited.add(file)
  const ast = parseFile(file, map[file])
  if (!ast) return null

  for (const node of ast.program.body as Statement[]) {
    // 1) export const|function|class|... name
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const d = node.declaration
      if ('id' in d && d.id && d.id.type === 'Identifier' && d.id.name === name) return file
      if (d.type === 'VariableDeclaration') {
        for (const v of d.declarations) {
          if (v.id.type === 'Identifier' && v.id.name === name) return file
        }
      }
    }
    // 2) export default ... — 이름 매칭이 안 되므로 skip
    // 3) export { name } | export { name } from 'sub' | export { x as name } from 'sub'
    if (node.type === 'ExportNamedDeclaration' && node.specifiers.length > 0) {
      for (const s of node.specifiers) {
        if (s.type !== 'ExportSpecifier') continue
        const exportedName = s.exported.type === 'Identifier' ? s.exported.name : s.exported.value
        if (exportedName !== name) continue
        if (node.source) {
          const target = resolveSpec(map, dirOf(file), node.source.value)
          if (!target) continue
          const def = findDefiningFile(map, target, s.local.name, visited)
          return def ?? target
        }
        // local re-export — 같은 파일에서 정의됐다는 의미.
        return file
      }
    }
    // 4) export * from 'sub' — 재귀
    if (node.type === 'ExportAllDeclaration') {
      const target = resolveSpec(map, dirOf(file), node.source.value)
      if (!target) continue
      const def = findDefiningFile(map, target, name, visited)
      if (def) return def
    }
  }
  return null
}

const stripToSrcRelative = (k: string): string => {
  const idx = k.indexOf('/src/')
  return idx === -1 ? k : k.slice(idx + '/src/'.length)
}

/**
 * Vite glob 결과를 import 그래프로 BFS 순회하여 의존 파일을 탭 목록으로 만든다.
 *
 * 핵심: barrel(`export … from`)은 건너뛰고 **실제 선언 파일만** 결과에 포함.
 * 예: `import { menubarAxis } from '@interactive-os/aria-kernel/patterns'`
 *     → patterns/index.ts (barrel) X, patterns/menubar.ts (정의) ✓
 *
 * @babel/parser AST 기반 — 정규식 X, top-level statement 만 검사.
 */
export function buildAppTabs(
  globResult: Record<string, string>,
  roots: string | SourceRoot[],
): AppTab[] {
  const map: Record<string, string> = {}
  for (const [k, v] of Object.entries(globResult)) {
    map[stripToSrcRelative(k)] = v
  }

  const rootList: SourceRoot[] = typeof roots === 'string'
    ? [{ filename: roots, label: labelFor(roots) }]
    : roots

  const tabs: AppTab[] = []
  const usedKeys = new Set<string>()

  const pushTab = (key: string, label: string, filename: string, symbols: string[]) => {
    if (usedKeys.has(key) || !(filename in map)) return
    usedKeys.add(key)
    tabs.push({ key, label, filename, source: map[filename], symbols })
  }

  // Phase 1 — roots (Demo/Test) — 전체 파일, highlight 없음.
  for (const r of rootList) pushTab(r.filename, r.label, r.filename, [])

  // Phase 2 — root 가 직접 import 한 이름 1개당 탭 1개 (같은 파일이어도 별도). barrel 은 정의 파일까지 추적.
  for (const r of rootList) {
    if (!(r.filename in map)) continue
    const ast = parseFile(r.filename, map[r.filename])
    if (!ast) continue
    const dir = dirOf(r.filename)
    for (const imp of collectImports(ast)) {
      const target = resolveSpec(map, dir, imp.spec)
      if (!target) continue
      if (imp.names && imp.names.length > 0) {
        for (const name of imp.names) {
          const def = findDefiningFile(map, target, name)
          if (!def) continue
          pushTab(`${def}#${name}`, name, def, [name])
        }
      } else {
        pushTab(target, labelFor(target), target, [])
      }
    }
  }

  return tabs
}

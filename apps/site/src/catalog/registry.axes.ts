/**
 * Axis SSOT — `packages/aria-kernel/src/patterns/*.ts` 의 raw 소스를 그대로 분석한다.
 *
 * - 각 pattern 파일의 `composeAxes(...)` 호출에서 axis identifier 를 추출
 * - axis → 그 axis 를 쓰는 patterns 의 [{ name, source }] 매핑을 빌드
 *
 * 새 pattern 추가 / axis 합성 변경 → pattern 파일만 고치면 자동 반영. 별도 메타 선언 ❌.
 */

const sources = import.meta.glob<string>(
  '../../../../packages/aria-kernel/src/patterns/*.ts',
  { eager: true, query: '?raw', import: 'default' },
)

/** Full pkg raw — buildAppTabs 가 axis 화면에서 import 그래프를 따라가기 위함. PatternScreen 의 sources 와 동일 키 규약. */
const pkgRawAll = import.meta.glob<string>(
  '../../../../packages/*/src/**/*.{ts,tsx}',
  { eager: true, query: '?raw', import: 'default' },
)
export const PKG_SOURCES: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(pkgRawAll)) {
    const m = k.match(/\/packages\/([^/]+)\/src\/(.+)$/)
    if (m) out[`@interactive-os/${m[1]}/${m[2]}`] = v
  }
  return out
})()

/**
 * KNOWN axes — `axes/index.ts` raw 에서 `export { X } from './X'` (export name ==
 * 파일 basename) 만 추출. composeAxes / KEYS / seedExpand 같은 infra export 는
 * 이름≠파일이라 자동 배제. 새 axis 추가 → index.ts 만 수정하면 자동 반영.
 */
const axesIndexSrc = import.meta.glob<string>(
  '../../../../packages/aria-kernel/src/axes/index.ts',
  { eager: true, query: '?raw', import: 'default' },
)
const KNOWN_AXES: ReadonlySet<string> = (() => {
  const src = Object.values(axesIndexSrc)[0] ?? ''
  const out = new Set<string>()
  const re = /export\s*\{([^}]+)\}\s*from\s*['"]\.\/([\w-]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    const file = m[2]
    for (const raw of m[1].split(',')) {
      const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()!.trim()
      if (name === file) out.add(name)
    }
  }
  return out
})()

const SKIP = new Set(['index', 'types', 'spinbutton.test'])

export interface PatternSource {
  /** 파일 basename, e.g. 'listbox' */
  name: string
  /** APG slug for link, e.g. 'listbox' (default: 동일) */
  apg: string
  source: string
}

/** `composeAxes( navigate, activate, typeahead )` → ['navigate','activate','typeahead'] (괄호 호출/options 무시). */
function extractAxesFromCompose(src: string): string[] {
  const out = new Set<string>()
  const re = /composeAxes\s*\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    for (const token of m[1].split(',')) {
      const id = token.trim().match(/^([a-zA-Z_$][\w$]*)/)?.[1]
      if (id && KNOWN_AXES.has(id)) out.add(id)
    }
  }
  return [...out]
}

/** Pattern 파일이 직접 axis 를 사용한 경우(`numericStep('horizontal')` 같은 단축 호출) 도 회수. */
function extractDirectAxisCalls(src: string): string[] {
  const out = new Set<string>()
  for (const ax of KNOWN_AXES) {
    if (new RegExp(`\\b${ax}\\s*\\(`).test(src)) out.add(ax)
  }
  return [...out]
}

export interface Pattern {
  name: string
  /** PKG_SOURCES key — buildAppTabs root file. */
  filename: string
  source: string
  axes: string[]
}

const patterns: Pattern[] = Object.entries(sources)
  .map(([path, source]) => ({ path, source }))
  .map(({ path, source }) => {
    const name = path.split('/').pop()!.replace(/\.ts$/, '')
    const filename = `@interactive-os/aria-kernel/patterns/${name}.ts`
    return { name, filename, source, axes: [] as string[] }
  })
  .filter((p) => !SKIP.has(p.name))
  .map((p) => ({
    ...p,
    axes: dedupe([...extractAxesFromCompose(p.source), ...extractDirectAxisCalls(p.source)]),
  }))
  .filter((p) => p.axes.length > 0)

function dedupe<T>(xs: T[]) { return [...new Set(xs)] }

/** pattern → axis 어휘 (정방향). axis 추출 후 dedupe된 결과. */
export const PATTERNS: Pattern[] = patterns.slice().sort((a, b) => a.name.localeCompare(b.name))

export interface AxisEntry {
  axis: string
  patterns: Pattern[]
}

/** axis → patterns. 알파벳 순. */
export const AXES: AxisEntry[] = (() => {
  const map = new Map<string, Pattern[]>()
  for (const p of patterns) {
    for (const ax of p.axes) {
      const arr = map.get(ax) ?? []
      arr.push(p)
      map.set(ax, arr)
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([axis, ps]) => ({
      axis,
      patterns: ps.sort((a, b) => a.name.localeCompare(b.name)),
    }))
})()

export const slugForAxis = (axis: string) => axis.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

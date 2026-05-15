import type { ComponentType } from 'react'
import { KINDS, type Kind } from './kind'
import { buildAppTabs, type AppTab } from '@interactive-os/source-viewer'

export interface DemoMeta {
  title: string
  apg: string
  kind: Kind
  blurb: string
  /** Demo 가 자기 키를 owns — registry 가 자동 수집. PATTERN_KEYS 매핑 폐기. */
  keys?: () => string[]
  /** preview 영역이 기본 max-w-[420px] 보다 넓어야 할 때. */
  wide?: boolean
}

interface DemoModule {
  default: ComponentType
  meta: DemoMeta
}

export interface Entry extends DemoMeta {
  filename: string
  slug: string
  Component: ComponentType
  tabs: AppTab[]
}

const slugFor = (filename: string) =>
  filename
    .replace(/\.tsx$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()

const modules = import.meta.glob<DemoModule>(
  ['../demos/*.tsx', '!../demos/*.test.tsx'],
  { eager: true },
)
const sourcesRaw = import.meta.glob<string>(
  ['../demos/*.tsx', '../demos/**/*.ts', '../demos/**/*.tsx'],
  { eager: true, query: '?raw', import: 'default' },
)
const pkgRaw = import.meta.glob<string>(
  '../../../../packages/*/src/**/*.{ts,tsx}',
  { eager: true, query: '?raw', import: 'default' },
)
const PREFIX = '../demos/'
const sources: Record<string, string> = {}
for (const [k, v] of Object.entries(sourcesRaw)) {
  sources[k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k] = v
}
// @interactive-os/<pkg>/<rel-from-src> 키 부여 — buildAppTabs 가 `@interactive-os/aria-kernel` 같은 bare spec 도 그대로 매칭.
for (const [k, v] of Object.entries(pkgRaw)) {
  const m = k.match(/\/packages\/([^/]+)\/src\/(.+)$/)
  if (m) sources[`@interactive-os/${m[1]}/${m[2]}`] = v
}

const isTest = (path: string) => /\.test\.tsx$/.test(path)

export const ENTRIES: Entry[] = Object.entries(modules)
  .filter(([path]) => !path.includes('/_') && !isTest(path))
  .map(([path, mod]) => {
    const filename = path.split('/').pop()!
    const testFilename = filename.replace(/\.tsx$/, '.test.tsx')
    const hasTest = testFilename in sources
    const tabs = buildAppTabs(sources, [
      { filename, label: 'Demo' },
      ...(hasTest ? [{ filename: testFilename, label: 'Test' }] : []),
    ])
    return {
      ...mod.meta,
      Component: mod.default,
      tabs,
      filename,
      slug: slugFor(filename),
    }
  })
  .sort((a, b) => KINDS[a.kind].order - KINDS[b.kind].order || a.title.localeCompare(b.title))

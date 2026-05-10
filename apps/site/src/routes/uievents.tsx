import { createFileRoute } from '@tanstack/react-router'
import typesSrc from '@p/aria-kernel/types.ts?raw'
import {
  UI_EVENT_CATEGORY,
  UI_EVENT_CATEGORY_META,
  UI_EVENT_CATEGORY_ORDER,
  type UiEventCategory,
} from '@p/aria-kernel'

export const Route = createFileRoute('/uievents')({
  component: UiEventsApp,
  staticData: {
    palette: {
      label: 'UiEvents',
      to: '/uievents',
      sub: 'ui ↔ headless 통신의 단일 어휘 — UiEvent variant 카탈로그',
    },
  },
})

interface Variant {
  type: string
  shape: string
  doc?: string
}

/**
 * types.ts 에서 `export type UiEvent = ...` 블록을 추출하여 variant 분해.
 * SSOT = 코드. site는 그것을 비주얼라이즈만.
 */
function extractVariants(): Variant[] {
  const m = typesSrc.match(/export type UiEvent =\n([\s\S]*?)\n\n/m)
  if (!m) return []
  const body = m[1]
  const lines = body.split('\n')
  const variants: Variant[] = []
  let pendingDoc: string | undefined

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const docMatch = line.match(/^\/\*\*\s*(.*?)\s*\*\/$/)
    if (docMatch) { pendingDoc = docMatch[1]; continue }
    const variantMatch = line.match(/^\|\s*\{\s*type:\s*'([^']+)';?\s*(.*?)\s*\}\s*$/)
    if (variantMatch) {
      variants.push({
        type: variantMatch[1],
        shape: variantMatch[2] || '(no payload)',
        doc: pendingDoc,
      })
      pendingDoc = undefined
    }
  }
  return variants
}

/**
 * 패턴 소스(`patterns/*.ts`, `gesture/*.ts`)를 raw 로 glob 해 `type: 'X'` 리터럴을
 * 스캔하여 variant → emitter pattern 역인덱스를 빌드. SSOT = 코드.
 */
const PATTERN_SRCS = import.meta.glob(
  [
    '../../../../packages/aria-kernel/src/patterns/*.ts',
    '../../../../packages/aria-kernel/src/gesture/*.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

function buildEmittersIndex(variantTypes: Set<string>): Record<string, string[]> {
  const index: Record<string, Set<string>> = {}
  for (const [path, src] of Object.entries(PATTERN_SRCS)) {
    const name = path.split('/').pop()!.replace(/\.ts$/, '')
    if (name === 'index' || name === 'types' || name.startsWith('usePatternBase') || name.startsWith('usePatternClipboard')) continue
    const matches = src.matchAll(/\btype:\s*'([a-zA-Z]+)'/g)
    for (const m of matches) {
      const t = m[1]
      if (!variantTypes.has(t)) continue
      ;(index[t] ??= new Set()).add(name)
    }
  }
  return Object.fromEntries(Object.entries(index).map(([k, v]) => [k, [...v].sort()]))
}

function UiEventsApp() {
  const variants = extractVariants()
  const emitters = buildEmittersIndex(new Set(variants.map((v) => v.type)))

  // SSOT — types.ts 의 UI_EVENT_CATEGORY map 으로 그룹화. 새 variant 추가 시
  // TS Record<UiEvent['type'], ...> 가 누락 강제.
  const groups = new Map<UiEventCategory, Variant[]>()
  for (const v of variants) {
    const cat = (UI_EVENT_CATEGORY as Record<string, UiEventCategory>)[v.type]
    if (!cat) continue
    ;(groups.get(cat) ?? groups.set(cat, []).get(cat)!).push(v)
  }
  const orphans = variants.filter(
    (v) => !(UI_EVENT_CATEGORY as Record<string, UiEventCategory>)[v.type],
  )

  const renderVariant = (v: Variant) => {
    const ems = emitters[v.type] ?? []
    return (
      <div key={v.type} className="grid grid-cols-[10rem_1fr] gap-x-6 gap-y-1 py-3 border-b border-stone-100 last:border-0">
        <div className="font-mono text-[15px] font-semibold text-stone-900">{v.type}</div>
        <div className="font-mono text-[14px] text-stone-500">
          {v.shape === '(no payload)' ? '—' : v.shape}
        </div>
        {v.doc && (
          <p className="col-start-2 text-[14px] leading-relaxed text-stone-600">{v.doc}</p>
        )}
        <div className="col-start-2 text-[13px] text-stone-500">
          {ems.length === 0 ? <span className="text-stone-300">no emitter</span> : ems.join(', ')}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="px-8 pt-12 pb-8 mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">UiEvent</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-stone-600">
          UI ↔ headless 통신의 단일 어휘. 모든 패턴이 <code className="font-mono text-stone-800">onEvent(e: UiEvent)</code> 한 채널로 dispatch.
          SSOT 는 <code className="font-mono text-stone-800">packages/aria-kernel/src/types.ts</code>.
        </p>
        <p className="mt-2 text-[13px] text-stone-400">
          {variants.length} variants · {groups.size} categories
        </p>
      </header>

      <main className="mx-auto max-w-4xl px-8 pb-20">
        {UI_EVENT_CATEGORY_ORDER.map((cat) => {
          const items = groups.get(cat) ?? []
          if (!items.length) return null
          const meta = UI_EVENT_CATEGORY_META[cat]
          return (
            <section key={cat} className="mt-12 first:mt-0">
              <header className="mb-2 flex items-baseline gap-3 border-b border-stone-200 pb-2">
                <h2 className="text-[17px] font-semibold text-stone-900">{meta.label}</h2>
                {meta.hint && <span className="text-[13px] text-stone-400">{meta.hint}</span>}
              </header>
              <div>{items.map(renderVariant)}</div>
            </section>
          )
        })}

        {orphans.length > 0 && (
          <section className="mt-12">
            <header className="mb-2 flex items-baseline gap-3 border-b border-stone-200 pb-2">
              <h2 className="text-[17px] font-semibold text-stone-900">Uncategorized</h2>
              <span className="text-[13px] text-stone-400">UI_EVENT_CATEGORY 매핑 누락</span>
            </header>
            <div>
              {orphans.map((v) => (
                <div key={v.type} className="grid grid-cols-[10rem_1fr] gap-x-6 py-3 border-b border-stone-100 last:border-0">
                  <div className="font-mono text-[15px] font-semibold text-stone-900">{v.type}</div>
                  <div className="font-mono text-[14px] text-stone-500">{v.shape === '(no payload)' ? '—' : v.shape}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

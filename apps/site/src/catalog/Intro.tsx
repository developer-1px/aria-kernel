import { KINDS, KIND_LIST, type Kind } from './kind'
import { ENTRIES } from './registry.patterns'
import { WRAPPER_ENTRIES } from './registry.wrappers'

/**
 * 카탈로그 첫 진입 = 풀스크린 슬라이드 2장.
 * Slide 1 = 정체성(hero + install + 3 pillar)
 * Slide 2 = 문제(데이터 모양 ≠ 시각 모양) + 패턴 chip cloud 인덱스
 */
export function Intro() {
  return (
    <>
      <SlideHero />
      <SlideIndex />
    </>
  )
}

function SlideHero() {
  return (
    <section
      id="intro"
      tabIndex={-1}
      className="md:snap-start md:min-h-screen flex items-center bg-gradient-to-b from-white to-stone-50"
    >
      <div className="mx-auto w-full max-w-5xl px-8 py-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          v0.0.1 · MIT · {ENTRIES.length} APG patterns
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-stone-900">@interactive-os/aria-kernel</h1>
        <p className="mt-6 max-w-2xl text-2xl leading-relaxed text-stone-600">
          Behavior infrastructure for WAI-ARIA. Roving tabindex, axis composition,{' '}
          <span className="font-medium text-stone-900">{ENTRIES.length} APG patterns</span> — zero
          markup vocabulary, zero CSS.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Pillar
            title="W3C-faithful"
            body="Names, roles and structure follow WAI-ARIA + APG verbatim."
          />
          <Pillar
            title="Behavior, not chrome"
            body="One layer below Radix-class libraries. No components, markup, or styles."
          />
          <Pillar
            title="LLM-workable"
            body="Each recipe = (data, onEvent) → { rootProps, partProps(id), items }."
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <code className="rounded-md bg-stone-900 px-3 py-2 text-sm font-mono text-white">
            pnpm add @interactive-os/aria-kernel
          </code>
          <a
            href="/docs/overview"
            className="text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900"
          >
            Read overview →
          </a>
          <a
            href="https://www.w3.org/WAI/ARIA/apg/"
            className="text-sm text-stone-600 underline underline-offset-4 hover:text-stone-900"
          >
            W3C APG ↗
          </a>
        </div>

        <div className="mt-16 flex items-center gap-2 text-xs text-stone-400">
          <span>scroll</span>
          <span className="animate-bounce">↓</span>
        </div>
      </div>
    </section>
  )
}

function SlideIndex() {
  const total = ENTRIES.length + WRAPPER_ENTRIES.length
  return (
    <section
      id="index"
      tabIndex={-1}
      className="md:snap-start md:min-h-screen flex flex-col justify-center bg-white"
    >
      <div className="mx-auto w-full max-w-[1400px] px-8 py-12">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">
          Data shape ≠ visual shape.
        </h2>
        <p className="mt-3 max-w-3xl text-lg text-stone-600">
          PowerPoint thumbnails are a tree but render as a flat card list. Mac Finder columns are a
          tree but render as horizontal panes. Headless libraries couple the two — this one
          doesn't. {total} patterns below; behavior is guaranteed, visuals are yours.
        </p>

        <div className="mt-8 columns-2 gap-x-8 md:columns-3 lg:columns-4 xl:columns-5 [&>div]:break-inside-avoid [&>div]:mb-6">
          {KIND_LIST.map((kind) => (
            <KindBlock key={kind} kind={kind} />
          ))}
          <div>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-600">
              Wrappers
            </h3>
            <ul className="space-y-0.5">
              {WRAPPER_ENTRIES.map((entry) => (
                <li key={entry.slug}>
                  <a
                    href={`/wrappers#${entry.slug}`}
                    className="block rounded px-2 py-0.5 text-sm text-stone-700 hover:bg-stone-200"
                  >
                    {entry.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function KindBlock({ kind }: { kind: Kind }) {
  const entries = ENTRIES.filter((e) => e.kind === kind)
  const families = new Map<string, typeof entries>()
  for (const e of entries) {
    const arr = families.get(e.apg) ?? []
    arr.push(e)
    families.set(e.apg, arr)
  }

  if (kind !== 'collection' || families.size <= 1) {
    return (
      <div>
        <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          {KINDS[kind].label}
        </h3>
        <EntryList entries={entries} />
      </div>
    )
  }

  return (
    <>
      {[...families.entries()].map(([apg, list]) => (
        <div key={apg}>
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            {apg}
          </h3>
          <EntryList entries={list} />
        </div>
      ))}
    </>
  )
}

function EntryList({ entries }: { entries: typeof ENTRIES }) {
  return (
    <ul className="space-y-0.5">
      {entries.map((e) => (
        <li key={e.slug}>
          <a
            href={`#${e.slug}`}
            className="block rounded px-2 py-0.5 text-sm text-stone-700 hover:bg-stone-200"
          >
            {e.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
    </div>
  )
}

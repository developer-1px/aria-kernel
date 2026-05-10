import { useState } from 'react'
import { useFeedPattern } from '@p/aria-kernel/patterns'

const ARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: `a${i + 1}`,
  label: `Article ${i + 1}`,
}))

export function FeedPageNavDemo() {
  const [busy, setBusy] = useState(false)
  const { rootProps, articleProps, labelProps, items } = useFeedPattern(
    ARTICLES, undefined, { label: '뉴스 피드', busy, autoFocus: true },
  )

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.23</span>
          Feed — PageUp/PageDown navigation + aria-busy
        </h1>
        <p className="text-sm text-neutral-500">
          APG /feed/ — article roving (tabIndex=-1, programmatic focus), PageUp/Down 인접 이동,
          aria-busy 흡수. ↑/↓ 도 가능.
        </p>
      </header>

      <button
        onClick={() => setBusy((b) => !b)}
        className="mb-2 rounded bg-neutral-900 px-3 py-1 text-sm text-white hover:bg-neutral-700"
      >
        aria-busy: {busy ? 'on' : 'off'}
      </button>

      <div {...rootProps} className="space-y-2 rounded border border-neutral-200 bg-white p-2 max-h-72 overflow-auto">
        {items.map((it) => (
          <article
            key={it.id}
            {...articleProps(it.id)}
            className="rounded border border-neutral-100 p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <h3 {...labelProps(it.id)} className="text-sm font-medium">{it.label}</h3>
            <p className="mt-1 text-xs text-neutral-500">posinset {it.posinset} / setsize {it.setsize}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

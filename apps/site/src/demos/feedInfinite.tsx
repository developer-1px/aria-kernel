import { useRef, useState } from 'react'
import { feedAxis, useFeedPattern } from '@interactive-os/aria-kernel/patterns'
import { axisKeys } from '@interactive-os/aria-kernel'

const blurb = 'A scrollable container of articles where new items append on demand.'

export const meta = {
  title: 'Feed · Infinite Scroll',
  apg: 'feed',
  kind: 'collection' as const,
  blurb,
  keys: () => axisKeys(feedAxis()),
}

interface Article {
  id: string
  title: string
  body: string
}

const SAMPLE_TITLES = [
  'The shape of headless behavior',
  'Why ARIA is the only vocabulary',
  'Roving tabindex, demystified',
  'Patterns are recipes, not wrappers',
  'Spatial vs logical navigation',
  'Composing axes for free',
  'Data-driven collections',
  'Gestures and intents, separated',
  'Feed: the bundle of articles',
  'Declarations, not instructions',
]

const SAMPLE_BODIES = [
  'Behavior is the invariant. Visuals are free. Tailwind expresses every decision the eye can see.',
  'W3C ARIA + WHATWG HTML are the canonical source for names, structure, and roles.',
  'One tab stop per collection. Arrow keys roam within. The spec demands it; the recipe enforces it.',
  'A pattern hook ships the keyboard model, focus invariant, and ARIA props in one breath.',
  'APG describes the relationship graph; spatnav describes the coordinate plane. Both produce one tab stop.',
  'composeAxes lets a pattern register exactly the axes it cares about — no global keymap.',
  'Pass `(data, onEvent)` and the pattern renders the props. The UI never owns the relationships.',
  'UI emits `activate`. Helpers derive `expand`/`navigate`. Reducers stay narrow.',
  'A feed is N articles in a bundle, not a picker. PageUp/PageDown moves between them.',
  'Every artifact is a verifiable declaration — never an instruction.',
]

const makeArticle = (i: number): Article => ({
  id: `a${i}`,
  title: SAMPLE_TITLES[i % SAMPLE_TITLES.length],
  body: SAMPLE_BODIES[i % SAMPLE_BODIES.length],
})

export default function FeedInfiniteDemo() {
  const nextId = useRef(0)
  const [articles, setArticles] = useState<Article[]>(() =>
    Array.from({ length: 5 }, () => makeArticle(nextId.current++)),
  )
  const [busy, setBusy] = useState(false)

  const { rootProps, articleProps, labelProps } = useFeedPattern(
    articles.map((a) => ({ id: a.id, label: a.title })),
    undefined,
    { label: 'Headless notes feed', busy },
  )

  const loadMore = () => {
    setBusy(true)
    setTimeout(() => {
      setArticles((prev) => [
        ...prev,
        ...Array.from({ length: 5 }, () => makeArticle(nextId.current++)),
      ])
      setBusy(false)
    }, 400)
  }

  return (
    <div className="w-[min(100%,42rem)]">
      <section
        {...rootProps}
        className="flex flex-col gap-3"
      >
        {articles.map((a) => (
          <article
            key={a.id}
            {...articleProps(a.id)}
            className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <h3 {...labelProps(a.id)} className="text-sm font-semibold text-neutral-900">
              {a.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-600">{a.body}</p>
          </article>
        ))}
      </section>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={loadMore}
          disabled={busy}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Loading…' : 'Load more'}
        </button>
        <span className="text-xs text-neutral-500">
          {articles.length} article{articles.length === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  )
}

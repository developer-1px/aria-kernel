import { useState } from 'react'
import { KEYS } from '@p/aria-kernel'

export const meta = {
  title: 'Link',
  apg: 'link',
  kind: 'collection' as const,
  blurb: 'Native <a> vs role="link" — non-anchor needs JS to support Enter & Space.',
  keys: () => ['Enter', 'Space'],
}

export default function LinkDemo() {
  const [log, setLog] = useState<string[]>([])
  const trace = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4))

  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Native &lt;a&gt;</span>
        <div>
          <a
            href="#anchor"
            onClick={(e) => { e.preventDefault(); trace('a → click') }}
            className="text-stone-700 underline underline-offset-4 hover:text-stone-900"
          >
            Read the docs
          </a>
          <span className="ml-2 text-xs text-stone-500">(Enter activates; UA handles)</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">role="link" on &lt;span&gt;</span>
        <div>
          <span
            role="link"
            tabIndex={0}
            onClick={() => trace('span → click')}
            onKeyDown={(e) => {
              if (e.key === KEYS.Enter || e.key === KEYS.Space) {
                e.preventDefault()
                trace(`span → ${e.key === KEYS.Space ? 'Space' : 'Enter'}`)
              }
            }}
            className="cursor-pointer text-stone-700 underline underline-offset-4 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            Open editor
          </span>
          <span className="ml-2 text-xs text-stone-500">(must wire Enter + Space manually)</span>
        </div>
      </div>

      <div className="rounded border border-stone-200 bg-stone-50 p-2 text-xs">
        <div className="font-medium text-stone-700">Activation log</div>
        {log.length === 0 ? (
          <div className="text-stone-400">— activate a link to see the event —</div>
        ) : (
          <ul className="font-mono">
            {log.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}

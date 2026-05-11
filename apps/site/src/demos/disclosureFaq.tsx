import { useReducer } from 'react'
import { axisKeys, fromList, isExpanded, reduceSingleSelect } from '@p/aria-kernel'
import { disclosureAxis, disclosurePattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Disclosure · FAQ',
  apg: 'disclosure',
  kind: 'collection' as const,
  blurb: 'A list of independently expandable Q&A items — same disclosure hook, repeated.',
  keys: () => axisKeys(disclosureAxis()),
}

const QA = [
  { id: 'q1', q: 'How do I install?', a: 'Run npm install @p/aria-kernel.' },
  { id: 'q2', q: 'Does it work with Vite?', a: 'Yes — see the Vite plugin guide.' },
  { id: 'q3', q: 'How do I report a bug?', a: 'Open an issue on the GitHub repository.' },
]

function Item({ id, q, a, data, onEvent }: { id: string; q: string; a: string; data: any; onEvent: any }) {
  const open = isExpanded(data, id)
  const { triggerProps, panelProps } = disclosurePattern(data, id, onEvent)
  return (
    <div className="border-b border-stone-200 last:border-b-0">
      <button
        {...triggerProps}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-medium hover:bg-stone-50"
      >
        <span>{q}</span>
        <span aria-hidden className="text-stone-400">{open ? '−' : '+'}</span>
      </button>
      <div {...panelProps} className="pb-2 text-sm text-stone-600">{a}</div>
    </div>
  )
}

export default function DisclosureFaqDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, QA.map(({ id }) => ({ id })), fromList)
  return (
    <div className="w-80 rounded-md border border-stone-200 bg-white px-3">
      {QA.map((item) => (
        <Item key={item.id} {...item} data={data} onEvent={dispatch} />
      ))}
    </div>
  )
}

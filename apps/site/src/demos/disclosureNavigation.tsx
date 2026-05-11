import { axisKeys, isExpanded } from '@p/aria-kernel'
import { disclosureAxis, disclosurePattern, useDisclosureReducer } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Disclosure · Navigation',
  apg: 'disclosure',
  kind: 'collection' as const,
  blurb: 'Top-level nav buttons reveal sub-link panels — only one open at a time is host policy.',
  keys: () => axisKeys(disclosureAxis()),
}

const NAV = [
  { id: 'products', label: 'Products', subs: ['Cloud', 'On-prem', 'API'] },
  { id: 'company', label: 'Company', subs: ['About', 'Careers', 'Contact'] },
  { id: 'resources', label: 'Resources', subs: ['Blog', 'Docs', 'Changelog'] },
]

function Section({ id, label, subs, data, onEvent }: { id: string; label: string; subs: string[]; data: any; onEvent: any }) {
  const open = isExpanded(data, id)
  const { triggerProps, panelProps } = disclosurePattern(data, id, onEvent)
  return (
    <li className="relative">
      <button
        {...triggerProps}
        className="rounded px-3 py-1.5 text-sm [&:not([data-state=open])]:hover:bg-stone-200 data-[state=open]:bg-stone-900 data-[state=open]:text-white"
      >
        {label} <span aria-hidden>{open ? '▴' : '▾'}</span>
      </button>
      <ul {...panelProps} className="absolute left-0 top-full mt-1 w-40 rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg">
        {subs.map((s) => (
          <li key={s}>
            <a href={`#${s}`} className="block rounded px-2 py-1 hover:bg-stone-200">{s}</a>
          </li>
        ))}
      </ul>
    </li>
  )
}

export default function DisclosureNavigationDemo() {
  const [data, dispatch] = useDisclosureReducer(NAV.map(({ id }) => ({ id })))
  return (
    <nav>
      <ul className="flex gap-1 rounded-md border border-stone-200 bg-white p-1">
        {NAV.map((s) => (
          <Section key={s.id} {...s} data={data} onEvent={dispatch} />
        ))}
      </ul>
    </nav>
  )
}

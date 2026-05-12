import { useReducer } from 'react'
import { applyGesture, axisKeys, expandBranchOnActivate, fromTree, reduceSingleSelect } from '@p/aria-kernel'
import { treeviewAxis, useTreeviewPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Tree · Navigation',
  apg: 'treeview',
  kind: 'collection' as const,
  blurb: 'Site-navigation tree — selected treeitem carries aria-current="page".',
  keys: () => axisKeys(treeviewAxis()),
}

interface Node { id: string; label: string; children?: Node[] }

const NAV: Node[] = [
  { id: 'home', label: 'Home' },
  { id: 'docs', label: 'Documentation', children: [
    { id: 'getting-started', label: 'Getting started' },
    { id: 'patterns', label: 'Patterns', children: [
      { id: 'listbox', label: 'Listbox' },
      { id: 'tree', label: 'Tree' },
    ]},
  ]},
  { id: 'blog', label: 'Blog' },
  { id: 'about', label: 'About' },
]

const reducer = applyGesture(reduceSingleSelect, expandBranchOnActivate)
const initNav = () => {
  const d = fromTree(NAV, { expanded: ['docs', 'patterns'] })
  d.entities['tree'] = { ...(d.entities['tree'] ?? {}), selected: true }
  return d
}

export default function TreeNavigationDemo() {
  const [data, dispatch] = useReducer(reducer, undefined, initNav)
  const { rootProps, itemProps, items } = useTreeviewPattern(data, dispatch, {
    label: 'Site navigation',
    variant: 'navigation',
  })

  return (
    <nav aria-label="Site">
      <ul {...rootProps} className="w-56 rounded-md border border-stone-200 bg-white p-1 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            {...itemProps(item.id)}
            style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
            className="cursor-pointer rounded px-2 py-1 [&:not([aria-current=page])]:hover:bg-stone-200 aria-[current=page]:bg-stone-900 aria-[current=page]:text-white"
          >
            <span aria-hidden className="mr-1 inline-block w-3 text-stone-400">
              {item.hasChildren ? (item.expanded ? 'v' : '>') : ''}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </nav>
  )
}

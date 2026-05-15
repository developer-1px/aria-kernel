import { axisKeys } from '@interactive-os/aria-kernel'
import { treeviewAxis, useTreeviewPattern, useTreeviewReducer } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Tree',
  apg: 'treeview',
  kind: 'collection' as const,
  blurb: 'A collapsible hierarchy for browsing nested files and folders.',
  keys: () => axisKeys(treeviewAxis()),
}

interface Node {
  id: string
  label: string
  children?: Node[]
}

const tree: Node[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'app', label: 'App.tsx' },
      {
        id: 'demos',
        label: 'demos',
        children: [
          { id: 'tabs', label: 'tabs.tsx' },
          { id: 'tree', label: 'tree.tsx' },
        ],
      },
    ],
  },
  { id: 'pkg', label: 'package.json' },
]

export default function TreeDemo() {
  const [data, dispatch] = useTreeviewReducer(tree, { defaultExpanded: ['src', 'demos'] })
  const { rootProps, itemProps, items } = useTreeviewPattern(data, dispatch)

  return (
    <ul
      {...rootProps}
      aria-label="Files"
      className="w-64 rounded-md border border-stone-200 bg-white p-1 text-sm"
    >
      {items.map((item) => (
        <li
          key={item.id}
          {...itemProps(item.id)}
          style={{ paddingLeft: 8 + item.level * 16 }}
          className="cursor-pointer rounded py-1 pr-2 [&:not([aria-selected=true])]:hover:bg-stone-200 aria-selected:bg-stone-900 aria-selected:text-white"
        >
          <span className="inline-block w-4 text-stone-400">
            {item.hasChildren ? (item.expanded ? '▾' : '▸') : ''}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  )
}

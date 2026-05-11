import { useReducer } from 'react'
import {
  applyGesture,
  axisKeys,
  expandBranchOnActivate,
  fromTree,
  reduceMultiSelect,
} from '@p/aria-kernel'
import { treeGridAxis, useTreeGridPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Tree Grid · Multi',
  apg: 'treegrid',
  kind: 'collection' as const,
  blurb: 'A hierarchical table that supports selecting several visible rows at once.',
  keys: () => axisKeys(treeGridAxis({ multiSelectable: true })),
}

interface Row {
  id: string
  label: string
  size: string
  modified: string
  children?: Row[]
}

const rows: Row[] = [
  {
    id: 'src',
    label: 'src',
    size: '—',
    modified: '2026-05-01',
    children: [
      { id: 'app', label: 'App.tsx', size: '4 KB', modified: '2026-05-02' },
      { id: 'main', label: 'main.tsx', size: '0.5 KB', modified: '2026-05-02' },
    ],
  },
  { id: 'pkg', label: 'package.json', size: '1 KB', modified: '2026-05-02' },
]

const COLS = ['Name', 'Size', 'Modified']
const treeGridReducer = applyGesture(expandBranchOnActivate, reduceMultiSelect)

export default function TreeGridMultiDemo() {
  const [data, dispatch] = useReducer(treeGridReducer, undefined, () => fromTree(rows, { expanded: ['src'] }))
  const {
    treegridProps,
    headerRowProps,
    rowProps,
    columnheaderProps,
    rowheaderProps,
    gridcellProps,
    items,
  } = useTreeGridPattern(data, dispatch, {
    multiSelectable: true,
    label: 'Files (multi-select)',
    colCount: COLS.length,
  })

  return (
    <div
      {...treegridProps}
      className="w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-sm shadow-sm"
    >
      <div
        {...headerRowProps}
        className="grid grid-cols-[minmax(0,1.5fr)_88px_132px] items-center border-b border-stone-200 bg-stone-50 text-xs font-medium text-stone-600"
      >
        {COLS.map((c, i) => (
          <span key={c} {...columnheaderProps(i)} className="px-3 py-2">
            {c}
          </span>
        ))}
      </div>
      {items.map((item) => {
        const ent = data.entities[item.id] ?? {}
        return (
          <div
            key={item.id}
            {...rowProps(item.id)}
            className="grid grid-cols-[minmax(0,1.5fr)_88px_132px] items-center border-b border-stone-100 last:border-b-0 [&:not([aria-selected=true])]:hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900 aria-selected:bg-stone-900 aria-selected:text-white"
          >
            <span
              {...rowheaderProps(item.id)}
              style={{ paddingLeft: `${12 + (item.level - 1) * 18}px` }}
              className="flex min-w-0 items-center gap-1 py-2 pr-3"
            >
              <span aria-hidden className="w-4 shrink-0 text-center text-stone-400">
                {item.hasChildren ? (item.expanded ? 'v' : '>') : ''}
              </span>
              <span className="truncate">{item.label}</span>
            </span>
            <span {...gridcellProps(item.id, 1)} className="px-3 py-2 text-stone-600">
              {String(ent.size ?? '')}
            </span>
            <span {...gridcellProps(item.id, 2)} className="px-3 py-2 text-stone-600">
              {String(ent.modified ?? '')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

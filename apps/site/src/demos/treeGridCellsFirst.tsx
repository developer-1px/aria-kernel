import { axisKeys } from '@interactive-os/aria-kernel'
import { treegridAxis, useTreegridPattern, useTreegridReducer } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Tree Grid · Cells-First',
  apg: 'treegrid',
  kind: 'collection' as const,
  blurb: 'Cells take focus by default; the row containing the focused cell is aria-selected.',
  keys: () => axisKeys(treegridAxis()),
}

interface Row {
  id: string; label: string; size: string; modified: string; children?: Row[]
}

const rows: Row[] = [
  {
    id: 'src', label: 'src', size: '—', modified: '2026-05-01',
    children: [
      { id: 'app', label: 'App.tsx', size: '4 KB', modified: '2026-05-02' },
      { id: 'main', label: 'main.tsx', size: '0.5 KB', modified: '2026-05-02' },
    ],
  },
  { id: 'pkg', label: 'package.json', size: '1 KB', modified: '2026-05-02' },
]

const COLS = ['Name', 'Size', 'Modified']

export default function TreegridCellsFirstDemo() {
  const [data, dispatch] = useTreegridReducer(rows, { defaultExpanded: ['src'] })
  const {
    treegridProps, headerRowProps, rowProps, columnheaderProps, rowheaderProps, gridcellProps, items,
  } = useTreegridPattern(data, dispatch, {
    label: 'Files (cells-first)',
    colCount: COLS.length,
    navigationMode: 'cell',
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
          <span key={c} {...columnheaderProps(i)} className="px-3 py-2">{c}</span>
        ))}
      </div>
      {items.map((item) => {
        const ent = data.entities[item.id] ?? {}
        return (
          <div
            key={item.id}
            {...rowProps(item.id)}
            className="grid grid-cols-[minmax(0,1.5fr)_88px_132px] items-center border-b border-stone-100 last:border-b-0 aria-selected:bg-stone-100"
          >
            <span
              {...rowheaderProps(item.id)}
              {...gridcellProps(item.id, 0)}
              style={{ paddingLeft: `${12 + (item.level - 1) * 18}px` }}
              className="flex min-w-0 items-center gap-1 py-2 pr-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
            >
              <span aria-hidden className="w-4 shrink-0 text-center text-stone-400">
                {item.hasChildren ? (item.expanded ? 'v' : '>') : ''}
              </span>
              <span className="truncate">{item.label}</span>
            </span>
            <span
              {...gridcellProps(item.id, 1)}
              className="px-3 py-2 text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
            >
              {String(ent.size ?? '')}
            </span>
            <span
              {...gridcellProps(item.id, 2)}
              className="px-3 py-2 text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
            >
              {String(ent.modified ?? '')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

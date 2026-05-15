import { useState } from 'react'
import { fromTree, type NormalizedData, type UiEvent } from '@interactive-os/aria-kernel'
import { gridAxis, useGridPattern } from '@interactive-os/aria-kernel/patterns'
import { axisKeys } from '@interactive-os/aria-kernel'

export const meta = {
  title: 'Grid · Sortable',
  apg: 'grid',
  kind: 'collection' as const,
  blurb: 'Click a column header to rotate ascending → descending → none; aria-sort reflects the state.',
  keys: () => axisKeys(gridAxis()),
}

interface Person { name: string; role: string; email: string }

const PEOPLE: Person[] = [
  { name: 'Alice', role: 'Engineer', email: 'alice@x.io' },
  { name: 'Bob', role: 'Designer', email: 'bob@x.io' },
  { name: 'Carol', role: 'Manager', email: 'carol@x.io' },
  { name: 'Dave', role: 'Engineer', email: 'dave@x.io' },
]

const COLS = [
  { id: 'h-name', key: 'name' as const, label: 'Name' },
  { id: 'h-role', key: 'role' as const, label: 'Role' },
  { id: 'h-email', key: 'email' as const, label: 'Email' },
]

interface Node { id: string; label: string; children?: Node[] }

function buildData(rows: Person[], sort: Record<string, 'ascending' | 'descending' | 'none'>): NormalizedData {
  const tree: Node[] = [
    ...COLS.map((c): Node => ({ id: c.id, label: c.label })),
    ...rows.map((p, i): Node => ({
      id: `r${i}`,
      label: p.name,
      children: [
        { id: `r${i}-name`, label: p.name },
        { id: `r${i}-role`, label: p.role },
        { id: `r${i}-email`, label: p.email },
      ],
    })),
  ]
  const data = fromTree(tree)
  for (const c of COLS) {
    data.entities[c.id] = { ...(data.entities[c.id] ?? {}), sort: sort[c.id] ?? 'none' }
  }
  return data
}

const rotate = (cur: 'ascending' | 'descending' | 'none'): 'ascending' | 'descending' | 'none' =>
  cur === 'none' ? 'ascending' : cur === 'ascending' ? 'descending' : 'none'

export default function GridSortableDemo() {
  const [sort, setSort] = useState<Record<string, 'ascending' | 'descending' | 'none'>>({})
  const [focus, setFocus] = useState<string | null>(null)
  const sortedRows = (() => {
    const activeCol = COLS.find((c) => sort[c.id] && sort[c.id] !== 'none')
    if (!activeCol) return PEOPLE
    const dir = sort[activeCol.id] === 'ascending' ? 1 : -1
    return [...PEOPLE].sort((a, b) => a[activeCol.key].localeCompare(b[activeCol.key]) * dir)
  })()
  const data = buildData(sortedRows, sort)
  if (focus) data.meta = { ...data.meta, focus }
  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && COLS.some((c) => c.id === e.id)) {
      setSort((s) => ({ ...s, [e.id]: rotate(s[e.id] ?? 'none') }))
      return
    }
    if (e.type === 'navigate' && e.id) setFocus(e.id)
  }
  const { rootProps, rowProps, columnHeaderProps, cellProps, rows } = useGridPattern(data, onEvent, {
    label: 'People',
    sortable: true,
    rowCount: PEOPLE.length + 1,
    colCount: COLS.length,
  })

  return (
    <div
      {...rootProps}
      className="w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-sm shadow-sm"
    >
      <div role="row" className="grid grid-cols-3 border-b border-stone-200 bg-stone-50 text-xs font-medium text-stone-600">
        {COLS.map((c) => {
          const dir = sort[c.id] ?? 'none'
          return (
            <span
              key={c.id}
              {...columnHeaderProps(c.id)}
              className="cursor-pointer select-none px-3 py-2 hover:bg-stone-200"
            >
              {c.label}
              <span aria-hidden className="ml-1 text-stone-400">
                {dir === 'ascending' ? '▲' : dir === 'descending' ? '▼' : ''}
              </span>
            </span>
          )
        })}
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          {...rowProps(row.id)}
          className="grid grid-cols-3 border-b border-stone-100 last:border-b-0 hover:bg-stone-50"
        >
          {row.cells.map((cell) => (
            <span
              key={cell.id}
              {...cellProps(cell.id)}
              className="px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
            >
              {cell.label}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

import { useState } from 'react'
import { fromTree, type UiEvent } from '@p/aria-kernel'
import { useGridPattern } from '@p/aria-kernel/patterns'

interface Node { id: string; label: string; children?: Node[] }

const ROWS: Node[] = [
  { id: 'r0', label: '1', children: [
    { id: 'r0-A', label: 'A1' }, { id: 'r0-B', label: 'B1' },
  ] },
  { id: 'r1', label: '2', children: [
    { id: 'r1-A', label: 'A2' }, { id: 'r1-B', label: 'B2' },
  ] },
]

export function GridEditStartDemo() {
  const [log, setLog] = useState<string[]>([])
  const data = fromTree(ROWS)

  const { rootProps, rowProps, cellProps, rows } = useGridPattern(data, (e: UiEvent) => {
    setLog((l) => [`${e.type}${'id' in e ? ' id=' + e.id : ''}`, ...l].slice(0, 6))
  }, { label: 'Edit-mode demo', rowCount: 2, colCount: 2, editable: true, selectionMode: 'cell' })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.4</span>
          Grid — activate vs editStart
        </h1>
        <p className="text-sm text-neutral-500">
          클릭은 <code>activate</code>, F2 는 <code>editStart</code>. consumer 가 둘을
          구분할 수 있어 *click 으로 편집 진입 사고* 방지.
        </p>
      </header>

      <div {...rootProps} className="border border-neutral-200 rounded overflow-hidden">
        {rows.map((row) => (
          <div key={row.id} {...rowProps(row.id)} className="flex">
            {row.cells.map((c) => (
              <button
                key={c.id}
                {...cellProps(c.id)}
                className="flex-1 px-3 py-2 text-sm border-r border-b border-neutral-100 text-left data-[focus-visible]:bg-neutral-100 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-neutral-900"
              >
                {c.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold">이벤트 로그</h2>
      <pre className="rounded bg-neutral-900 p-3 text-xs text-neutral-100 min-h-[8rem]">
        {log.length === 0 ? '(셀 클릭 또는 F2)' : log.join('\n')}
      </pre>
    </div>
  )
}

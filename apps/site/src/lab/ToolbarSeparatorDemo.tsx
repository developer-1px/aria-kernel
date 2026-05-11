import { useReducer, useMemo } from 'react'
import { fromList, reduceSingleSelect, type UiEvent } from '@p/aria-kernel'
import { useToolbarPattern } from '@p/aria-kernel/patterns'

const ITEMS = [
  { id: 'bold', label: 'B' },
  { id: 'italic', label: 'I' },
  { id: 'underline', label: 'U' },
  { id: 'sep1', label: '', separator: true },
  { id: 'left', label: '⇐' },
  { id: 'center', label: '⇔' },
  { id: 'right', label: '⇒' },
]

export function ToolbarSeparatorDemo() {
  const initial = useMemo(() => fromList(ITEMS), [])
  const [data, dispatch] = useReducer(reduceSingleSelect, initial)
  const { rootProps, toolbarItemProps, items } = useToolbarPattern(
    data, (e: UiEvent) => dispatch(e), { label: 'Format', autoFocus: true },
  )

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.17</span>
          Toolbar — separator skip + single tab stop
        </h1>
        <p className="text-sm text-neutral-500">
          APG /toolbar/ — separator 항목은 roving navigation 에서 skip,
          posinset/setsize 집계 제외. Tab 으로 toolbar 진입 = 첫 항목만 (single tab stop).
        </p>
      </header>

      <div {...rootProps} className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white p-1">
        {items.map((it) =>
          it.separator
            ? <span key={it.id} {...toolbarItemProps(it.id)} className="mx-1 inline-block h-5 w-px bg-neutral-300" />
            : <button
                key={it.id}
                {...toolbarItemProps(it.id)}
                className="rounded px-2 py-1 text-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {it.label}
              </button>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-400">←/→ 로 이동 — separator 건너뜀</p>
    </div>
  )
}

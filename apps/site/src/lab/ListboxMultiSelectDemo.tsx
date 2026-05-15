import { useReducer, useMemo } from 'react'
import { fromList, reduce, composeReducers, multiSelectToggle, type UiEvent } from '@interactive-os/aria-kernel'
import { useListboxPattern } from '@interactive-os/aria-kernel/patterns'

const listboxReducer = composeReducers(reduce, multiSelectToggle)

const ITEMS = [
  { id: 'apple', label: '사과' },
  { id: 'banana', label: '바나나' },
  { id: 'cherry', label: '체리' },
  { id: 'date', label: '대추' },
  { id: 'fig', label: '무화과' },
]

export function ListboxMultiSelectDemo() {
  const initial = useMemo(() => fromList(ITEMS), [])
  const [data, dispatch] = useReducer(listboxReducer, initial)
  const { rootProps, optionProps, items } = useListboxPattern(data, (e: UiEvent) => dispatch(e), {
    label: '과일', multiSelectable: true, autoFocus: true,
  })

  const selectedLabels = items.filter((i) => i.selected).map((i) => i.label).join(', ') || '(없음)'

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.9</span>
          Listbox — multiselect range/toggle
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — Shift+click 범위 vs Ctrl+click 토글 의미 implementation-defined.
          kernel 이 `multiSelect` axis 로 흡수.
        </p>
      </header>

      <ul {...rootProps} className="rounded border border-neutral-200 bg-white">
        {items.map((it) => (
          <li
            key={it.id}
            {...optionProps(it.id)}
            className="px-3 py-2 text-sm hover:bg-neutral-50 data-[selected=true]:bg-blue-50 data-[active]:outline data-[active]:outline-blue-400"
          >
            {it.label}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-neutral-500">선택: <strong>{selectedLabels}</strong></p>
      <p className="mt-1 text-xs text-neutral-400">
        Space=토글 · Shift+Click=범위 · Ctrl/Cmd+Click=개별 토글
      </p>
    </div>
  )
}

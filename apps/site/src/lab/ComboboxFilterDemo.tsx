import { useReducer, useMemo } from 'react'
import { fromList, reduceSingleSelect, type UiEvent } from '@p/aria-kernel'
import { useComboboxPattern } from '@p/aria-kernel/patterns'

const FRUITS = [
  { id: 'apple', label: 'Apple' },
  { id: 'apricot', label: 'Apricot' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'grape', label: 'Grape' },
  { id: 'kiwi', label: 'Kiwi' },
  { id: 'mango', label: 'Mango' },
]

export function ComboboxFilterDemo() {
  const initial = useMemo(() => fromList(FRUITS), [])
  const [data, dispatch] = useReducer(reduceSingleSelect, initial)
  const { comboboxProps, listboxProps, optionProps, items, expanded } =
    useComboboxPattern(data, (e: UiEvent) => dispatch(e), { label: '과일 검색', autocomplete: 'list' })

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.15</span>
          Combobox — list autocomplete filter
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — filter 알고리즘은 implementation-defined. kernel default = case-insensitive
          `label.includes(query)`. autoHighlightFirst·openOnFocus·closeOnBlurDelay 흡수.
        </p>
      </header>

      <div className="relative">
        <input
          {...comboboxProps}
          placeholder="과일 이름 타이핑..."
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <ul
          {...listboxProps}
          className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-auto rounded border border-neutral-200 bg-white shadow-lg"
        >
          {items.map((it) => (
            <li
              key={it.id}
              {...optionProps(it.id)}
              className="px-3 py-2 text-sm hover:bg-neutral-50 data-[active]:bg-blue-50"
            >
              {it.label}
            </li>
          ))}
          {expanded && items.length === 0 && (
            <li className="px-3 py-2 text-sm text-neutral-400">매칭 없음</li>
          )}
        </ul>
      </div>
      <p className="mt-2 text-xs text-neutral-400">"a" → Apple, Apricot, Banana, Grape, Mango (label includes "a")</p>
    </div>
  )
}

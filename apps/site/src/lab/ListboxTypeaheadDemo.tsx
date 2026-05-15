import type { UiEvent } from '@interactive-os/aria-kernel'
import { useListboxPattern, useListboxReducer } from '@interactive-os/aria-kernel/patterns'

const COUNTRIES = [
  { id: 'br', label: 'Brazil' },
  { id: 'ca', label: 'Canada' },
  { id: 'cn', label: 'China' },
  { id: 'de', label: 'Germany' },
  { id: 'fr', label: 'France' },
  { id: 'jp', label: 'Japan' },
  { id: 'kr', label: 'Korea' },
  { id: 'us', label: 'United States' },
]

export function ListboxTypeaheadDemo() {
  const [data, dispatch] = useListboxReducer(COUNTRIES)
  const { rootProps, optionProps, items } = useListboxPattern(
    data, (e: UiEvent) => dispatch(e), { label: '국가', autoFocus: true },
  )

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.13</span>
          Listbox — typeahead (printable keys)
        </h1>
        <p className="text-sm text-neutral-500">
          APG /listbox/ — printable 키 누적 buffer (500ms window) 로 prefix 매치 navigate.
          consumer 가 key 이벤트 처리 ❌.
        </p>
      </header>

      <ul {...rootProps} className="rounded border border-neutral-200 bg-white max-h-72 overflow-auto">
        {items.map((it) => (
          <li
            key={it.id}
            {...optionProps(it.id)}
            className="px-3 py-2 text-sm hover:bg-neutral-50 data-[focus-visible]:bg-blue-50 data-[selected=true]:bg-blue-100"
          >
            {it.label}
          </li>
        ))}
      </ul>

      <p className="mt-1 text-xs text-neutral-400">
        포커스 후 "j" → Japan, "ja" → Japan, "ko" → Korea 점프
      </p>
    </div>
  )
}

import type { UiEvent } from '@interactive-os/aria-kernel'
import { useMenuButtonPattern, useMenuButtonReducer } from '@interactive-os/aria-kernel/patterns'

const ITEMS = [
  { id: 'new', label: '새로 만들기' },
  { id: 'open', label: '열기' },
  { id: 'save', label: '저장' },
  { id: 'quit', label: '종료' },
]

export function MenuButtonOpenDemo() {
  const [data, dispatch] = useMenuButtonReducer(ITEMS)
  const { triggerProps, menuProps, itemProps, items, open } =
    useMenuButtonPattern(data, (e: UiEvent) => dispatch(e), { label: '파일' })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.19</span>
          MenuButton — open + focus 분기 (ArrowDown/Up/Enter)
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — trigger open 시 어떤 menuitem 에 focus 할지 implementation-defined.
          kernel: ArrowDown/Enter/Space → first, ArrowUp → last.
        </p>
      </header>

      <div className="relative inline-block">
        <button {...triggerProps} className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700">
          파일 ▾
        </button>
        <ul
          {...menuProps}
          className="absolute left-0 top-full mt-1 min-w-[10rem] rounded border border-neutral-200 bg-white p-1 shadow-lg"
          hidden={!open}
        >
          {items.map((it) => (
            <li
              key={it.id}
              {...itemProps(it.id)}
              className="rounded px-3 py-1.5 text-sm hover:bg-neutral-100 data-[active]:bg-neutral-100"
            >
              {it.label}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-neutral-400">trigger focus 후 ↓ = 첫 항목 · ↑ = 마지막 항목 · Enter = 첫 항목</p>
    </div>
  )
}

import { useReducer, useMemo } from 'react'
import { fromList, composeReducers, reduce, singleCurrent, type UiEvent } from '@interactive-os/aria-kernel'
import { navigationListPattern } from '@interactive-os/aria-kernel/patterns'

const PAGES = [
  { id: 'home', label: '홈', href: '#/home', current: true },
  { id: 'docs', label: '문서', href: '#/docs' },
  { id: 'about', label: '소개', href: '#/about' },
]

const navReducer = composeReducers(reduce, singleCurrent)

export function NavigationListDemo() {
  const initial = useMemo(() => fromList(PAGES), [])
  const [data, dispatch] = useReducer(navReducer, initial)
  const { rootProps, linkProps, items } = navigationListPattern(
    data, (e: UiEvent) => dispatch(e), { label: '메인 네비게이션' },
  )

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.21</span>
          NavigationList — aria-current="page"
        </h1>
        <p className="text-sm text-neutral-500">
          Listbox 안티패턴 차단 — sidebar 는 navigation landmark + a[aria-current="page"].
          selected 가 아닌 current 가 SSOT. singleCurrent host reducer.
        </p>
      </header>

      <nav {...rootProps} className="rounded border border-neutral-200 bg-white">
        {items.map((it) => (
          <a
            key={it.id}
            {...linkProps(it.id)}
            className="block px-3 py-2 text-sm hover:bg-neutral-50 data-[current]:bg-blue-50 data-[current]:font-medium data-[current]:text-blue-700"
          >
            {it.label}
          </a>
        ))}
      </nav>
      <p className="mt-3 text-xs text-neutral-400">클릭 시 aria-current="page" 한 항목으로 이동</p>
    </div>
  )
}

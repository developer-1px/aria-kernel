import { useMemo, type ComponentPropsWithoutRef } from 'react'
import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useToolbarPattern } from '@interactive-os/aria-kernel/patterns'
import type { ViewMode } from '../entities/types'

const VIEW_ITEMS = [
  { id: 'icons',   label: '아이콘' },
  { id: 'list',    label: '목록' },
  { id: 'columns', label: '컬럼' },
  { id: 'gallery', label: '갤러리' },
]

const titleOf = (path: string) => path.split('/').filter(Boolean).pop() ?? 'root'

export function TitleBar({
  path, onBack, canBack, view, onViewChange,
}: {
  path: string
  onBack: () => void
  canBack: boolean
  view: ViewMode
  onViewChange: (v: ViewMode) => void
}) {
  const name = titleOf(path)
  const data = useMemo(
    () => fromList(VIEW_ITEMS.map((it) => ({ ...it, pressed: view === it.id }))),
    [view],
  )
  const dispatch = (e: UiEvent) => {
    if (e.type === 'activate') onViewChange(e.id as ViewMode)
  }
  const { rootProps, toolbarItemProps, items } = useToolbarPattern(data, dispatch)

  return (
    <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2">
      <div aria-label="창 컨트롤" className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
      </div>
      <button
        type="button"
        onClick={onBack}
        aria-disabled={!canBack || undefined}
        aria-label="뒤로"
        className="px-2 py-1 text-neutral-700 disabled:text-neutral-300"
      >‹</button>
      <button type="button" aria-disabled aria-label="앞으로" className="px-2 py-1 text-neutral-300">›</button>
      <h1 className="flex-1 truncate text-sm font-medium text-neutral-900">{name}</h1>
      <div
        {...(rootProps as ComponentPropsWithoutRef<'div'>)}
        aria-label="뷰 모드"
        className="inline-flex items-center rounded border border-neutral-200 bg-neutral-50 p-0.5"
      >
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            {...(toolbarItemProps(it.id) as ComponentPropsWithoutRef<'button'>)}
            className={
              'px-2 py-1 text-xs ' +
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ' +
              (it.selected ? 'rounded bg-white text-neutral-900 shadow-sm' : 'text-neutral-500')
            }
          >
            {it.label}
          </button>
        ))}
      </div>
    </header>
  )
}

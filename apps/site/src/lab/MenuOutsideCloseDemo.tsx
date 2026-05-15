import { useMemo, useState } from 'react'
import { fromList, type UiEvent } from '@interactive-os/aria-kernel'
import { useMenuPattern } from '@interactive-os/aria-kernel/patterns'

const ITEMS = [
  { id: 'cut', label: '잘라내기' },
  { id: 'copy', label: '복사' },
  { id: 'paste', label: '붙여넣기' },
]

export function MenuOutsideCloseDemo() {
  const [open, setOpen] = useState(false)
  const data = useMemo(() => fromList(ITEMS), [])

  const { rootProps, menuitemProps, items } = useMenuPattern(data, (e: UiEvent) => {
    if (e.type === 'activate') setOpen(false)
  }, {
    label: '편집', open, autoFocus: true,
    onEscape: () => setOpen(false),
    onInteractOutside: () => setOpen(false),
  })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.3</span>
          Menu — onInteractOutside
        </h1>
        <p className="text-sm text-neutral-500">
          외부 클릭 시 자동 닫힘. consumer 는 <code>document.addEventListener</code>
          를 손으로 안 부착.
        </p>
      </header>

      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
      >
        {open ? '메뉴 닫기' : '메뉴 열기'}
      </button>

      <div className="mt-4 relative inline-block">
        <div
          {...rootProps}
          className="absolute left-0 top-0 min-w-[10rem] rounded border border-neutral-200 bg-white p-1 shadow-lg"
        >
          {items.map((it) => (
            <button
              key={it.id}
              {...menuitemProps(it.id)}
              className="block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-neutral-100 data-[active]:bg-neutral-100"
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-32 text-xs text-neutral-400">
        ← 메뉴 밖 영역. 클릭하면 메뉴가 닫힌다.
      </p>
    </div>
  )
}

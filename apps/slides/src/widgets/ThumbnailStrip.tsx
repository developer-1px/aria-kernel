import { fromList, useRovingTabIndex, composeAxes, navigate, activate, type UiEvent } from '@interactive-os/aria-kernel'
import type { Slide } from '../entities/schema'

const axis = composeAxes(navigate('horizontal'), activate)

/** 썸네일 필름스트립 — 16:9 미니 카드 N장. ←/→ + Home/End + Enter/Space + click 으로 점프. */
export function ThumbnailStrip({
  slides, activeIndex, onJump,
}: { slides: Slide[]; activeIndex: number; onJump: (i: number) => void }) {
  const data = fromList(
    slides.map((s, i) => ({
      id: String(i),
      label: `${i + 1}`,
      title: firstHeading(s.source),
      selected: i === activeIndex,
    })),
  )
  const onEvent = (e: UiEvent) => {
    if (e.type === 'activate' && typeof e.id === 'string') {
      const i = Number(e.id)
      if (Number.isInteger(i) && i >= 0 && i < slides.length) onJump(i)
    }
  }
  const { focusId, bindFocus, delegate } = useRovingTabIndex(axis, data, onEvent)

  return (
    <nav aria-label="슬라이드 썸네일">
      <ul
        role="listbox"
        aria-label="썸네일"
        {...delegate}
        className="m-0 flex list-none flex-row gap-2 overflow-x-auto p-0 py-1"
      >
        {slides.map((_, i) => {
          const id = String(i)
          const focused = id === focusId
          const selected = i === activeIndex
          return (
            <li
              key={id}
              role="option"
              data-id={id}
              tabIndex={focused ? 0 : -1}
              aria-selected={selected}
              ref={bindFocus(id)}
              className={
                'aspect-video w-24 flex-none cursor-pointer rounded border bg-white px-2 py-1 ' +
                'flex items-start text-xs leading-tight ' +
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ' +
                (selected
                  ? 'border-neutral-900 text-neutral-900 shadow-[0_0_0_1px_currentColor]'
                  : 'border-neutral-200 text-neutral-500')
              }
            >
              {i + 1}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function firstHeading(src: string): string {
  for (const line of src.split('\n')) {
    const m = line.match(/^#+\s+(.+)/)
    if (m) return m[1].trim()
    const t = line.trim()
    if (t.length > 0) return t.slice(0, 40)
  }
  return ''
}

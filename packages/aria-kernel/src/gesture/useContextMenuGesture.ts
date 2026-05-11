import type { MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'

export interface ContextMenuGestureOptions<TId = unknown> {
  /** id 가 없는 단일 대상 모드면 TId = void 로. getHandlers 모드면 id 가 함께 전달. */
  onOpen: (id: TId, x: number, y: number, target: EventTarget | null) => void
  enabled?: boolean
}

const isContextMenuChord = (e: { key: string; shiftKey: boolean }): boolean =>
  e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)

/**
 * useContextMenuGesture — `contextmenu` + `Shift+F10`/`ContextMenu` 키를 단일 `onOpen` 으로 흡수.
 *
 * **단일 대상 모드** — `onContextMenu`/`onKeyDown` 을 직접 spread:
 *   const { onContextMenu, onKeyDown } = useContextMenuGesture<void>({ onOpen: (_, x, y) => ... })
 *   <div onContextMenu={onContextMenu} onKeyDown={onKeyDown} tabIndex={0}>...</div>
 *
 * **항목당 모드** — `getHandlers(id)` factory 로 hook 1회 + N개 핸들러 (#156):
 *   const ctx = useContextMenuGesture<string>({ onOpen: (id, x, y) => openMenu(id, x, y) })
 *   {items.map(it => <div role="gridcell" {...ctx.getHandlers(it.id)} />)}
 *
 * 키보드 진입 시 좌표는 target.getBoundingClientRect() 좌상단.
 * 출처: W3C UI Events `contextmenu` + Keyboard.
 */
export function useContextMenuGesture<TId = void>(opts: ContextMenuGestureOptions<TId>): {
  onContextMenu: (e: ReactMouseEvent) => void
  onKeyDown: (e: ReactKeyboardEvent) => void
  getHandlers: (id: TId) => {
    onContextMenu: (e: ReactMouseEvent) => void
    onKeyDown: (e: ReactKeyboardEvent) => void
  }
} {
  const { onOpen, enabled = true } = opts

  const makeHandlers = (id: TId) => ({
    onContextMenu: (e: ReactMouseEvent) => {
      if (!enabled) return
      e.preventDefault()
      onOpen(id, e.clientX, e.clientY, e.currentTarget)
    },
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (!enabled) return
      if (!isContextMenuChord(e)) return
      e.preventDefault()
      const el = e.currentTarget as Element | null
      const rect = el?.getBoundingClientRect?.()
      onOpen(id, rect?.left ?? 0, rect?.top ?? 0, el)
    },
  })

  const defaultHandlers = makeHandlers(undefined as TId)
  return {
    onContextMenu: defaultHandlers.onContextMenu,
    onKeyDown: defaultHandlers.onKeyDown,
    getHandlers: makeHandlers,
  }
}

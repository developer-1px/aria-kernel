import type { MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'

/**
 * useContextMenuGesture — `contextmenu` 이벤트 + `Shift+F10`/`ContextMenu` 키를
 * 단일 `onOpen(x, y, target)` 콜백으로 흡수. APG Menu 패턴의 trigger 자리.
 *
 * 키보드 진입 시 좌표는 `target.getBoundingClientRect()` 의 좌상단 (rect.left, rect.top).
 * 출처: W3C UI Events `contextmenu` + Keyboard.
 *
 * @example
 *   const { onContextMenu, onKeyDown } = useContextMenuGesture({
 *     onOpen: (x, y, target) => openMenu({ x, y, target }),
 *   })
 *   <div onContextMenu={onContextMenu} onKeyDown={onKeyDown} tabIndex={0}>...</div>
 */
export interface ContextMenuGestureOptions {
  onOpen: (x: number, y: number, target: EventTarget | null) => void
  enabled?: boolean
}

const isContextMenuChord = (e: { key: string; shiftKey: boolean }): boolean =>
  e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)

export function useContextMenuGesture(opts: ContextMenuGestureOptions): {
  onContextMenu: (e: ReactMouseEvent) => void
  onKeyDown: (e: ReactKeyboardEvent) => void
} {
  const { onOpen, enabled = true } = opts
  return {
    onContextMenu: (e: ReactMouseEvent) => {
      if (!enabled) return
      e.preventDefault()
      onOpen(e.clientX, e.clientY, e.currentTarget)
    },
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (!enabled) return
      if (!isContextMenuChord(e)) return
      e.preventDefault()
      const el = e.currentTarget as Element | null
      const rect = el?.getBoundingClientRect?.()
      onOpen(rect?.left ?? 0, rect?.top ?? 0, el)
    },
  }
}

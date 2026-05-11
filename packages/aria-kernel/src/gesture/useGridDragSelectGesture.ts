import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { gridRectEvents } from '../axes/gridMultiSelect'
import type { NormalizedData, UiEvent } from '../types'

/**
 * useGridDragSelectGesture — mousedown → mouseenter loop → mouseup 라이프사이클로
 * 2D grid 영역 드래그 선택을 emit. chord 로 표현 불가능한 lifecycle gesture (#149/#153).
 *
 * 어휘 정합: 키보드 Shift+Arrow / Shift+Click 와 같은 `select` UiEvent (rect in/out) 발생.
 * 결과 reducer 정합 동일.
 *
 * - mousedown(id) → `navigate(id)` + `select([id], anchor=true, to=true)`
 * - mouseenter(id) while dragging → `gridRectEvents(d, anchor, id)`
 * - mouseup → 종료
 *
 * @example useGridPattern 내부 합성
 *   const drag = useGridDragSelectGesture(data, dispatch)
 *   // cellProps(id) 에 ...drag.getCellHandlers(id) spread
 */
export function useGridDragSelectGesture(
  data: NormalizedData,
  dispatch: (e: UiEvent) => void,
): {
  getCellHandlers: (id: string) => {
    onMouseDown: (e: ReactMouseEvent) => void
    onMouseEnter: (e: ReactMouseEvent) => void
  }
} {
  const draggingRef = useRef<{ anchorId: string } | null>(null)

  useEffect(() => {
    const onUp = () => { draggingRef.current = null }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  return {
    getCellHandlers: (id: string) => ({
      onMouseDown: (e: ReactMouseEvent) => {
        e.preventDefault?.()
        draggingRef.current = { anchorId: id }
        dispatch({ type: 'navigate', id })
        dispatch({ type: 'select', ids: [id], anchor: true, to: true })
      },
      onMouseEnter: (_e: ReactMouseEvent) => {
        const drag = draggingRef.current
        if (!drag) return
        if (drag.anchorId === id) return
        const events = gridRectEvents(data, drag.anchorId, id)
        for (const ev of events) dispatch(ev)
      },
    }),
  }
}

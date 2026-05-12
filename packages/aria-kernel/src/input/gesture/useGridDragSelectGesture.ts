import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { gridRectEvents } from '../keyboard/axes/gridMultiSelect'
import type { NormalizedData, UiEvent } from '../../intent/events'

/**
 * useGridDragSelectGestureRaw — generic drag-select lifecycle (#157).
 *
 * NormalizedData / UiEvent 의존 ❌. anchor id 와 head id 만으로 mousedown → mouseenter → mouseup
 * 라이프사이클을 노출. rect 산출/dispatch 는 소비자 책임 — useGridPattern 자체 모델 둘 다 지원.
 *
 * - mousedown(id) → `onAnchorChange(id)`
 * - mouseenter(id) while dragging → `onRectChange(anchorId, id)` (id !== anchor 일 때만)
 * - mouseup → 종료
 *
 * @example 자체 selection state 소비자
 *   const drag = useGridDragSelectGestureRaw({
 *     onAnchorChange: (id) => { setFocusId(id); setSelectedIds([id]) },
 *     onRectChange: (anchor, head) => setSelectedIds(rangeIds(anchor, head)),
 *   })
 */
export function useGridDragSelectGestureRaw(opts: {
  onAnchorChange: (id: string) => void
  onRectChange: (anchorId: string, headId: string) => void
}): {
  getCellHandlers: (id: string) => {
    onMouseDown: (e: ReactMouseEvent) => void
    onMouseEnter: (e: ReactMouseEvent) => void
  }
} {
  const { onAnchorChange, onRectChange } = opts
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
        onAnchorChange(id)
      },
      onMouseEnter: (_e: ReactMouseEvent) => {
        const drag = draggingRef.current
        if (!drag) return
        if (drag.anchorId === id) return
        onRectChange(drag.anchorId, id)
      },
    }),
  }
}

/**
 * useGridDragSelectGesture — NormalizedData/dispatch 바인딩 wrapper. useGridPattern 소비자용.
 *
 * 키보드 Shift+Arrow / Shift+Click 와 같은 `select` UiEvent (rect in/out) 발생 — reducer 정합 동일.
 * 자체 selection state 소비자는 generic `useGridDragSelectGestureRaw` 사용 (#157).
 *
 * @example useGridPattern 내부 합성 (자동 부착됨)
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
  return useGridDragSelectGestureRaw({
    onAnchorChange: (id) => {
      dispatch({ type: 'navigate', id })
      dispatch({ type: 'select', ids: [id], anchor: true, to: true })
    },
    onRectChange: (anchorId, headId) => {
      const events = gridRectEvents(data, anchorId, headId)
      for (const ev of events) dispatch(ev)
    },
  })
}

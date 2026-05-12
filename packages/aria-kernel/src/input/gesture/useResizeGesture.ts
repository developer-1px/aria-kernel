import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'

export interface ResizeGestureOptions {
  axis: 'x' | 'y'
  initial: () => number
  /** live overlay 용. 매 mousemove 호출, commit 아님. */
  onChange: (next: number) => void
  /** mouseup 1 회. zod-crud · redux undo 처럼 "1 undo per drag" 가 필요한 소비자용 commit slot. (#155) */
  onEnd?: (final: number) => void
  min?: number
  max?: number
}

interface DragState {
  startCoord: number
  startValue: number
}

/**
 * useResizeGesture — splitter / column-header drag-resize.
 * mousedown → window mousemove/mouseup lifecycle 자동 관리. cleanup 보장.
 *
 * @example column width resize
 *   const { handleProps } = useResizeGesture({
 *     axis: 'x', initial: () => widthOf(col),
 *     onChange: (w) => setWidth(col, w), min: 20, max: 600,
 *   })
 *   <div {...handleProps} role="separator" />
 */
export function useResizeGesture(opts: ResizeGestureOptions): {
  handleProps: { onMouseDown: (e: ReactMouseEvent) => void }
} {
  const { axis, initial, onChange, onEnd, min = -Infinity, max = Infinity } = opts
  const dragRef = useRef<DragState | null>(null)
  const lastValueRef = useRef<number | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const s = dragRef.current
      if (!s) return
      const coord = axis === 'x' ? e.clientX : e.clientY
      const next = Math.min(Math.max(s.startValue + (coord - s.startCoord), min), max)
      lastValueRef.current = next
      onChange(next)
    }
    const onUp = () => {
      const dragging = dragRef.current != null
      dragRef.current = null
      if (dragging && lastValueRef.current != null) {
        onEnd?.(lastValueRef.current)
      }
      lastValueRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [axis, onChange, onEnd, min, max])

  return {
    handleProps: {
      onMouseDown: (e: ReactMouseEvent) => {
        e.preventDefault?.()
        dragRef.current = {
          startCoord: axis === 'x' ? e.clientX : e.clientY,
          startValue: initial(),
        }
      },
    },
  }
}

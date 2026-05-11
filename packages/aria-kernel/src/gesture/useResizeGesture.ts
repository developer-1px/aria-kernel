import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'

export interface ResizeGestureOptions {
  axis: 'x' | 'y'
  initial: () => number
  onChange: (next: number) => void
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
  const { axis, initial, onChange, min = -Infinity, max = Infinity } = opts
  const dragRef = useRef<DragState | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const s = dragRef.current
      if (!s) return
      const coord = axis === 'x' ? e.clientX : e.clientY
      const next = Math.min(Math.max(s.startValue + (coord - s.startCoord), min), max)
      onChange(next)
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [axis, onChange, min, max])

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

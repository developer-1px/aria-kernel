import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

export interface FillHandleGestureOptions<T> {
  onCommit: (source: T, target: T) => void
  equals?: (a: T, b: T) => boolean
}

/**
 * useFillHandleGesture — Excel/Sheets fill handle 드래그 lifecycle.
 *
 * **lab — stability 약속 없음.** W3C/ARIA spec 출처 없는 de facto 위젯이라 lab 영역.
 * de facto 수렴 증거 누적 시 graduate.
 *
 * 라이프사이클:
 *   - mousedown on handle → preview = source, drag 활성
 *   - setTarget(t) (소비자가 cell hover 시 호출) → preview = t
 *   - mouseup → onCommit(source, target) (target !== source 일 때만), preview = null
 *
 * @example spreadsheet 셀
 *   const fill = useFillHandleGesture<Rect>({
 *     onCommit: (src, tgt) => applyFill(src, tgt),
 *   })
 *   <div {...fill.handleProps(currentSelectionRect)} />  // fill handle (셀 우하단)
 *   <div onMouseEnter={() => fill.setTarget(cellRectAt(id))}>...</div>
 */
export function useFillHandleGesture<T>(opts: FillHandleGestureOptions<T>): {
  preview: T | null
  handleProps: (source: T) => { onMouseDown: (e: ReactMouseEvent) => void }
  setTarget: (target: T) => void
} {
  const { onCommit, equals = Object.is } = opts
  const [preview, setPreview] = useState<T | null>(null)
  const sourceRef = useRef<T | null>(null)
  const targetRef = useRef<T | null>(null)

  useEffect(() => {
    const onUp = () => {
      const src = sourceRef.current
      const tgt = targetRef.current
      sourceRef.current = null
      targetRef.current = null
      setPreview(null)
      if (src != null && tgt != null && !equals(src, tgt)) {
        onCommit(src, tgt)
      }
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [onCommit, equals])

  const handleProps = useCallback(
    (source: T) => ({
      onMouseDown: (e: ReactMouseEvent) => {
        e.preventDefault?.()
        sourceRef.current = source
        targetRef.current = source
        setPreview(source)
      },
    }),
    [],
  )

  const setTarget = useCallback((target: T) => {
    if (sourceRef.current == null) return
    targetRef.current = target
    setPreview(target)
  }, [])

  return { preview, handleProps, setTarget }
}

import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react'
import type { NormalizedData, UiEvent } from '../types'

/** drop position relative to the hovered item — same vocabulary as zod-crud `move` mode. */
export type ReorderPosition = 'before' | 'after' | 'inside'

/**
 * useReorderDnDGestureRaw — generic HTML5 native drag-and-drop reorder lifecycle (#165).
 *
 * NormalizedData / UiEvent 의존 ❌. dragged id 와 hovered id + drop position 만으로
 * dragstart → dragover → drop 라이프사이클을 노출. dispatch / store wiring 은 소비자 책임 —
 * useListbox/useTreePattern 자체 모델 또는 외부 store 둘 다 지원.
 *
 * Drop position 결정 — listbox(reorder only): hovered item bounding box 의 Y 중점 기준
 * 위면 'before', 아래면 'after'. tree(중첩 허용): 상/하 1/4 zone 은 before/after, 중앙 1/2 는 'inside'.
 * `allowInside` 옵션으로 토글 (default false = listbox semantic).
 *
 * - dragstart(id) → `onDragStart(id)`
 * - dragover(id) while dragging → `onDragOver(draggedId, overId, position)` (id !== draggedId 일 때만)
 * - drop(id) → `onDrop(draggedId, overId, position)` 또는 자기 자신 drop 시 호출 ❌
 * - dragend → 종료
 *
 * @example 자체 store 소비자
 *   const drag = useReorderDnDGestureRaw({
 *     onDrop: (from, to, pos) => store.move(from, to, pos),
 *   })
 *   // <li {...drag.getItemHandlers(id)} />
 */
export interface ReorderDnDGestureRawOptions {
  onDragStart?: (id: string) => void
  onDragOver?: (draggedId: string, overId: string, position: ReorderPosition) => void
  onDrop?: (draggedId: string, overId: string, position: ReorderPosition) => void
  onDragEnd?: () => void
  /** allow 'inside' position (tree-style nesting). default false. */
  allowInside?: boolean
  /** dataTransfer MIME — 외부 source/target 격리에 사용. default `application/x-aria-kernel-reorder`. */
  mime?: string
}

const DEFAULT_MIME = 'application/x-aria-kernel-reorder'

function computePosition(
  e: ReactDragEvent,
  allowInside: boolean,
): ReorderPosition {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const y = e.clientY - rect.top
  const h = rect.height || 1
  if (allowInside) {
    if (y < h * 0.25) return 'before'
    if (y > h * 0.75) return 'after'
    return 'inside'
  }
  return y < h / 2 ? 'before' : 'after'
}

export interface ReorderItemHandlers {
  draggable: true
  onDragStart: (e: ReactDragEvent) => void
  onDragOver: (e: ReactDragEvent) => void
  onDrop: (e: ReactDragEvent) => void
  onDragEnd: (e: ReactDragEvent) => void
}

export function useReorderDnDGestureRaw(opts: ReorderDnDGestureRawOptions = {}): {
  getItemHandlers: (id: string) => ReorderItemHandlers
  draggingId: string | null
  overId: string | null
  overPosition: ReorderPosition | null
} {
  const { onDragStart, onDragOver, onDrop, onDragEnd, allowInside = false, mime = DEFAULT_MIME } = opts
  const draggingRef = useRef<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [overPosition, setOverPosition] = useState<ReorderPosition | null>(null)

  useEffect(() => {
    const reset = () => {
      draggingRef.current = null
      setDraggingId(null)
      setOverId(null)
      setOverPosition(null)
    }
    window.addEventListener('dragend', reset)
    window.addEventListener('drop', reset)
    return () => {
      window.removeEventListener('dragend', reset)
      window.removeEventListener('drop', reset)
    }
  }, [])

  return {
    draggingId,
    overId,
    overPosition,
    getItemHandlers: (id: string): ReorderItemHandlers => ({
      draggable: true,
      onDragStart: (e) => {
        draggingRef.current = id
        setDraggingId(id)
        try {
          e.dataTransfer.setData(mime, id)
          e.dataTransfer.effectAllowed = 'move'
        } catch {/* jsdom 등 dataTransfer 미지원 환경 */}
        onDragStart?.(id)
      },
      onDragOver: (e) => {
        const dragged = draggingRef.current
        if (!dragged) return
        if (dragged === id) return
        e.preventDefault?.()
        try { e.dataTransfer.dropEffect = 'move' } catch {/* noop */}
        const pos = computePosition(e, allowInside)
        setOverId(id)
        setOverPosition(pos)
        onDragOver?.(dragged, id, pos)
      },
      onDrop: (e) => {
        const dragged = draggingRef.current
        if (!dragged) return
        if (dragged === id) return
        e.preventDefault?.()
        const pos = computePosition(e, allowInside)
        onDrop?.(dragged, id, pos)
        draggingRef.current = null
        setDraggingId(null)
        setOverId(null)
        setOverPosition(null)
      },
      onDragEnd: () => {
        draggingRef.current = null
        setDraggingId(null)
        setOverId(null)
        setOverPosition(null)
        onDragEnd?.()
      },
    }),
  }
}

/** ReorderPosition → UiEvent move mode (W3C / zod-crud 어휘). */
export const positionToMoveMode = (pos: ReorderPosition): 'sibling-before' | 'sibling-after' | 'child' =>
  pos === 'before' ? 'sibling-before' : pos === 'after' ? 'sibling-after' : 'child'

export interface ReorderDnDGestureOptions {
  /** allow 'inside' drop (tree nesting). default false. */
  allowInside?: boolean
  /** dataTransfer MIME. */
  mime?: string
}

/**
 * useReorderDnDGesture — NormalizedData/dispatch 바인딩 wrapper. useListboxPattern/useTreePattern 소비자용 (#165).
 *
 * Drop 시 `{ type: 'move', id: draggedId, targetId: overId, mode: 'sibling-before'|'sibling-after'|'child' }`
 * UiEvent emit — tree reducer 가 이미 흡수하는 어휘 (axes/reducers `move` op). 소비자가 onEvent 에서
 * zod-crud `commands.move` 또는 자체 store mutation 으로 라우팅.
 *
 * grid 의 useGridDragSelectGesture 와 같은 결 — gesture 는 activate 단발 emit, 비즈니스 의미는
 * UiEvent 어휘 그대로 reducer 또는 store 가 흡수 (memory: feedback_gesture_intent_split).
 *
 * @example listbox reorder
 *   const drag = useReorderDnDGesture(data, dispatch)
 *   // <li {...optionProps(id)} {...drag.getItemHandlers(id)} />
 *
 * @example tree reorder + nesting
 *   const drag = useReorderDnDGesture(data, dispatch, { allowInside: true })
 */
export function useReorderDnDGesture(
  _data: NormalizedData,
  dispatch: (e: UiEvent) => void,
  opts: ReorderDnDGestureOptions = {},
): {
  getItemHandlers: (id: string) => ReorderItemHandlers
  draggingId: string | null
  overId: string | null
  overPosition: ReorderPosition | null
} {
  return useReorderDnDGestureRaw({
    allowInside: opts.allowInside,
    mime: opts.mime,
    onDrop: (from, to, pos) => {
      dispatch({ type: 'move', id: from, targetId: to, mode: positionToMoveMode(pos) })
    },
  })
}

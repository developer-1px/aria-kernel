import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { NormalizedData, UiEvent } from '../intent/events'

/**
 * useKeyboardDndGesture — APG-conformant keyboard drag-and-drop primitive (#168).
 *
 * APG keyboard DnD vocabulary (https://www.w3.org/WAI/ARIA/apg/patterns/):
 *   - Space          → lift (idle → lifted)  / drop (lifted → idle, commit)
 *   - Enter          → drop (lifted → idle, commit)
 *   - ArrowUp/Down   → move (axis 'vertical')
 *   - ArrowLeft/Right→ move (axis 'horizontal')
 *   - Home / End     → first / last
 *   - Escape         → cancel (lifted → idle, no commit)
 *
 * 상태머신 + aria-grabbed + aria-live announcement 은 primitive 내부에 흡수.
 * 소비자는 items / axis / onCommit / announce 만 제공. gesture 는 activate 단발 emit —
 * onCommit({from, to}) 는 drop 한 번에만 호출 (memory: feedback_gesture_intent_split).
 *
 * @example
 *   const dnd = useKeyboardDndGestureRaw({
 *     items,
 *     axis: 'vertical',
 *     onCommit: ({ from, to }) => store.move(from, to),
 *     announce: (msg) => liveRef.current?.say(msg),
 *   })
 *   // <li {...dnd.handleProps(id)} />
 */

export type KeyboardDndAxis = 'vertical' | 'horizontal'
export type KeyboardDndState = 'idle' | 'lifted'

export interface KeyboardDndCommit {
  from: number
  to: number
  fromId: string
  toId: string
}

export interface KeyboardDndMessages {
  /** announced on lift. default: `Lifted item at position ${index+1} of ${total}` */
  lifted: (index: number, total: number, id: string) => string
  /** announced on each move. default: `Moved to position ${to+1} of ${total}` */
  moved: (from: number, to: number, total: number, id: string) => string
  /** announced on commit drop. default: `Dropped at position ${to+1}. Item moved from position ${from+1} to ${to+1}.` */
  dropped: (from: number, to: number, total: number, id: string) => string
  /** announced on cancel. default: `Cancelled. Returned to position ${index+1}.` */
  cancelled: (index: number, total: number, id: string) => string
}

const DEFAULT_MESSAGES: KeyboardDndMessages = {
  lifted: (i, total) => `Lifted item at position ${i + 1} of ${total}.`,
  moved: (_from, to, total) => `Moved to position ${to + 1} of ${total}.`,
  dropped: (from, to) => `Item moved from position ${from + 1} to ${to + 1}.`,
  cancelled: (i) => `Cancelled. Returned to position ${i + 1}.`,
}

export interface KeyboardDndGestureRawOptions {
  /** Ordered list of item ids — index order defines positions. */
  items: readonly string[]
  /** Arrow axis. default 'vertical'. */
  axis?: KeyboardDndAxis
  /** Commit emit — fired exactly once per successful drop. */
  onCommit?: (op: KeyboardDndCommit) => void
  /** Live region announcer. Strings come from `messages` (i18n override slot). */
  announce?: (msg: string) => void
  /** i18n override for announcement strings. Partial — missing keys fall back to defaults. */
  messages?: Partial<KeyboardDndMessages>
}

export interface KeyboardDndItemProps {
  onKeyDown: (e: ReactKeyboardEvent) => void
  'aria-grabbed': boolean | undefined
  tabIndex: number
}

export interface KeyboardDndGestureResult {
  state: KeyboardDndState
  /** id currently lifted, or null. */
  liftedId: string | null
  /** current target position index while lifted (where drop would land). */
  targetIndex: number | null
  handleProps: (id: string) => KeyboardDndItemProps
}

const isPrevKey = (key: string, axis: KeyboardDndAxis): boolean =>
  axis === 'vertical' ? key === 'ArrowUp' : key === 'ArrowLeft'
const isNextKey = (key: string, axis: KeyboardDndAxis): boolean =>
  axis === 'vertical' ? key === 'ArrowDown' : key === 'ArrowRight'

export function useKeyboardDndGestureRaw(
  opts: KeyboardDndGestureRawOptions,
): KeyboardDndGestureResult {
  const { items, axis = 'vertical', onCommit, announce } = opts
  const messages: KeyboardDndMessages = { ...DEFAULT_MESSAGES, ...opts.messages }

  const [liftedId, setLiftedId] = useState<string | null>(null)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const fromIndexRef = useRef<number | null>(null)

  const say = useCallback(
    (msg: string) => { announce?.(msg) },
    [announce],
  )

  const handleKeyDown = useCallback(
    (id: string, e: ReactKeyboardEvent) => {
      const total = items.length
      const idx = items.indexOf(id)
      if (idx < 0) return

      // idle: only Space lifts.
      if (liftedId === null) {
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault()
          fromIndexRef.current = idx
          setLiftedId(id)
          setTargetIndex(idx)
          say(messages.lifted(idx, total, id))
        }
        return
      }

      // Only the lifted item drives the state machine.
      if (liftedId !== id) return
      const from = fromIndexRef.current ?? idx
      const cur = targetIndex ?? idx

      if (e.key === 'Escape') {
        e.preventDefault()
        setLiftedId(null)
        setTargetIndex(null)
        say(messages.cancelled(from, total, id))
        fromIndexRef.current = null
        return
      }

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        if (cur !== from) {
          onCommit?.({ from, to: cur, fromId: id, toId: items[cur] ?? id })
        }
        say(messages.dropped(from, cur, total, id))
        setLiftedId(null)
        setTargetIndex(null)
        fromIndexRef.current = null
        return
      }

      if (isPrevKey(e.key, axis)) {
        e.preventDefault()
        const next = Math.max(0, cur - 1)
        if (next !== cur) {
          setTargetIndex(next)
          say(messages.moved(cur, next, total, id))
        }
        return
      }
      if (isNextKey(e.key, axis)) {
        e.preventDefault()
        const next = Math.min(total - 1, cur + 1)
        if (next !== cur) {
          setTargetIndex(next)
          say(messages.moved(cur, next, total, id))
        }
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        if (cur !== 0) {
          setTargetIndex(0)
          say(messages.moved(cur, 0, total, id))
        }
        return
      }
      if (e.key === 'End') {
        e.preventDefault()
        const last = total - 1
        if (cur !== last) {
          setTargetIndex(last)
          say(messages.moved(cur, last, total, id))
        }
        return
      }
    },
    [items, axis, liftedId, targetIndex, onCommit, say, messages],
  )

  const handleProps = useCallback(
    (id: string): KeyboardDndItemProps => ({
      onKeyDown: (e) => handleKeyDown(id, e),
      'aria-grabbed': liftedId === null ? undefined : liftedId === id,
      tabIndex: 0,
    }),
    [handleKeyDown, liftedId],
  )

  return {
    state: liftedId === null ? 'idle' : 'lifted',
    liftedId,
    targetIndex,
    handleProps,
  }
}

export interface KeyboardDndGestureOptions {
  items: readonly string[]
  axis?: KeyboardDndAxis
  announce?: (msg: string) => void
  messages?: Partial<KeyboardDndMessages>
}

/**
 * useKeyboardDndGesture — NormalizedData/dispatch bound wrapper (#168).
 *
 * On commit emits `{ type: 'move', id: fromId, targetId: toId, mode: 'sibling-before' | 'sibling-after' }` —
 * tree/list reducer 가 이미 흡수하는 어휘. `to < from` → 'sibling-before', `to > from` → 'sibling-after'.
 */
export function useKeyboardDndGesture(
  _data: NormalizedData,
  dispatch: (e: UiEvent) => void,
  opts: KeyboardDndGestureOptions,
): KeyboardDndGestureResult {
  return useKeyboardDndGestureRaw({
    items: opts.items,
    axis: opts.axis,
    announce: opts.announce,
    messages: opts.messages,
    onCommit: ({ from, to, fromId, toId }) => {
      const mode: 'sibling-before' | 'sibling-after' = to < from ? 'sibling-before' : 'sibling-after'
      dispatch({ type: 'move', id: fromId, targetId: toId, mode })
    },
  })
}

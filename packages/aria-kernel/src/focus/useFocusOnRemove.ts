/**
 * useFocusOnRemove — focus restoration after remove/replace.
 *
 * APG-spec UX: after deleting an item the focus must land on
 * 1) same-index next item, 2) previous, 3) container — universal across
 * grid · listbox · tree · accordion.
 *
 * Usage:
 *   const focusOnRemove = useFocusOnRemove({ items, focusItem, containerRef })
 *   focusOnRemove.plan(removedId)
 *   dispatch({ type:'remove', id: removedId })
 *   // after re-render, the planned target receives DOM focus.
 *
 * Pairs with `useFocusOnInsert` for paste/duplicate (focus newly-inserted).
 */
import { type RefObject, useEffect, useRef } from 'react'

export interface UseFocusOnRemoveOptions {
  /** Current ordered list of items. Identity (id) is read via getId. */
  items: ReadonlyArray<{ id: string } | string>
  /** Imperative focus by id — typically from pattern hook (#164). */
  focusItem: (id: string) => void
  /** Fallback container for focus when no sibling remains. */
  containerRef?: RefObject<HTMLElement | null>
  /** Override id reader for non-`{id}` items. */
  getId?: (item: { id: string } | string) => string
}

export interface UseFocusOnRemoveResult {
  /**
   * Call BEFORE dispatching the remove event.
   * Captures next-by-index → prev → container target and arms a focus
   * jump on the next render whose items no longer contain `removedId`.
   */
  plan: (removedId: string) => void
}

const defaultGetId = (it: { id: string } | string): string =>
  typeof it === 'string' ? it : it.id

export const useFocusOnRemove = (opts: UseFocusOnRemoveOptions): UseFocusOnRemoveResult => {
  const { items, focusItem, containerRef } = opts
  const getId = opts.getId ?? defaultGetId
  // planned target: { nextId | null } — null means container fallback.
  const planned = useRef<{ removedId: string; nextId: string | null } | null>(null)

  // capture current items snapshot for plan().
  const itemsRef = useRef(items)
  itemsRef.current = items

  const plan = (removedId: string) => {
    const list = itemsRef.current
    const idx = list.findIndex((it) => getId(it) === removedId)
    if (idx < 0) {
      planned.current = { removedId, nextId: null }
      return
    }
    // next-by-index → prev → container
    const next = list[idx + 1]
    const prev = idx > 0 ? list[idx - 1] : undefined
    const target = next ?? prev
    planned.current = { removedId, nextId: target ? getId(target) : null }
  }

  useEffect(() => {
    const p = planned.current
    if (!p) return
    // wait until the removed id is actually gone from items.
    const stillThere = items.some((it) => getId(it) === p.removedId)
    if (stillThere) return
    planned.current = null
    if (p.nextId) focusItem(p.nextId)
    else containerRef?.current?.focus()
  }, [items, focusItem, containerRef, getId])

  return { plan }
}

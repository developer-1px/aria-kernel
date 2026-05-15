/**
 * useFocusOnInsert — focus a newly-inserted item after paste/duplicate.
 *
 * Companion to `useFocusOnRemove`. Call `plan(insertedId)` before dispatching
 * the create/paste/duplicate event; after re-render that brings the id into
 * `items`, the primitive focuses it.
 *
 * Usage:
 *   const focusOnInsert = useFocusOnInsert({ items, focusItem })
 *   focusOnInsert.plan(newId)
 *   dispatch({ type:'create', id: newId, ... })
 *   // after re-render, the new item receives DOM focus.
 */
import { useEffect, useRef } from 'react'

export interface UseFocusOnInsertOptions {
  items: ReadonlyArray<{ id: string } | string>
  focusItem: (id: string) => void
  getId?: (item: { id: string } | string) => string
}

export interface UseFocusOnInsertResult {
  plan: (insertedId: string) => void
}

const defaultGetId = (it: { id: string } | string): string =>
  typeof it === 'string' ? it : it.id

export const useFocusOnInsert = (opts: UseFocusOnInsertOptions): UseFocusOnInsertResult => {
  const { items, focusItem } = opts
  const getId = opts.getId ?? defaultGetId
  const planned = useRef<string | null>(null)

  const plan = (insertedId: string) => {
    planned.current = insertedId
  }

  useEffect(() => {
    const id = planned.current
    if (!id) return
    const present = items.some((it) => getId(it) === id)
    if (!present) return
    planned.current = null
    focusItem(id)
  }, [items, focusItem, getId])

  return { plan }
}

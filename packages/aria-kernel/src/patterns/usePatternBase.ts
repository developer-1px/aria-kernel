import { ROOT, getCollectionChildren, type NormalizedData, type UiEvent } from '../intent/events'
import type { Axis } from '../input/keyboard/axes'
import { useRovingTabIndex } from '../read/roving/useRovingTabIndex'

export interface PatternBaseOptions {
  /** Container entity for the collection. Defaults to ROOT. */
  containerId?: string
  /** Mount-time focus on first navigable item. */
  autoFocus?: boolean
}

/**
 * Shared collection-pattern skeleton — composes useRovingTabIndex + ids derivation.
 *
 * Returns the four bindings that 11+ flat-collection patterns repeat:
 *   focusId · bindFocus · delegate · ids
 *
 * Items mapping stays inside each pattern because `selected` semantic differs
 * (listbox.selected vs toolbar.pressed vs tabs.current vs tree.expanded).
 *
 * Patterns that derive ids from a non-default source (tree/treegrid visible
 * order, listbox `groups` mode) call useRovingTabIndex directly.
 */
export function usePatternBase(
  data: NormalizedData,
  axis: Axis,
  relay: ((e: UiEvent) => void) | undefined,
  opts: PatternBaseOptions = {},
): {
  focusId: string | null
  bindFocus: (id: string) => (el: HTMLElement | null) => void
  delegate: ReturnType<typeof useRovingTabIndex>['delegate']
  ids: string[]
} {
  const { containerId = ROOT, autoFocus } = opts
  const { focusId, bindFocus, delegate } = useRovingTabIndex(axis, data, relay ?? (() => {}), {
    autoFocus,
    containerId,
  })
  const ids = getCollectionChildren(data, containerId)
  return { focusId, bindFocus, delegate, ids }
}

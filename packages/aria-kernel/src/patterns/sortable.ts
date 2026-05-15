import type { ItemProps, RootProps } from './types'

export interface SortableItem {
  id: string
  label: string
}

/** Options for {@link sortablePattern}. */
export interface SortableOptions {
  items: ReadonlyArray<SortableItem>
  /** Currently focused item (composite roving target). */
  activeId?: string
  /** Currently "grabbed" item — visually selected + announced as movable. */
  grabbedId?: string
  /** Accessible name for the list. */
  label?: string
  /** DOM id prefix. Default `'sortable'`. */
  idPrefix?: string
}

/**
 * sortable — keyboard-reorderable list ARIA markup recipe.
 *
 * Modelled after W3C APG `listbox-rearrangeable`:
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
 *
 * **Scope (this slice):** markup vocabulary only — `role=listbox` + `option`
 * + `aria-activedescendant` + `aria-selected` (grab indicator). Keyboard axis
 * (`grab` / `move-up` / `move-down` / `drop`) is a follow-up; compose with
 * existing primitives until then.
 *
 * @example
 *   const { rootProps, itemProps } = sortablePattern({
 *     items, activeId, grabbedId, label: 'Priorities',
 *   })
 *   return (
 *     <ul {...rootProps}>
 *       {items.map(it => <li key={it.id} {...itemProps(it.id)}>{it.label}</li>)}
 *     </ul>
 *   )
 */
export function sortablePattern(opts: SortableOptions): {
  rootProps: RootProps
  itemProps: (id: string) => ItemProps
} {
  const { activeId, grabbedId, label, idPrefix = 'sortable' } = opts
  const rootProps: RootProps = { role: 'listbox' }
  if (label !== undefined) rootProps['aria-label'] = label
  if (activeId !== undefined) rootProps['aria-activedescendant'] = `${idPrefix}-${activeId}`

  const itemProps = (id: string): ItemProps => {
    const p: ItemProps = {
      role: 'option',
      id: `${idPrefix}-${id}`,
      'data-id': id,
      tabIndex: -1,
    }
    if (grabbedId !== undefined) p['aria-selected'] = id === grabbedId
    return p
  }

  return { rootProps, itemProps }
}

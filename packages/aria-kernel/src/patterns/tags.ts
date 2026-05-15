import type { ButtonHTMLAttributes } from 'react'
import type { ItemProps, RootProps } from './types'

export interface Tag {
  id: string
  label: string
}

/** Options for {@link tagsPattern}. */
export interface TagsOptions {
  tags: ReadonlyArray<Tag>
  /** Optional accessible name for the chip list. */
  label?: string
  /** Called when a chip's remove button is activated. */
  onRemove?: (id: string) => void
}

type RemoveProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  type: 'button'
  'aria-label': string
}

/**
 * tags — chip list ARIA recipe (W3C APG complementary: list + listitem + button).
 *
 * Pure (no hooks). Pattern emits markup-only vocabulary for a static chip list
 * with per-chip remove buttons. Keyboard roving across chips is intentionally
 * out of scope here — compose with {@link useRovingTabIndex} when needed.
 *
 * @example
 *   const { rootProps, chipProps, removeProps } = tagsPattern({ tags, label: 'Topics', onRemove })
 *   return (
 *     <ul {...rootProps}>
 *       {tags.map(t => (
 *         <li key={t.id} {...chipProps(t.id)}>
 *           {t.label}
 *           <button {...removeProps(t.id, t.label)}>×</button>
 *         </li>
 *       ))}
 *     </ul>
 *   )
 */
export function tagsPattern(opts: TagsOptions): {
  rootProps: RootProps
  chipProps: (id: string) => ItemProps
  removeProps: (id: string, label: string) => RemoveProps
} {
  const { label, onRemove } = opts
  const rootProps: RootProps = { role: 'list' }
  if (label !== undefined) rootProps['aria-label'] = label

  const chipProps = (id: string): ItemProps => ({
    role: 'listitem',
    'data-id': id,
  })

  const removeProps = (id: string, tagLabel: string): RemoveProps => ({
    type: 'button',
    'aria-label': `Remove ${tagLabel}`,
    onClick: (e) => {
      e.preventDefault()
      e.stopPropagation()
      onRemove?.(id)
    },
  })

  return { rootProps, chipProps, removeProps }
}

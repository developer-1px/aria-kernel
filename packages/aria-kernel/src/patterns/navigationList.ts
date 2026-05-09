import { ROOT, getCollectionChildren, getLabel, isDisabled, type NormalizedData, type UiEvent } from '../types'
import type { BaseItem, ItemProps, RootProps } from './types'

/** Options for {@link navigationListPattern}. */
export interface NavigationListOptions {
  /** aria-label — ARIA: navigation landmark requires accessible name. */
  label?: string
  labelledBy?: string
  /** Container entity for the link list. Defaults to ROOT. */
  containerId?: string
}

/**
 * navigationList — sidebar/route navigation recipe.
 *
 * **Listbox 가 아니다.** APG에 단일 패턴 없음 — HTML `<nav>` landmark + `<a aria-current="page">`
 * 로 이루어진 합성. sidebar=listbox 안티패턴 차단이 본 recipe 의 존재 이유.
 *
 * - `aria-selected` 아닌 `aria-current="page"` (`entity.current` 가 SSoT)
 * - role=listbox/option 아닌 native nav/a
 * - 키보드는 native Tab/Enter — pattern 이 추가 axis 등록 안 함
 *
 * https://html.spec.whatwg.org/multipage/sections.html#the-nav-element
 * https://www.w3.org/TR/wai-aria-1.2/#aria-current
 */
export function navigationListPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: NavigationListOptions = {},
): {
  rootProps: RootProps
  linkProps: (id: string) => ItemProps
  items: (BaseItem & { current: boolean; href?: string })[]
} {
  const { label, labelledBy, containerId = ROOT } = opts

  const ids = getCollectionChildren(data, containerId)
  const items = ids.map((id, i) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: false,
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: ids.length,
      current: Boolean(ent.current),
      href: ent.href as string | undefined,
    }
  })

  const rootProps: RootProps = {
    role: 'navigation',
    'aria-label': label,
    'aria-labelledby': labelledBy,
  } as unknown as RootProps

  const linkProps = (id: string): ItemProps => {
    const ent = data.entities[id] ?? {}
    const disabled = isDisabled(data, id)
    return {
      'data-id': id,
      href: ent.href as string | undefined,
      'aria-current': ent.current ? 'page' : undefined,
      'aria-disabled': disabled || undefined,
      'data-current': ent.current ? '' : undefined,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        if (disabled) return
        onEvent?.({ type: 'activate', id })
      },
    } as unknown as ItemProps
  }

  return { rootProps, linkProps, items }
}

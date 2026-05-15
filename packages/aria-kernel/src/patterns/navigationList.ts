import { ROOT, getChildren, getCollectionChildren, getLabel, isDisabled, type NormalizedData, type UiEvent } from '../intent/events'
import { activate, composeAxes, navigate } from '../axes'
import { useRovingTabIndex } from '../roving/useRovingTabIndex'
import type { BaseItem, ItemProps, RootProps } from './types'

/** Options for {@link navigationListPattern}. */
export interface NavigationListOptions {
  /** aria-label — ARIA: navigation landmark requires accessible name. */
  label?: string
  labelledBy?: string
  /** Container entity for the link list. Defaults to ROOT. */
  containerId?: string
  /**
   * Arrow-key roving 활성화 — APG nav landmark 표준 밖이지만 사이드바 사용 편의를 위한 opt-in.
   * 활성화 시 `navigate('vertical')` + `activate` axis 합성, group 경계는 무시한 flat 순회
   * (listbox-grouped 와 동일 기법). 비활성(default) 시 native Tab/Enter 만으로 이동.
   *
   * **Stable 해야 함** — 마운트 후 toggle 금지 (rules-of-hooks).
   */
  roving?: boolean
  /**
   * selection-follows-focus — `roving` 시 화살표 focus 이동이 곧 `activate` 도 emit.
   * 사이드바·카탈로그처럼 focus 가 곧 라우팅인 nav 에서 사용. disabled 항목은 skip.
   * default false.
   */
  selectionFollowsFocus?: boolean
}

/**
 * navigationList — sidebar/route navigation recipe.
 *
 * **Listbox 가 아니다.** APG에 단일 패턴 없음 — HTML `<nav>` landmark + `<a aria-current="page">`
 * 로 이루어진 합성. sidebar=listbox 안티패턴 차단이 본 recipe 의 존재 이유.
 *
 * - `aria-selected` 아닌 `aria-current="page"` (`entity.current` 가 SSoT)
 * - role=listbox/option 아닌 native nav/a
 * - 키보드는 기본적으로 native Tab/Enter — `roving: true` opt-in 시에만 화살표 이동 추가
 * - 데이터가 2단(group → links) 이면 `groups` 배열도 함께 반환 — wrapper 가 헤더 렌더링
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
  groups: { id: string; label: string; items: (BaseItem & { current: boolean; href?: string })[] }[]
} {
  const { label, labelledBy, containerId = ROOT, roving = false, selectionFollowsFocus = false } = opts

  // 2단 구조 자동 감지: containerId 의 직접 자식이 모두 children 을 갖고 있으면 grouped.
  const directChildren = getCollectionChildren(data, containerId)
  const grouped =
    directChildren.length > 0 &&
    directChildren.every((id) => getChildren(data, id).length > 0)
  const groupIds = grouped ? directChildren : []
  const linkIds = grouped ? groupIds.flatMap((gid) => getChildren(data, gid)) : directChildren

  // roving 시 group 경계 무시 flat 순회 (listbox-grouped 와 동일 기법).
  const navData: NormalizedData = grouped
    ? { entities: data.entities, relationships: {}, meta: { ...data.meta, root: linkIds } }
    : data

  const relay = (e: UiEvent) => {
    onEvent?.(e)
    if (selectionFollowsFocus && e.type === 'navigate' && e.id) {
      const ent = data.entities[e.id]
      if (!ent?.disabled) onEvent?.({ type: 'activate', id: e.id })
    }
  }
  const axis = composeAxes(navigate('vertical'), activate)
  const rovingHandle = useRovingTabIndex(axis, navData, relay, {
    containerId: grouped ? ROOT : containerId,
  })

  const buildItem = (id: string, i: number, n: number) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: false,
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: n,
      current: Boolean(ent.current),
      href: ent.href as string | undefined,
    }
  }

  const items = linkIds.map((id, i) => buildItem(id, i, linkIds.length))
  const itemMap = new Map(items.map((it) => [it.id, it]))
  const groups = groupIds.map((gid) => {
    const childIds = getChildren(data, gid)
    return {
      id: gid,
      label: getLabel(data, gid),
      items: childIds.map((id) => itemMap.get(id)!).filter(Boolean),
    }
  })

  const rootProps: RootProps = {
    role: 'navigation',
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...(roving ? rovingHandle.delegate : {}),
  } as unknown as RootProps

  const linkProps = (id: string): ItemProps => {
    const ent = data.entities[id] ?? {}
    const disabled = isDisabled(data, id)
    const isFocus = roving && rovingHandle.focusId === id
    return {
      'data-id': id,
      href: ent.href as string | undefined,
      'aria-current': ent.current ? 'page' : undefined,
      'aria-disabled': disabled || undefined,
      'data-current': ent.current ? '' : undefined,
      ...(roving
        ? {
            ref: rovingHandle.bindFocus(id) as React.Ref<HTMLElement>,
            tabIndex: isFocus ? 0 : -1,
          }
        : {}),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        if (disabled) return
        onEvent?.({ type: 'activate', id })
      },
    } as unknown as ItemProps
  }

  return { rootProps, linkProps, items, groups }
}

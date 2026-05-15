import type React from 'react'
import { matches } from '@interactive-os/keyboard'
import { getCollectionChildren, getLabel, isDisabled, ROOT, type NormalizedData, type UiEvent } from '../intent/events'
import { activate, composeAxes, navigate } from '../axes'
import { usePatternBase } from './usePatternBase'
import type { BaseItem, ItemProps, RootProps } from './types'

/**
 * on middleware — chord ↔ wrapper. user 가 originalFn 호출 여부로 default 실행 결정.
 * default (delegate roving) 와 충돌 시 user wins; originalFn 으로 default 위임 가능.
 */
export type ToolbarOnMiddleware = Record<
  string,
  (event: KeyboardEvent, originalFn: () => void) => void
>

/** Toolbar 가 등록하는 axis — SSOT. */
export const toolbarAxis = (opts: { orientation?: 'horizontal' | 'vertical' } = {}) =>
  composeAxes(navigate(opts.orientation ?? 'horizontal'), activate)

/** Options for {@link useToolbarPattern}. */
export interface ToolbarOptions {
  orientation?: 'horizontal' | 'vertical'
  autoFocus?: boolean
  /** aria-label — APG: toolbar requires accessible name. */
  label?: string
  /** aria-labelledby (외부 heading element 연결). */
  labelledBy?: string
  /**
   * 사용자 chord ↔ handler middleware. key + mouse 통합.
   * userFn(event, originalFn) — originalFn 호출 시 toolbar default (Left/Right roving) 실행.
   */
  on?: ToolbarOnMiddleware
}

/**
 * toolbar — APG `/toolbar/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * `entity.separator: true` 항목은 roving skip + role="separator".
 * `entity.pressed` 는 toggle button 상태 — 데이터 owner 가 set.
 *
 * Per-item ARIA role 디스크리미네이터 — `entity.itemRole` 에 다음 중 하나:
 *   `'button'` (default), `'toggle'`, `'radio'`, `'checkbox'`,
 *   `'menubutton'`, `'spinbutton'`, `'link'`.
 * APG toolbar example 의 혼합 itemRole 변종을 1:1 흡수.
 *
 * @example canonical
 *   const [data, dispatch] = useToolbarReducer(ITEMS)
 *   const { rootProps, toolbarItemProps, items } = useToolbarPattern(data, dispatch)
 */
export function useToolbarPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: ToolbarOptions = {},
): {
  rootProps: RootProps
  toolbarItemProps: (id: string) => ItemProps
  items: (BaseItem & { separator: boolean })[]
} {
  const { orientation = 'horizontal', autoFocus, label, labelledBy, on } = opts

  // separator 는 roving navigation 에서 skip — ROOT children 에서 제외한 합성 데이터로
  // navigate axis 통과 (APG toolbar: separator MUST be skipped during keyboard nav).
  const allChildren = getCollectionChildren(data, ROOT)
  const navIds = allChildren.filter((id) => !data.entities[id]?.separator)
  const navData: NormalizedData = navIds.length === allChildren.length
    ? data
    : { entities: data.entities, relationships: data.relationships, meta: { ...data.meta, root: navIds } }

  const { focusId, bindFocus, delegate } = usePatternBase(
    navData, toolbarAxis({ orientation }), onEvent, { autoFocus },
  )

  // 렌더용 items 는 원본 ROOT children (separator 포함) — 데모가 separator 위치에 분리선 그리도록.
  // posinset/setsize 는 non-separator 만 카운트 (APG toolbar: separator 는 collection 멤버 아님).
  let pos = 0
  const items = allChildren.map((id) => {
    const isSep = Boolean(data.entities[id]?.separator)
    if (!isSep) pos += 1
    return {
      id,
      label: getLabel(data, id),
      selected: Boolean(data.entities[id]?.pressed),
      disabled: isDisabled(data, id),
      posinset: isSep ? 0 : pos,
      setsize: navIds.length,
      separator: isSep,
    }
  })

  // on middleware — delegate.onKeyDown 을 originalFn 으로 wrap.
  const delegateKeyDown = delegate.onKeyDown
  const onKeyDown = on
    ? (e: React.KeyboardEvent) => {
        if (e.defaultPrevented) return
        const ke = e.nativeEvent as unknown as KeyboardEvent
        for (const chord of Object.keys(on)) {
          if (!matches(ke, chord)) continue
          on[chord](ke, () => delegateKeyDown?.(e))
          return
        }
        delegateKeyDown?.(e)
      }
    : delegateKeyDown

  const rootProps: RootProps = {
    role: 'toolbar',
    'aria-orientation': orientation,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...delegate,
    onKeyDown,
  } as RootProps

  const toolbarItemProps = (id: string): ItemProps => {
    const ent = data.entities[id]
    if (ent?.separator) {
      return { role: 'separator', tabIndex: -1, 'data-id': id } as unknown as ItemProps
    }
    const isFocus = focusId === id
    const disabled = isDisabled(data, id)
    const itemRole = ent?.itemRole as
      | 'button' | 'toggle' | 'radio' | 'checkbox' | 'menubutton' | 'spinbutton' | 'link'
      | undefined

    const base = {
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-disabled': disabled || undefined,
      'data-disabled': disabled ? '' : undefined,
    } as Record<string, unknown>

    switch (itemRole) {
      case 'radio':
        base.role = 'radio'
        base['aria-checked'] = Boolean(ent?.pressed ?? ent?.selected)
        break
      case 'checkbox':
        base.role = 'checkbox'
        base['aria-checked'] = Boolean(ent?.pressed ?? ent?.selected)
        break
      case 'menubutton':
        base['aria-haspopup'] = 'menu'
        base['aria-expanded'] = Boolean(ent?.expanded)
        break
      case 'spinbutton':
        base.role = 'spinbutton'
        if (ent?.value !== undefined) base['aria-valuenow'] = ent.value
        if (ent?.min !== undefined) base['aria-valuemin'] = ent.min
        if (ent?.max !== undefined) base['aria-valuemax'] = ent.max
        break
      case 'link':
        // native <a> 권장 — role 따로 안 박음. tabIndex 만 roving 그대로.
        break
      case 'toggle':
        base['aria-pressed'] = Boolean(ent?.pressed)
        break
      case 'button':
      default:
        // 기존 호환: pressed 가 명시되어 있으면 toggle 로 취급.
        if (ent?.pressed !== undefined) base['aria-pressed'] = Boolean(ent.pressed)
        break
    }
    return base as unknown as ItemProps
  }

  return { rootProps, toolbarItemProps, items }
}

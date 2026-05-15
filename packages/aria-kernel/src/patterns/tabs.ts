import { useCallback } from 'react'
import { getLabel, isDisabled, type NormalizedData, type UiEvent } from '../intent/events'
import { activate, axisKeys, composeAxes, navigate } from '../axes'

/** Tabs 가 등록하는 axis — SSOT (behavior 용 — click activation 위해 항상 activate 포함). */
export const tabsAxis = (opts: { orientation?: 'horizontal' | 'vertical' } = {}) =>
  composeAxes(navigate(opts.orientation ?? 'horizontal'), activate)

/**
 * Tabs 가 advertise 하는 키 — `activationMode` 에 따라 Enter/Space 노출 여부 결정.
 * automatic 모드에서는 sff 로 navigate 가 즉시 select 까지 가져가 Enter/Space 는 redundant
 * (already-selected tab 에 대한 no-op activate). spec 상 optional 이므로 advertise 제외.
 */
export const tabsKeys = (opts: {
  orientation?: 'horizontal' | 'vertical'
  activationMode?: 'automatic' | 'manual'
} = {}): readonly string[] => {
  const all = axisKeys(tabsAxis(opts))
  return opts.activationMode === 'manual' ? all : all.filter((k) => k !== 'Enter' && k !== ' ')
}
import { selectionFollowsFocus as applySelectionFollowsFocus } from '../gesture'
import { usePatternBase } from './usePatternBase'
import type { BaseItem, ItemProps, RootProps } from './types'

/** Options for {@link useTabsPattern}. */
export interface TabsOptions {
  orientation?: 'horizontal' | 'vertical'
  /** APG: automatic = ArrowKey 가 즉시 panel 전환. manual = Enter/Space 로 활성화. */
  activationMode?: 'automatic' | 'manual'
  autoFocus?: boolean
  /** stable id prefix (SSR-safe). */
  idPrefix?: string
  /** aria-label — ARIA: tablist requires accessible name. */
  label?: string
  labelledBy?: string
  /**
   * controlled — 외부 SSOT 의 active tab id. 제공되면 `data.entities[id].selected`
   * 를 무시하고 `id === active` 로 selected 도출. 외부 state 와 동기화 위해
   * data mutation 할 필요 없음.
   */
  active?: string
}

/**
 * tabs — APG `/tabs/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * tabProps(id)·panelProps(id) 가 `aria-controls`/`aria-labelledby` 자동 연결.
 *
 * @example canonical
 *   const [data, dispatch] = useTabsReducer(ITEMS)
 *   const { rootProps, tabProps, panelProps, items } = useTabsPattern(data, dispatch)
 *
 * **ARIA-punt 흡수 (INVARIANTS §B-ter.2):**
 * `active?: string` — controlled selection. 제공 시 `data.entities[id].selected` 무시,
 * `id === active` 로 도출. 외부 SSOT 와 동기화할 때 data mutation 0. (`/lab/tabs-controlled`)
 */
export function useTabsPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: TabsOptions = {},
): {
  rootProps: RootProps
  tabProps: (id: string) => ItemProps
  panelProps: (id: string) => ItemProps
  items: BaseItem[]
} {
  const {
    orientation = 'horizontal',
    activationMode = 'automatic',
    autoFocus,
    idPrefix = 'tabs',
    label,
    labelledBy,
    active,
  } = opts

  const axis = tabsAxis({ orientation })
  const relay = useCallback(
    (e: UiEvent) => {
      if (!onEvent) return
      const out = activationMode === 'automatic' ? applySelectionFollowsFocus(data, e) : [e]
      out.forEach(onEvent)
    },
    [data, onEvent, activationMode],
  )

  const { focusId, bindFocus, delegate, ids } = usePatternBase(data, axis, relay, { autoFocus })

  const items: BaseItem[] = ids.map((id, i) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: active !== undefined ? id === active : Boolean(ent.selected),
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: ids.length,
    }
  })

  const tabId = (id: string) => `${idPrefix}-tab-${id}`
  const panelId = (id: string) => `${idPrefix}-panel-${id}`

  const rootProps: RootProps = {
    role: 'tablist',
    'aria-orientation': orientation,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...delegate,
  } as RootProps

  const tabProps = (id: string): ItemProps => {
    const it = items.find((x) => x.id === id)
    const isFocus = focusId === id
    return {
      role: 'tab',
      id: tabId(id),
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-selected': it?.selected ?? false,
      'aria-disabled': it?.disabled || undefined,
      'aria-controls': panelId(id),
      'data-selected': it?.selected ? '' : undefined,
      'data-disabled': it?.disabled ? '' : undefined,
    } as unknown as ItemProps
  }

  const panelProps = (id: string): ItemProps => ({
    role: 'tabpanel',
    id: panelId(id),
    'aria-labelledby': tabId(id),
    tabIndex: 0,
    hidden: !items.find((x) => x.id === id)?.selected,
  } as unknown as ItemProps)

  return { rootProps, tabProps, panelProps, items }
}

import { ROOT, getCollectionChildren, getLabel, isDisabled, getExpanded, type NormalizedData, type UiEvent } from '../types'
import { activate, composeAxes, navigate } from '../axes'
import { useRovingTabIndex } from '../roving/useRovingTabIndex'
import type { BaseItem, ItemProps, RootProps } from './types'

/** Options for {@link useAccordionPattern}. */
export interface AccordionOptions {
  /** 'multiple' (default): 여러 패널 동시 열림. 'single': APG single-mode — 한 항목만 열림 (형제 자동 collapse). */
  mode?: 'multiple' | 'single'
  autoFocus?: boolean
  idPrefix?: string
  /** heading 의 aria-level. 문서 위계에 맞춰 host 가 결정. 기본 3. */
  level?: number
}

/** Accordion 이 등록하는 axis — SSOT. */
export const accordionAxis = () => composeAxes(navigate('vertical'), activate)
const axis = accordionAxis()

/**
 * accordion — APG `/accordion/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 *
 * `meta.expanded` 가 expanded 항목 SSoT. `single` mode 는 패턴이 형제 자동
 * collapse 를 emit. activate(click) → expand toggle.
 *
 * @example canonical
 *   const [data, dispatch] = useAccordionReducer(ITEMS)
 *   const { rootProps, buttonProps, regionProps, items } = useAccordionPattern(data, dispatch)
 */
export function useAccordionPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: AccordionOptions = {},
): {
  rootProps: RootProps
  headingProps: (id: string) => ItemProps
  buttonProps: (id: string) => ItemProps
  regionProps: (id: string) => ItemProps
  items: (BaseItem & { expanded: boolean })[]
} {
  const { mode = 'multiple', autoFocus, idPrefix = 'acc', level = 3 } = opts

  const ids = getCollectionChildren(data, ROOT)
  const expandedSet = getExpanded(data)

  // single mode 는 open 시 형제 자동 collapse 를 emit.
  const intent = (e: UiEvent) => {
    if (e.type === 'navigate') { onEvent?.(e); return }
    if (e.type === 'expand') {
      if (mode === 'single' && e.open) {
        for (const sib of ids) {
          if (sib !== e.id && expandedSet.has(sib)) onEvent?.({ type: 'expand', id: sib, open: false })
        }
      }
      onEvent?.(e)
      return
    }
    if (e.type === 'activate') {
      const next = !expandedSet.has(e.id)
      if (mode === 'single' && next) {
        for (const sib of ids) {
          if (sib !== e.id && expandedSet.has(sib)) onEvent?.({ type: 'expand', id: sib, open: false })
        }
      }
      onEvent?.({ type: 'expand', id: e.id, open: next })
    }
  }

  const { bindFocus, delegate } = useRovingTabIndex(axis, data, intent, { autoFocus })

  const triggerId = (id: string) => `${idPrefix}-trigger-${id}`
  const panelId = (id: string) => `${idPrefix}-panel-${id}`

  const items = ids.map((id, i) => ({
    id,
    label: getLabel(data, id),
    selected: false,
    disabled: isDisabled(data, id),
    posinset: i + 1,
    setsize: ids.length,
    expanded: expandedSet.has(id),
  }))

  const rootProps: RootProps = { role: 'presentation', ...delegate } as unknown as RootProps

  const headingProps = (_id: string): ItemProps =>
    ({ role: 'heading', 'aria-level': level } as unknown as ItemProps)

  const buttonProps = (id: string): ItemProps => {
    const open = expandedSet.has(id)
    return {
      id: triggerId(id),
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: 0,
      'aria-expanded': open,
      'aria-controls': panelId(id),
      'aria-disabled': isDisabled(data, id) || undefined,
      'data-state': open ? 'open' : 'closed',
    } as unknown as ItemProps
  }

  const regionProps = (id: string): ItemProps => {
    const open = expandedSet.has(id)
    return {
      role: 'region',
      id: panelId(id),
      'aria-labelledby': triggerId(id),
      hidden: !open,
      'data-state': open ? 'open' : 'closed',
    } as unknown as ItemProps
  }

  return { rootProps, headingProps, buttonProps, regionProps, items }
}

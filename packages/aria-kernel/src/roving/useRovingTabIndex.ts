import type { KeyboardEvent, MouseEvent } from 'react'
import type { Axis } from '../axes'
import { bindAxis } from '../state/bind'
import {
  ROOT,
  getCollectionChildren,
  getExpanded,
  getFocus,
  isDisabled,
  type UiEvent,
  type NormalizedData,
} from '../intent/events'
import { useFocusBridge } from '../focus/useFocusBridge'

// rovingItem 기본기: data-id 기반 이벤트 위임을 hook 내부에서 소유한다.
// 소비자는 {...delegate}를 container에 그대로 꽂기만 하면 axis로 연결된다.
// onKey/onClick 은 Menu 처럼 직접 합성이 필요한 경우를 위해 그대로 노출.
const idFrom = (e: { target: EventTarget }): string | null =>
  (e.target as Element).closest<HTMLElement>('[data-id]')?.dataset.id ?? null

// editable target 안에서 modifier 없는 단일 키는 axis 가 탈취하지 않는다.
// (bindGlobalKeyMap 의 가드 어휘 그대로 — cell-input 같은 inline 편집을 막지 않기 위함)
const isEditableTarget = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

const defaultFocusId = (data: NormalizedData, containerId: string): string | null => {
  const ids = getCollectionChildren(data, containerId).filter((id) => !isDisabled(data, id))
  return ids.find((id) => Boolean(data.entities[id]?.selected)) ?? ids[0] ?? null
}

/**
 * useRovingTabIndex — APG canonical roving tabindex. **데이터(관계 그래프) 기반** 이동.
 *
 * NormalizedData 의 `relationships` 그래프와 axis (composeAxes 결과) 를 따라 다음 focus id 를
 * 결정한다. DOM 시각 위치와 무관 — 논리적 부모/형제/자식 관계가 곧 이동 축.
 *
 * 시각 좌표 기반(JSX-children 자유 배치, row-reverse, transform 등)이 필요한 곳은
 * {@link useSpatialNavigation} (W3C CSS spatnav) 을 쓴다. 둘은 1 tab stop roving 메커니즘만 공유.
 *
 * 내부에 `data-id` 위임을 소유하므로 소비자는 `{...delegate}` 만 container 에 꽂는다.
 *
 * @param axis - composeAxes 로 합성된 축 (navigate/activate/expand/typeahead/...)
 * @param data - NormalizedData (focus 는 `meta.focus`)
 * @param onEvent - UiEvent 디스패치
 * @param options.autoFocus - 마운트 시 첫 focusId 에 .focus() 발동 (다이얼로그용)
 * @param options.containerId - 기본 focus 산출 시 기준 컨테이너. 기본 ROOT
 *
 * @example
 * const axis = composeAxes(navigate('vertical'), activate(), typeahead())
 * const { delegate, bindFocus, focusId } = useRovingTabIndex(axis, data, onEvent)
 * return <ul {...delegate}>{ids.map(id => <li key={id} data-id={id} ref={bindFocus(id)} tabIndex={focusId === id ? 0 : -1}/>)}</ul>
 */
export function useRovingTabIndex(
  axis: Axis,
  data: NormalizedData,
  onEvent: (e: UiEvent) => void,
  options: { autoFocus?: boolean; containerId?: string } = {},
) {
  const focusId = getFocus(data) ?? defaultFocusId(data, options.containerId ?? ROOT)
  const expanded = getExpanded(data)
  const { onKey, onClick } = bindAxis(axis, data, onEvent)
  const { bindFocus, focusItem } = useFocusBridge(focusId, options.autoFocus)

  const delegate = {
    onClick: (e: MouseEvent) => {
      const id = idFrom(e)
      if (id) onClick(e, id)
    },
    onKeyDown: (e: KeyboardEvent) => {
      // editable 안에서 modifier 없는 단일 키는 axis 가 탈취 금지 (cell-input 편집 보호)
      if (isEditableTarget(e.target) && !e.ctrlKey && !e.altKey && !e.metaKey) return
      const id = idFrom(e)
      if (id) onKey(e, id)
    },
  }

  return { focusId, expanded, bindFocus, focusItem, delegate, onKey, onClick }
}

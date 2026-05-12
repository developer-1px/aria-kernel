/**
 * gesture — 제스처(activate) → 의도(expand/navigate/...) 변환 헬퍼 모음.
 *
 * ui/ role 은 activate 단발만 emit. 소비자가 reducer 직전에 골라 통과시킨다.
 * 키보드 axes(composeAxes) 와 대칭 — 마우스/터치/Enter 가 activate 로 합류한 뒤
 * 같은 헬퍼가 의도 이벤트로 분해.
 */
export { useClickOutsideGesture, type ClickOutsideRef } from './useClickOutsideGesture'
export { useContextMenuGesture, type ContextMenuGestureOptions } from './useContextMenuGesture'
export { useResizeGesture, type ResizeGestureOptions } from './useResizeGesture'
export { useGridDragSelectGesture, useGridDragSelectGestureRaw } from './useGridDragSelectGesture'
export {
  useReorderDnDGesture,
  useReorderDnDGestureRaw,
  positionToMoveMode,
  type ReorderPosition,
  type ReorderDnDGestureOptions,
  type ReorderDnDGestureRawOptions,
  type ReorderItemHandlers,
} from './useReorderDnDGesture'

import { getChildren, getExpanded, type UiEvent, type NormalizedData } from '../types'
import { INTENT_CHORDS } from '../axes/intentChords'
import { matchAnyChord } from '../axes/chord'

/** GestureHelper — UiEvent 1개를 받아 0개 이상의 의도 이벤트로 분해/확장. */
export type GestureHelper = (d: NormalizedData, e: UiEvent) => UiEvent[]

/** activate → [navigate, activate] 분해. 클릭/Enter 가 포커스도 같이 이동시킨다. */
export const navigateOnActivate: GestureHelper = (_d, e) =>
  e.type === 'activate' ? [{ type: 'navigate', id: e.id }, e] : [e]

/** navigate → [navigate, select] 분해. APG single-select listbox/tabs/tree 의 selection-follows-focus.
 *  `select` (순수 선택 상태) 를 emit — `activate` 가 아님. activate 는 사용자의 명시적 제스처(Enter/Space/Click)이고
 *  tree 처럼 expand-on-activate 가 합성된 환경에서는 navigate→activate 분해가 focus=expand 부수효과를 만든다.
 *  disabled 는 skip. */
export const selectionFollowsFocus: GestureHelper = (d, e) => {
  if (e.type !== 'navigate' || !e.id) return [e]
  const ent = d.entities[e.id]
  if (ent?.disabled) return [e]
  return [e, { type: 'select', ids: [e.id] }]
}

/** activate → 자식 有: [navigate, expand] / 자식 無: [navigate, activate]. Tree/Columns/Menu 용. */
export const expandBranchOnActivate: GestureHelper = (d, e) => {
  if (e.type !== 'activate') return [e]
  const hasKids = getChildren(d, e.id).length > 0
  if (!hasKids) return [{ type: 'navigate', id: e.id }, e]
  const open = getExpanded(d).has(e.id)
  return [{ type: 'navigate', id: e.id }, { type: 'expand', id: e.id, open: !open }]
}

/** activate → [navigate, expand] 무조건 분해. Accordion 처럼 항목 자체가 expandable 한 role 용. */
export const expandOnActivate: GestureHelper = (d, e) => {
  if (e.type !== 'activate') return [e]
  const open = getExpanded(d).has(e.id)
  return [{ type: 'navigate', id: e.id }, { type: 'expand', id: e.id, open: !open }]
}

/** GestureHelper 합성. 왼쪽부터 차례로 통과 (각 단계의 출력이 다음 단계의 입력). */
export const composeGestures = (...fns: GestureHelper[]): GestureHelper =>
  (d, e) => fns.reduce<UiEvent[]>((evs, fn) => evs.flatMap((ev) => fn(d, ev)), [e])

import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'

/**
 * activateProps — 클릭과 Enter/Space 를 단일 onActivate 콜백으로 합류.
 * (data, onEvent) 흐름 밖 JSX-children row/cell 등의 DOM 측 entry.
 *
 * @example
 * <button {...activateProps(() => onSelect(id))}>...</button>
 */
export const activateProps = (onActivate: () => void) => ({
  onClick: (_e: ReactMouseEvent) => onActivate(),
  onKeyDown: (e: ReactKeyboardEvent) => {
    if (matchAnyChord(e.nativeEvent, INTENT_CHORDS.activate.trigger)) {
      e.preventDefault()
      onActivate()
    }
  },
})

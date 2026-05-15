/**
 * Axis emits catalog — EPIC #95 Layer 2.1
 *
 * 각 axis 가 emit 하는 UiEvent['type'] 의 정적 카탈로그. reducer 가 이 events 를
 * 흡수하지 못하면 axis 가 fire 해도 state 변화가 없는 silent drop 이 발생 — Layer 2.3
 * 정합 테스트가 이 카탈로그를 reducer.handles 와 비교.
 *
 * SSOT: axis 구현부의 `[{ type: 'X', ... }]` 와 정합. 변경 시 둘 다 갱신.
 */
import type { UiEvent } from '../intent/events'
import type { AxisIntent } from './intents'

type EvType = UiEvent['type'] | AxisIntent['type']

export const activateEmits: readonly EvType[] = ['activate']
export const escapeEmits: readonly EvType[] = ['open']
export const navigateEmits: readonly EvType[] = ['navigate']
export const typeaheadEmits: readonly EvType[] = ['navigate', 'typeahead']
export const multiSelectEmits: readonly EvType[] = ['navigate', 'select']
export const numericStepEmits: readonly EvType[] = ['value']
export const gridNavigateEmits: readonly EvType[] = ['navigate']
export const submenuEmits: readonly EvType[] = ['expand', 'navigate']
export const toggleEmits: readonly EvType[] = ['activate']
export const treeExpandEmits: readonly EvType[] = ['treeStep']
export const treeNavigateEmits: readonly EvType[] = ['navigate']
export const pageNavigateEmits: readonly EvType[] = ['pageStep']
export const expandEmits: readonly EvType[] = ['expand', 'expandSeed', 'navigate']
export const selectEmits: readonly EvType[] = ['select']
export const gridMultiSelectEmits: readonly EvType[] = ['navigate', 'select']

/** All known axis emits — composeAxes 결과의 emits 합집합 계산용. */
export const ALL_AXIS_EMITS: Record<string, readonly EvType[]> = {
  activate: activateEmits,
  escape: escapeEmits,
  navigate: navigateEmits,
  typeahead: typeaheadEmits,
  multiSelect: multiSelectEmits,
  numericStep: numericStepEmits,
  gridNavigate: gridNavigateEmits,
  submenu: submenuEmits,
  toggle: toggleEmits,
  treeExpand: treeExpandEmits,
  treeNavigate: treeNavigateEmits,
  pageNavigate: pageNavigateEmits,
  expand: expandEmits,
  select: selectEmits,
  gridMultiSelect: gridMultiSelectEmits,
}

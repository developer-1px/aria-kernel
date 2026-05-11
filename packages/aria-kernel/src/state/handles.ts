/**
 * Reducer handles catalog — EPIC #95 Layer 2.2
 *
 * 각 reducer fragment 가 의미 있게 처리하는 (identity 가 아닌) UiEvent['type'] 카탈로그.
 * SSOT — fragment 코드의 분기 (`if e.type === 'X'`) 와 정합. 변경 시 둘 다 갱신.
 *
 * Layer 2.3 정합 테스트가 axis emits ⊆ ∪ reducer.handles 검증.
 */
import type { UiEvent } from '../types'
import type { AxisIntent } from '../axes/intents'

type EvType = UiEvent['type'] | AxisIntent['type']

/**
 * core reducer — focus, expand/open, typeahead, select(anchor), pan/zoom, edit lifecycle.
 * AxisIntent (treeStep/pageStep/expandSeed) 도 내부 resolveIntent 가 navigate/expand 로 풀어
 * cover — emits 카탈로그와 정합 위해 handles 에도 포함.
 */
export const reduceHandles: readonly EvType[] = [
  'navigate', 'focus', 'expand', 'open', 'typeahead', 'select', 'pan', 'zoom',
  'editStart', 'editEnd', 'commit', 'revert',
  // AxisIntent — reduce 가 resolveIntent 로 풀어 처리.
  'treeStep', 'pageStep', 'expandSeed',
]

/** singleSelect — select 축의 single-of-group. */
export const singleSelectHandles: readonly EvType[] = ['activate', 'select']

/** singleCurrent — navigation list 의 aria-current 어휘. */
export const singleCurrentHandles: readonly EvType[] = ['activate']

/** multiSelectToggle — multi-mode select (unified `select { ids; to? }`). */
export const multiSelectToggleHandles: readonly EvType[] = ['select']

/** checkToggle — checkbox toggle/set (unified `check { ids; to? }`). */
export const checkToggleHandles: readonly EvType[] = ['check']

/** singleCheck — radio / single-of-group via check 축. */
export const singleCheckHandles: readonly EvType[] = ['check', 'activate', 'select']

/** setValue — slider/spinbutton/splitter/switch. */
export const setValueHandles: readonly EvType[] = ['value']

/** appCommandHandles — 키보드 보편 명령(host reducer 위임 대상). */
export const appCommandHandles: readonly EvType[] = [
  'selectAll', 'selectNone', 'selectRange',
  'sort', 'filter', 'find', 'save', 'duplicate',
  // Step C — traditional app vocabulary.
  'new', 'close', 'cancel', 'refresh', 'print',
  'goBack', 'goForward',
  'expandAll', 'collapseAll',
  'replace', 'nextMatch', 'prevMatch',
  'dragStart', 'dragOver', 'drop', 'dragEnd',
]

/** Composition presets — 각 reduce* 변종이 cover 하는 events 합집합. */
export const REDUCE_PRESETS: Record<string, readonly EvType[]> = {
  reduceSingleSelect: [
    ...reduceHandles, ...singleSelectHandles, ...checkToggleHandles, ...setValueHandles, ...appCommandHandles,
  ],
  reduceMultiSelect: [
    ...reduceHandles, ...multiSelectToggleHandles, ...checkToggleHandles, ...setValueHandles, ...appCommandHandles,
  ],
  reduceRadio: [
    ...reduceHandles, ...singleCheckHandles, ...setValueHandles, ...appCommandHandles,
  ],
}

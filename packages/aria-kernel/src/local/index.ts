/**
 * @p/aria-kernel/local — quick-start helpers for local state.
 *
 * Production apps use `useResource` (single data interface, supports HMR /
 * cache / serialize). For demos, prototypes, and isolated examples where you
 * just need `[data, dispatch(event)]`, this subpath provides thin React.useState wrappers:
 *
 *  - `useLocalData` — for collections (NormalizedData)
 *  - `useLocalValue<T>` — for single-value controls (slider/switch/spinbutton/...)
 *
 * 정체성 분리 — `useResource` 가 정본, 이건 quick-start helper.
 *
 * cardinality 원칙:
 *  - 컬렉션 (listbox/tree/grid/...) → useLocalData
 *  - 단일값 (slider/switch/spinbutton/splitter) → useLocalValue
 *  - 트리값 → useLocalData (NormalizedData 가 트리를 표현)
 */
import { useState } from 'react'
import type { Reducer } from '../state/compose'
import { reduceWithDefaults } from '../state/defaults'
import type { NormalizedData, UiEvent, ValueEvent } from '../types'

export type { ValueEvent }

/**
 * @deprecated #146/#147 매니페스토: React `useReducer` 직접 사용 — 라이브러리가 React
 * 표준 복제할 이유 없음. canonical 합성:
 *
 *   const [data, dispatch] = useReducer(reduce, items, fromList)
 *   const accordion = useAccordion(data, dispatch)
 *
 * 컬렉션(NormalizedData) quick-start state — `[data, onEvent]` 한 줄.
 *
 * @param initial - 초기 NormalizedData (값 또는 lazy 초기자)
 * @param reducer - reducer (기본 reduceWithDefaults). multi-select 등 변형은 명시 주입
 *
 * @example legacy (works but prefer useUiReducer + fromList)
 *   const [data, onEvent] = useLocalData(() => fromList(items))
 */
export function useLocalData(
  initial: NormalizedData | (() => NormalizedData),
  reducer: Reducer = reduceWithDefaults,
) {
  const [data, setData] = useState(initial)
  const onEvent = (e: UiEvent) => setData((d) => reducer(d, e))
  return [data, onEvent] as const
}

/**
 * 단일값 컨트롤 (slider/switch/spinbutton/splitter) 의 quick-start state.
 *
 * @example
 *   const [on, dispatch] = useLocalValue(false)
 *   const { switchProps } = switchPattern(on, dispatch, { label: 'Mute' })
 */
export function useLocalValue<T>(
  initial: T | (() => T),
): readonly [T, (e: ValueEvent<T>) => void] {
  const [value, setValue] = useState(initial)
  const dispatch = (e: ValueEvent<T>) => {
    if (e.type === 'value') setValue(e.value)
  }
  return [value, dispatch] as const
}

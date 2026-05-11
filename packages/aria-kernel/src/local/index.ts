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
import { useReducer, useState } from 'react'
import type { Reducer } from '../state/compose'
import { reduceWithDefaults } from '../state/defaults'
import type { NormalizedData, UiEvent, ValueEvent } from '../types'

export type { ValueEvent }

/**
 * useUiReducer — React `useReducer` 시그니처를 그대로 차용한 canonical 합성 부품.
 * Issue #147 / #146 매니페스토 storage 자리 default. 부품 교체 escape (useResource 등)
 * 도 `[data, dispatch]` shape 일치.
 *
 * 시그니처 = `useReducer(reducer, initialArg, init)` 완전 동치. lazy init 으로
 * `fromList(items)` 가 mount 시 1회만 실행.
 *
 * @example canonical 합성
 *   const [data, dispatch] = useUiReducer(reduce, items, fromList)
 *   const accordion = useAccordion(data, dispatch)
 *
 * @example tree/multi-select 변형 — 부품 교체만, 합성 형태 보존
 *   const [data, dispatch] = useUiReducer(reduceWithMultiSelect, items, fromTree)
 *   const tree = useTreeView(data, dispatch)
 */
export function useUiReducer<I>(
  reducer: Reducer,
  initialArg: I,
  init: (arg: I) => NormalizedData,
): readonly [NormalizedData, (e: UiEvent) => void] {
  const [data, dispatch] = useReducer(reducer, initialArg, init)
  return [data, dispatch as (e: UiEvent) => void] as const
}

/**
 * @deprecated Issue #147 정정 — `useUiReducer` 사용 권장 (React useReducer 시그니처 미러).
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

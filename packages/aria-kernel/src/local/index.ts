/**
 * @p/aria-kernel/local — **DEPRECATED (#148)**.
 *
 * 두 hook (`useLocalData` / `useLocalValue`) 모두 React 표준 복제 — 라이브러리가
 * `use*Data` / `use*Value` wrapper 를 만들지 않는다. canonical 합성:
 *
 *  - 컬렉션 → `useReducer(reduceWithDefaults, items, fromList)` + `use<Pattern>Pattern(data, dispatch)`
 *  - 단일값 → `useState<T>` + `(e: ValueEvent<T>) => setValue(e.value)`
 *
 * 다음 메이저에서 제거 (#148 §10 단계 8). 신규 코드는 위 합성 사용.
 */
import { useState } from 'react'
import type { Reducer } from '../state/compose'
import { reduceWithDefaults } from '../state/defaults'
import type { NormalizedData, UiEvent, ValueEvent } from '../types'

export type { ValueEvent }

/**
 * @deprecated #148 — React `useReducer` 직접 사용. 라이브러리가 React 표준을 복제하지 않는다.
 *
 *   const [data, dispatch] = useReducer(reduceWithDefaults, items, fromList)
 *   const { rootProps, itemProps } = useListboxPattern(data, dispatch)
 *
 * 컬렉션(NormalizedData) quick-start state — `[data, onEvent]` 한 줄.
 *
 * @param initial - 초기 NormalizedData (값 또는 lazy 초기자)
 * @param reducer - reducer (기본 reduceWithDefaults). multi-select 등 변형은 명시 주입
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
 * @deprecated #148 — React `useState` 직접 사용. 단일값 컨트롤은 `useState` + `(e) => setValue(e.value)`
 * 합성으로 표현. 라이브러리가 React 표준을 복제하지 않는다.
 *
 *   const [on, setOn] = useState(false)
 *   const { switchProps } = switchPattern(on, (e) => setOn(e.value), { label: 'Mute' })
 *
 * 단일값 컨트롤 (slider/switch/spinbutton/splitter) 의 quick-start state.
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

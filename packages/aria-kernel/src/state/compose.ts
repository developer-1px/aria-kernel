import type { GestureHelper } from '../gesture'
import type { NormalizedData, UiEvent } from '../types'

/** `(data, event) → next data` — NormalizedData 위에 UiEvent 를 적용하는 pure 함수. */
export type Reducer = (d: NormalizedData, e: UiEvent) => NormalizedData

/**
 * composeReducers — left-to-right reducer composition. Each reducer sees the
 * output of the previous one. Identity reducers (e.g. `reduce` for activate)
 * pass the data through unchanged so subsequent reducers (selection / value /
 * domain) can layer their semantics.
 */
export const composeReducers =
  (...rs: Reducer[]): Reducer =>
  (d, e) =>
    rs.reduce((acc, r) => r(acc, e), d)

/**
 * applyGesture — gesture + reducer 합성. gesture가 활성 이벤트를 의도 이벤트
 * 스트림으로 변환한 뒤, reducer가 각 이벤트를 적용해 최종 state로 reduce.
 *
 * 예시:
 *   // accordion: activate → expand 토글
 *   const accReducer = applyGesture(expandOnActivate, composeReducers(reduce, setValue))
 *
 *   // tree: branch click → expand, leaf click → select
 *   const treeReducer = applyGesture(expandBranchOnActivate, reduceSingleSelect)
 */
export const applyGesture =
  (gesture: GestureHelper, reducer: Reducer): Reducer =>
  (d, e) =>
    gesture(d, e).reduce<NormalizedData>((acc, ev) => reducer(acc, ev), d)

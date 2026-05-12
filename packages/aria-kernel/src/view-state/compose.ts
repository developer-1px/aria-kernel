import type { GestureHelper } from '../input/gesture'
import type { NormalizedData, UiEvent } from '../intent/events'

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
 * applyGesture — gesture + reducer 합성. *주체 reducer 가 먼저, gesture 가 augmentation.*
 * composeReducers 와 같은 인자 순서 (주체 먼저).
 *
 * 작동: gesture 가 active event 를 의도 event 스트림으로 변환한 뒤, reducer 가 각 event 적용.
 *
 * 예시:
 *   // accordion: activate → expand 토글
 *   const accReducer = applyGesture(composeReducers(reduce, setValue), expandOnActivate)
 *
 *   // tree: branch click → expand, leaf click → select
 *   const treeReducer = applyGesture(reduceSingleSelect, expandBranchOnActivate)
 */
export const applyGesture =
  (reducer: Reducer, gesture: GestureHelper): Reducer =>
  (d, e) =>
    gesture(d, e).reduce<NormalizedData>((acc, ev) => reducer(acc, ev), d)

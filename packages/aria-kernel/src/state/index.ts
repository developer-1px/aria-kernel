/**
 * @interactive-os/aria-kernel/state — UiEvent → NormalizedData 변환 레이어.
 * reducer (`reduce` · `singleSelect` · `setValue` …) + 합성기(`composeReducers` · `applyGesture`)
 * + tree/list 빌더 + React 브리지 hook(`useControlState` · `useEventBridge`).
 */

export { reduce } from './reduce'
export { composeReducers, applyGesture, type Reducer } from './compose'
export { singleSelect, singleCurrent, multiSelectToggle } from './selection'
export { setValue } from './value'
export { reduceSingleSelect, reduceMultiSelect, reduceRadio } from './defaults'
export { fromTree, fromList, pathAncestors } from './fromTree'
export { fromFlatTree } from './fromFlatTree'
export { useControlState } from './useControlState'
export { useEventBridge } from './useEventBridge'
export { bindAxis, bindValueAxis, pickNumericValue } from './bind'
export {
  REDUCE_PRESETS,
  reduceHandles, singleSelectHandles, singleCurrentHandles,
  multiSelectToggleHandles, checkToggleHandles, singleCheckHandles, setValueHandles,
} from './handles'

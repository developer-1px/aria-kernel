/**
 * @interactive-os/aria-kernel/focus — focus 라이프사이클 hook 모음.
 *
 * useFocusBridge: focusId(논리) → DOM .focus() 위임 bridge.
 * useFocusOnRemove / useFocusOnInsert: collection mutation 후 포커스 재배치.
 */

export { useFocusBridge } from './useFocusBridge'
export { useFocusOnRemove } from './useFocusOnRemove'
export type { UseFocusOnRemoveOptions, UseFocusOnRemoveResult } from './useFocusOnRemove'
export { useFocusOnInsert } from './useFocusOnInsert'
export type { UseFocusOnInsertOptions, UseFocusOnInsertResult } from './useFocusOnInsert'

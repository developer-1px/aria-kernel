/**
 * @interactive-os/aria-kernel — APG-correct headless behavior layer.
 *
 * Owns: axis composition · roving tabindex · gesture/intent split · patterns ·
 * shared data vocabulary (NormalizedData / UiEvent) · middleware.
 *
 * Data: 컬렉션 패턴은 `use<Pattern>Reducer(items, opts?)` (canonical, `@interactive-os/aria-kernel/patterns`).
 * Escape: React `useReducer(reduceSingleSelect, items, fromList)` 직접 (custom init / 합성).
 *
 * Knows nothing about: tokens · CSS · component vocabulary.
 */

export * from './intent/events'
export * from './intent/schema'

export { reduce } from './view-state/reduce'
export { composeReducers, applyGesture, type Reducer } from './view-state/compose'
export { singleSelect, singleCurrent, multiSelectToggle } from './view-state/selection'
export { setValue } from './view-state/value'
export { reduceSingleSelect, reduceMultiSelect, reduceRadio } from './view-state/defaults'
export { fromTree, fromList, pathAncestors } from './view-state/fromTree'
export { fromFlatTree } from './view-state/fromFlatTree'
export { useControlState } from './view-state/useControlState'
export { useEventBridge } from './view-state/useEventBridge'
export { useAnnouncer } from './patterns/useAnnouncer'
export { useSkipLink } from './patterns/skipLink'
export type { UseSkipLinkOptions, UseSkipLinkResult, SkipLinkProps } from './patterns/skipLink'
export { Landmark, LandmarksProvider, useLandmarks } from './patterns/landmarks'
export type { LandmarkEntry, LandmarkProps, LandmarkRole } from './patterns/landmarks'
export type {
  AnnounceOptions,
  AnnouncerRegionProps,
  UseAnnouncerOptions,
  UseAnnouncerResult,
} from './patterns/useAnnouncer'
export { useFocusBridge, useFocusOnRemove, useFocusOnInsert } from './read/focus'
export type {
  UseFocusOnRemoveOptions, UseFocusOnRemoveResult,
  UseFocusOnInsertOptions, UseFocusOnInsertResult,
} from './read/focus'
// useControlValue: 내부 (combobox/comboboxGrid query 입력) — 외부 export 안 함.
// controlled/uncontrolled 표면은 #148 §7 폐기. 추후 combobox 합성 재설계 시 제거.

export { useRovingTabIndex } from './read/roving/useRovingTabIndex'
export { useSpatialNavigation } from './read/roving/useSpatialNavigation'
export { useActiveDescendant } from './read/roving/useActiveDescendant'

export {
  composeAxes, axisKeys, tagAxis, parentOf, siblingsOf, enabledSiblings,
  navigate, activate, toggle, expand, escape, typeahead, treeNavigate, treeExpand,
  multiSelect, select, numericStep,
  KEYS, gridNavigate, gridMultiSelect,
  type Axis, type Chord, type KeyName,
} from './input/keyboard/axes'
export {
  navigateOnActivate,
  selectionFollowsFocus,
  expandBranchOnActivate,
  expandOnActivate,
  composeGestures,
  activateProps,
  type GestureHelper,
} from './input/gesture'

// APG ↔ axis 정합 매트릭스 (EPIC #121).
export { APG_KEYBOARD_SPEC, allApgChords, type ApgEntry } from './spec/apgKeyboardSpec'
export {
  APG_PATTERN_EXAMPLE_SPEC,
  ApgExampleSchema,
  ApgPatternExampleSchema,
  ApgPatternExampleSpecSchema,
  allApgExamples,
  type ApgExample,
  type ApgPatternExample,
} from './spec/apgExampleSpec'
export { IMPL_CHORDS } from './spec/implChords'
export { normalizeChord, normalizeChordSet } from './spec/normalizeChord'
export {
  UNIVERSAL_EXTRA, PATTERN_EXTRA_ALLOW, PATTERN_APG_WAIVE,
} from './spec/apgCoverageAllowlist'
export {
  ApgClauseSchema,
  ApgClauseSpecSchema,
  type ApgClause,
  type ApgClauseSpec,
} from './spec/apgClauseSpec'

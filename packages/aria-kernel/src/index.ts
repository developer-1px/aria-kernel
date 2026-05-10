/**
 * @p/aria-kernel — APG-correct headless behavior layer.
 *
 * Owns: axis composition · roving tabindex · gesture/intent split · patterns ·
 * shared data vocabulary (NormalizedData / UiEvent) · middleware.
 *
 * Optional store adapter (resource / feature) at `@p/aria-kernel/store`.
 * Demo quick-start helpers at `@p/aria-kernel/local`.
 *
 * Knows nothing about: tokens · CSS · component vocabulary.
 */

export * from './types'
export * from './schema'

export type {
  RootProps, ItemProps,
  PatternProps, ControlProps,
  BaseItem, TreeItem,
  BasePatternOptions, CollectionOptions,
} from './patterns/types'

export { reduce } from './state/reduce'
export { composeReducers, applyGesture, type Reducer } from './state/compose'
export { singleSelect, singleCurrent, multiSelectToggle } from './state/selection'
export { setValue } from './state/value'
export { reduceWithDefaults, reduceWithMultiSelect, reduceWithRadio } from './state/defaults'
export { fromTree, fromList, pathAncestors } from './state/fromTree'
export { fromFlatTree } from './state/fromFlatTree'
export { useControlState } from './state/useControlState'
export { useEventBridge } from './state/useEventBridge'
export { useControlValue } from './state/useControlValue'

export { useRovingTabIndex } from './roving/useRovingTabIndex'
export { useSpatialNavigation } from './roving/useSpatialNavigation'
export { useActiveDescendant } from './roving/useActiveDescendant'

export {
  composeAxes, axisKeys, tagAxis, parentOf, siblingsOf, enabledSiblings,
  navigate, activate, toggle, expand, escape, typeahead, treeNavigate, treeExpand,
  multiSelect, select, numericStep,
  KEYS, matchChord, matchAnyChord, matchEventToChord, gridNavigate, gridMultiSelect,
  type Axis, type Chord, type KeyName,
} from './axes'
export {
  navigateOnActivate,
  selectionFollowsFocus,
  expandBranchOnActivate,
  expandOnActivate,
  composeGestures,
  activateProps,
  type GestureHelper,
} from './gesture'

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

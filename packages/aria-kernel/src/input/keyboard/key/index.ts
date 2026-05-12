/**
 * key — 키보드 이벤트의 정규화 형태 (KeySpec) + KeyboardEvent 변환 유틸.
 *
 * axes 의 trigger 매칭에서 받는 SSOT shape.
 */

/** KeySpec — `key` 와 modifier flag 의 정규화된 키 shape. */
export interface KeySpec {
  key: string
  ctrl?: boolean
  alt?: boolean
  meta?: boolean
  shift?: boolean
}

/** KeySpec → 인쇄 가능 단일 문자 여부. typeahead 트리거 판정용. */
export const isPrintable = (k: KeySpec): boolean =>
  k.key.length === 1 && /\S/.test(k.key) && !k.ctrl && !k.alt && !k.meta

/** KeyboardEvent (DOM/React) → KeySpec 정규화 변환. */
export const fromKeyboardEvent = (e: {
  key: string; ctrlKey: boolean; altKey: boolean; metaKey: boolean; shiftKey: boolean
}): KeySpec => ({
  key: e.key, ctrl: e.ctrlKey, alt: e.altKey, meta: e.metaKey, shift: e.shiftKey,
})

export { useShortcut, onShortcut } from './useShortcut'
export { bindGlobalKeyMap } from './bindGlobalKeyMap'
export { useKeyMap } from './useKeyMap'
export { routeInsideEditable, isEditable, type InsideEditableMode, type RouterDecision } from './insideEditable'
export { BLUR_RACE_DELAY_MS } from './timing'
export {
  useShortcutRegistry,
  ShortcutRegistryProvider,
  type ShortcutEntry,
  type ShortcutRegistry,
  type CheatsheetBinding,
  type CheatsheetGroup,
  type Scope,
} from './useShortcutRegistry'

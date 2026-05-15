import { fromKeyMap, type Axis } from './axis'
import { KEYS } from './keys'

/**
 * openControl — popup open/close 양방향 chord.
 *
 * APG combobox 의 `Alt+ArrowDown` (open, focus 유지) / `Alt+ArrowUp` (close).
 * 다른 popup-bearing 패턴 (tree picker 등) 에서도 재사용 가능.
 *
 * `escape` axis 는 Escape 키 → close 단방향. 본 axis 는 Alt+화살표 양방향. host 가
 * onEvent 의 `{type:'open', open}` 을 받아 실제 popup 토글.
 */
export const openControl: Axis = fromKeyMap([
  ['Alt+' + KEYS.ArrowDown, { type: 'open', open: true }],
  ['Alt+' + KEYS.ArrowUp, { type: 'open', open: false }],
])

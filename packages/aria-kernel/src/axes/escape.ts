import { fromKeyMap, type Axis } from './axis'
import { INTENT_CHORDS } from './intentChords'

/** escapeKeys — 선언형 SSOT. escape axis 가 응답하는 chord 의 key 이름. */
export const escapeKeys = (): readonly string[] => [INTENT_CHORDS.escape.close]

/**
 * escape — Escape 키 → `{type:'open', id, open:false}` 직렬 emit.
 *
 * 키는 `INTENT_CHORDS.escape.close` 에서 import — SSOT.
 * Menu/Combobox/Dialog 의 닫기 의도를 axis 로 박제. 어느 layer 가 닫힐지는 host 가
 * onEvent 에서 결정.
 */
export const escape: Axis = fromKeyMap([
  [INTENT_CHORDS.escape.close, { type: 'open', open: false }],
] as never)

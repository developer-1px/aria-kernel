import { fromKeyMap, type Axis } from './axis'
import { INTENT_CHORDS } from './intentChords'
import { ROOT } from '../intent/events'

/** escapeKeys — 선언형 SSOT. escape axis 가 응답하는 chord 의 key 이름. */
export const escapeKeys = (): readonly string[] => [INTENT_CHORDS.escape.close]

/**
 * escape — Escape 키 → `{type:'open', id:ROOT, open:false}` 직렬 emit.
 *
 * Esc 의 ARIA 의미는 컨테이너 단위 (popup close) — 항목이 아니다. 따라서 emit id 는
 * activeId 가 아니라 ROOT 로 고정. dispatcher 의 focusId 자동 주입을 우회.
 */
export const escape: Axis = fromKeyMap([
  [INTENT_CHORDS.escape.close, { type: 'open', id: ROOT, open: false }],
] as never)

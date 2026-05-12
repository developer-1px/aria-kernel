import { fromKeyMap, tagAxis, type Axis } from './axis'
import { parseTrigger } from '../../../trigger'
import { isDisabled } from '../../../intent/events'
import { INTENT_CHORDS } from './intentChords'

/**
 * toggle — Space(key) 또는 click(pointer) 시 'activate' 이벤트 발행.
 *
 * checkbox / aria-pressed button 등 ARIA APG 가 Space 만 명시한 토글 류 전용.
 * `activate` (Enter+Space+Click) 와 분리 — APG checkbox 는 Enter 미허용
 * (form submit 과 충돌). switch 는 spec 상 Enter 선택적이므로 별도 처리.
 */
const toggleOnKey = fromKeyMap([
  [INTENT_CHORDS.toggle.trigger, { type: 'activate' }],
])

export const toggle: Axis = tagAxis((d, id, t) => {
  if (isDisabled(d, id)) return null
  const p = parseTrigger(t)
  if (p.kind === 'click') return [{ type: 'activate', id }]
  return toggleOnKey(d, id, t)
}, [...toggleOnKey.chords, 'Click'])

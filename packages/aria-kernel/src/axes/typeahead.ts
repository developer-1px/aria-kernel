import { tagAxis, type Axis } from './axis'
import type { UiEvent } from '../intent/events'
import { getLabel, getTypeahead } from '../intent/events'
import { isPrintable } from '@interactive-os/keyboard'
import { findTypeaheadMatch } from '@interactive-os/keyboard-navigation'
import { parseTrigger } from '../trigger'
import { enabledSiblings } from './index'

const WINDOW_MS = 500

/**
 * typeahead — printable key → 누적 buffer (500ms window) 로 sibling label prefix 매치.
 * `{type:'typeahead', buf, deadline}` 와 매치 시 `{type:'navigate', id}` emit. APG
 * /listbox/ /menu/ /tree/ 의 type-to-search.
 *
 * 이미 의도형 (typeahead 자체가 buf+deadline payload — 결과형 navigate 와 함께
 * 합성). chord 매칭이 아닌 isPrintable 게이트라 fromKeyMap 사용 X — printable
 * 어휘 자체가 KeyMap 어휘 밖에 있다.
 */
export const typeahead: Axis = tagAxis((d, id, t) => {
  const p = parseTrigger(t)
  if (p.kind !== 'key') return null
  if (!isPrintable({
    key: p.key,
    ctrlKey: p.ctrl,
    altKey: p.alt,
    metaKey: p.meta,
    shiftKey: p.shift,
  })) return null
  const now = Date.now()
  const { buf, deadline } = getTypeahead(d)
  const nextBuf = (now < deadline ? buf : '') + p.key.toLowerCase()
  const match = findTypeaheadMatch(
    enabledSiblings(d, id).map((sid) => ({ item: sid, label: getLabel(d, sid) })),
    nextBuf,
  )
  const events: UiEvent[] = [{ type: 'typeahead', buf: nextBuf, deadline: now + WINDOW_MS }]
  if (match) events.push({ type: 'navigate', id: match })
  return events
}, ['<printable>'])

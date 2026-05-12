/**
 * bindGlobalKeyMap — window 'keydown' 에 KeyMap 을 등록. chord 매칭 시 dispatcher
 * 가 template 에 id 가 있으면 그대로, 없으면 그대로(글로벌은 focusId 없음) emit.
 *
 * editable(input/textarea/contenteditable) 안에서 modifier 없는 단일 키는
 * 타이핑을 탈취하지 않는다 (useShortcut 의 가드 어휘 그대로 흡수).
 */

import type { KeyMap, UiEventTemplate } from '../axes/axis'
import { matchAnyChord, type Chord } from '../axes/chord'
import type { UiEvent } from '../../../intent/events'
import { isEditable } from './insideEditable'

const toChords = (chord: unknown): readonly Chord[] => {
  const arr = Array.isArray(chord) ? chord : [chord]
  return arr.filter((c): c is Chord => typeof c === 'string')
}
const stringHasModifier = (s: string): boolean => /(?:Control|Ctrl|Alt|Meta|\$mod)\+/.test(s)

export const bindGlobalKeyMap = (
  entries: KeyMap,
  onEvent: (e: UiEvent) => void,
): (() => void) => {
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return
    for (const [chord, rhs] of entries) {
      const strings = toChords(chord)
      if (strings.length === 0) continue
      if (!matchAnyChord(e, strings)) continue
      // editable 안에서 modifier 없는 chord 는 탈취 금지
      const anyModified = strings.some(stringHasModifier)
      if (!anyModified && isEditable(e.target as Element | null)) return
      e.preventDefault()
      if (typeof rhs === 'function') return // 글로벌은 KeyHandler 미지원 (data/focusId 없음)
      const tmpls: UiEventTemplate[] = Array.isArray(rhs) ? rhs : [rhs]
      tmpls.forEach((t) => onEvent(t as UiEvent))
      return
    }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

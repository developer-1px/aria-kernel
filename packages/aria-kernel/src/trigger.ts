/**
 * Trigger — axis primitive 가 받는 입력 이벤트의 string 표현 (PRD #38 phase 2.5a).
 *
 * tinykeys de facto syntax 그대로. 키와 클릭을 같은 어휘로 표현:
 *   "Escape" · "Shift+Tab" · "$mod+c" · "ArrowDown"     ← key
 *   "Click" · "Shift+Click" · "$mod+Click" · "Alt+Click" ← click
 *
 * boolean modifier map (`{ctrl?, alt?, meta?, shift?}`) 폐기됨. 매칭은 string 비교 +
 * `parseChord` 캐시로 O(1) 룩업.
 */

import type { Chord } from './input/keyboard/axes/chord'
import { parseChord } from './input/keyboard/axes/chord'

export type Trigger = Chord

/**
 * keyTrigger — KeyboardEvent 또는 chord string 으로부터 Trigger 빌더.
 * 일반 사용처는 `eventToChord(e)` 권장.
 */
export const keyTrigger = (chord: Chord): Trigger => chord

/**
 * clickTrigger — modifier 조합으로부터 click Trigger 빌더.
 * `{shift:true}` → `"Shift+Click"`. modifier 없으면 `"Click"`.
 */
export const clickTrigger = (mods: { ctrl?: boolean; alt?: boolean; meta?: boolean; shift?: boolean } = {}): Trigger => {
  const parts: string[] = []
  if (mods.ctrl)  parts.push('Control')
  if (mods.alt)   parts.push('Alt')
  if (mods.meta)  parts.push('Meta')
  if (mods.shift) parts.push('Shift')
  parts.push('Click')
  return parts.join('+')
}

/**
 * eventToChord — KeyboardEvent | MouseEvent → Trigger string.
 * 경계에서 한 번만 변환, 이후 모든 layer 가 string 으로 다룬다.
 */
export const eventToChord = (e: KeyboardEvent | MouseEvent): Trigger => {
  const parts: string[] = []
  if (e.ctrlKey)  parts.push('Control')
  if (e.altKey)   parts.push('Alt')
  if (e.metaKey)  parts.push('Meta')
  if (e.shiftKey) parts.push('Shift')
  // KeyboardEvent 는 .key, MouseEvent 는 click 으로 식별
  const key = (e as KeyboardEvent).key
  parts.push(typeof key === 'string' ? (key === ' ' ? 'Space' : key) : 'Click')
  return parts.join('+')
}

/**
 * triggerMatches — Trigger 가 chord 에 매치되는지. 정규화된 ParsedChord 비교.
 * 둘 다 parseChord 캐시 통과 → modifier flag · key 비교.
 */
export const triggerMatches = (t: Trigger, chord: Chord): boolean => {
  const a = parseChord(t)
  const b = parseChord(chord)
  return a.key === b.key
    && Boolean(a.ctrl)  === Boolean(b.ctrl)
    && Boolean(a.alt)   === Boolean(b.alt)
    && Boolean(a.meta)  === Boolean(b.meta)
    && Boolean(a.shift) === Boolean(b.shift)
}

/** isClickTrigger — trigger 가 click 계열인지. */
export const isClickTrigger = (t: Trigger): boolean => parseChord(t).key === 'Click'

/** isKeyTrigger — trigger 가 key 계열인지. */
export const isKeyTrigger = (t: Trigger): boolean => !isClickTrigger(t)

/**
 * parseTrigger — 기존 axis 본체가 쓰던 `{kind, key, ctrl, alt, meta, shift}` 모양으로
 * trigger 를 풀어냄. 마이그 기간 임시 어댑터 — phase 5 에서 axis 본체가
 * AxisData 로 재작성되면 쓰임 사라짐.
 */
export type ParsedTrigger =
  | { kind: 'key';   key: string; ctrl: boolean; alt: boolean; meta: boolean; shift: boolean }
  | { kind: 'click'; ctrl: boolean; alt: boolean; meta: boolean; shift: boolean }

export const parseTrigger = (t: Trigger): ParsedTrigger => {
  const p = parseChord(t)
  const mods = {
    ctrl:  Boolean(p.ctrl),
    alt:   Boolean(p.alt),
    meta:  Boolean(p.meta),
    shift: Boolean(p.shift),
  }
  if (p.key === 'Click') return { kind: 'click', ...mods }
  return { kind: 'key', key: p.key, ...mods }
}

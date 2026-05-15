/**
 * Trigger — axis primitive 가 받는 입력 이벤트의 string 표현 (PRD #38 phase 2.5a).
 *
 * Keyboard chords use `@interactive-os/keyboard` aria-keyshortcuts notation.
 * Click remains an aria-kernel trigger because it is not a keyboard input:
 *   "Escape" · "Shift+Tab" · "Control+c" · "ArrowDown" ← key
 *   "Click" · "Shift+Click" · "Control+Click"          ← click
 *
 * boolean modifier map (`{ctrl?, alt?, meta?, shift?}`) 폐기됨. 매칭은 string 비교 +
 */

import { parseShortcut } from '@interactive-os/keyboard'
import type { Chord } from './input/keyboard/axes'

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
 * triggerMatches — Trigger 가 chord 에 매치되는지.
 */
export const triggerMatches = (t: Trigger, chord: Chord): boolean => {
  const a = parseTrigger(t)
  const b = parseTrigger(chord)
  if (a.kind !== b.kind) return false
  if (a.kind === 'click' && b.kind === 'click') {
    return a.ctrl === b.ctrl && a.alt === b.alt && a.meta === b.meta && a.shift === b.shift
  }
  if (a.kind === 'click' || b.kind === 'click') return false
  return a.key === b.key
    && a.ctrl === b.ctrl
    && a.alt === b.alt
    && a.meta === b.meta
    && a.shift === b.shift
}

/** isClickTrigger — trigger 가 click 계열인지. */
export const isClickTrigger = (t: Trigger): boolean => parseTrigger(t).kind === 'click'

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
  if (t === 'Click' || t.endsWith('+Click')) return parseClickTrigger(t)

  const [shortcut] = parseShortcut(t)
  if (!shortcut) throw new Error(`Invalid trigger: "${t}"`)
  return {
    kind: 'key',
    key: shortcut.key,
    ctrl: shortcut.control,
    alt: shortcut.alt,
    meta: shortcut.meta,
    shift: shortcut.shift,
  }
}

const parseClickTrigger = (t: Trigger): ParsedTrigger => {
  const modifiers = t === 'Click' ? [] : t.slice(0, -'+Click'.length).split('+')
  const out = { kind: 'click' as const, ctrl: false, alt: false, meta: false, shift: false }
  for (const modifier of modifiers) {
    switch (modifier.toLowerCase()) {
      case 'control':
      case 'ctrl':
        out.ctrl = true
        break
      case 'alt':
        out.alt = true
        break
      case 'meta':
        out.meta = true
        break
      case 'shift':
        out.shift = true
        break
      default:
        throw new Error(`Invalid click trigger: "${t}"`)
    }
  }
  return out
}

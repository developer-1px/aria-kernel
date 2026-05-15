import { fromKeyMap, tagAxis, type Axis, type KeyHandler } from './axis'
import { parseTrigger } from '../trigger'
import { getSelectAnchor, type NormalizedData, type UiEvent } from '../intent/events'
import { enabledSiblings } from './index'
import { INTENT_CHORDS } from './intentChords'

/**
 * multiSelect — `aria-multiselectable` axis. anchor-range, Ctrl+A, Shift+Click.
 * single-select 단일 토글은 별도 `select` axis. activate (default action) 와도 분리.
 * Click/Space toggle, Shift+Arrow / Shift+Click anchor-range, Ctrl/Meta+A all.
 * Emits unified `select { ids, to? }` events for per-id and batch selection.
 *
 * Range semantics — de facto (Mac Finder · Shopify · Radix · React Aria):
 *   anchor..current = selected · everything outside that range = deselected.
 *   anchor is set by the most recent `select` event (reduce.ts handles).
 *
 * APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/  (Selection)
 */

/** Build [navigate, deselect-outside, select-inside] from anchor to `nextId`. */
const rangeFrom = (d: NormalizedData, currentId: string, nextId: string): UiEvent[] => {
  const ids = enabledSiblings(d, currentId)
  const anchor = getSelectAnchor(d) ?? currentId
  const a = ids.indexOf(anchor)
  const b = ids.indexOf(nextId)
  if (a < 0 || b < 0) return [{ type: 'navigate', id: nextId }, { type: 'select', ids: [nextId] }]
  const [from, to] = a <= b ? [a, b] : [b, a]
  const inRange = ids.slice(from, to + 1)
  const outRange = ids.filter((x) => !inRange.includes(x))
  const events: UiEvent[] = [{ type: 'navigate', id: nextId }]
  if (outRange.length) events.push({ type: 'select', ids: outRange, to: false })
  events.push({ type: 'select', ids: inRange, to: true })
  return events
}

const rangeStep = (delta: number): KeyHandler => (d, id) => {
  const ids = enabledSiblings(d, id)
  const idx = ids.indexOf(id)
  if (idx < 0) return null
  const nextIdx = idx + delta
  if (nextIdx < 0 || nextIdx >= ids.length) return null
  return rangeFrom(d, id, ids[nextIdx])
}

/** Shift+Space — anchor → 현재 focus 범위 확장(포커스 이동 없음). APG listbox Selection. */
const rangeAtFocus: KeyHandler = (d, id) => {
  const ids = enabledSiblings(d, id)
  if (!ids.length) return null
  const anchor = getSelectAnchor(d) ?? id
  const a = ids.indexOf(anchor)
  const b = ids.indexOf(id)
  if (a < 0 || b < 0) return [{ type: 'select', ids: [id], to: true }]
  const [from, to] = a <= b ? [a, b] : [b, a]
  const inRange = ids.slice(from, to + 1)
  const outRange = ids.filter((x) => !inRange.includes(x))
  const events: UiEvent[] = []
  if (outRange.length) events.push({ type: 'select', ids: outRange, to: false })
  events.push({ type: 'select', ids: inRange, to: true })
  return events
}

/** $mod+Shift+Home/End — focus 를 첫/마지막으로 이동 + 그 사이 전체 선택. APG listbox Selection. */
const rangeToEdge = (edge: 'first' | 'last'): KeyHandler => (d, id) => {
  const ids = enabledSiblings(d, id)
  if (!ids.length) return null
  const target = edge === 'first' ? ids[0] : ids[ids.length - 1]
  return rangeFrom(d, id, target)
}

const multiSelectKeys: Axis = fromKeyMap([
  // Space — toggle add/remove + anchor 갱신.
  [INTENT_CHORDS.multiSelect.toggle, (d, id) => {
    const cur = Boolean(d.entities[id]?.selected)
    return [{ type: 'select', ids: [id], to: !cur, anchor: true }]
  }],
  [INTENT_CHORDS.multiSelect.selectAll, (d, id) => [{ type: 'select', ids: enabledSiblings(d, id), to: true }]],
  [INTENT_CHORDS.multiSelect.rangeDown, rangeStep(+1)],
  [INTENT_CHORDS.multiSelect.rangeUp, rangeStep(-1)],
  [INTENT_CHORDS.multiSelect.rangeAtFocus, rangeAtFocus],
  [INTENT_CHORDS.multiSelect.rangeToFirst, rangeToEdge('first')],
  [INTENT_CHORDS.multiSelect.rangeToLast,  rangeToEdge('last')],
])

export const multiSelect: Axis = tagAxis((d, id, t) => {
  const p = parseTrigger(t)
  if (p.kind === 'click') {
    if (p.shift) return rangeFrom(d, id, id)
    if (p.meta || p.ctrl) {
      const cur = Boolean(d.entities[id]?.selected)
      return [
        { type: 'navigate', id },
        { type: 'select', ids: [id], to: !cur, anchor: true },
      ]
    }
    return [{ type: 'navigate', id }, { type: 'select', ids: [id], anchor: true }]
  }
  return multiSelectKeys(d, id, t)
}, [...multiSelectKeys.chords, 'Click', 'Shift+Click', 'Meta+Click', 'Control+Click'])

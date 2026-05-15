/**
 * AxisData — `Axis` 의 데이터-형 미러 (PRD #38 phase 2).
 *
 * 기존 `Axis` 는 `(data, id, trigger) => UiEvent[]|null` 함수. 키맵이 closure 에
 * 흡수되어 외부에서 추출 불가. AxisData 는 plain array — 100% 직렬화·grep 가능.
 *
 * 마이그 기간: 둘 공존. phase 5~6 에서 axis 본체가 데이터로 재작성되면 함수형 폐기.
 */

import type { UiEvent } from '../intent/events'
import type { Trigger } from '../trigger'
import { triggerMatches } from '../trigger'
import { parseShortcut } from '@interactive-os/keyboard'
import type { Chord } from './axis'
import type { UiEventTemplate } from './axis'

/** AxisEntry — `[chord(s), intent template(s)]` tuple. */
export type AxisEntry = readonly [
  Chord | readonly Chord[],
  UiEventTemplate | readonly UiEventTemplate[],
]

/** AxisData — plain array, 직렬화 가능, grep 가능. */
export type AxisData = readonly AxisEntry[]

const applyTemplate = (t: UiEventTemplate, focusId: string): UiEvent => {
  const hasId = typeof (t as { id?: unknown }).id === 'string' && (t as { id: string }).id.length > 0
  return (hasId ? t : { ...t, id: focusId }) as UiEvent
}

/**
 * runAxis — AxisData 를 string Trigger 에 대해 실행. 첫 매치 entry 의 template(s) 을
 * UiEvent[] 로 확장 (id 비면 focusId 자동 주입). 매치 없으면 null.
 */
export const runAxis = (axis: AxisData, focusId: string, trigger: Trigger): UiEvent[] | null => {
  for (const [chord, rhs] of axis) {
    const list = Array.isArray(chord) ? (chord as readonly Chord[]) : [chord as Chord]
    const hit = list.some((s) => triggerMatches(trigger, s))
    if (!hit) continue
    const tmpls = Array.isArray(rhs) ? (rhs as readonly UiEventTemplate[]) : [rhs as UiEventTemplate]
    return tmpls.map((t) => applyTemplate(t, focusId))
  }
  return null
}

/** axisChords — axis 의 모든 chord 를 평탄화 (중복 제거). */
export const axisChords = (axis: AxisData): readonly Chord[] => {
  const seen = new Set<Chord>()
  for (const [chord] of axis) {
    const list = Array.isArray(chord) ? (chord as readonly Chord[]) : [chord as Chord]
    for (const c of list) seen.add(c)
  }
  return [...seen]
}

/** axisKeys — axis 의 chord 에서 key 부분만 추출 (display 용 dedup). */
export const axisKeys = (axis: AxisData): readonly string[] => {
  const seen = new Set<string>()
  for (const c of axisChords(axis)) {
    const [shortcut] = parseShortcut(c)
    if (shortcut) seen.add(shortcut.key)
  }
  return [...seen]
}

/** composeAxisData — 여러 AxisData 를 우선순위 순으로 concat. */
export const composeAxisData = (...axes: AxisData[]): AxisData => axes.flat()

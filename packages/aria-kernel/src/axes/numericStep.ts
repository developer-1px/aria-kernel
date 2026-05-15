import { fromKeyMap, type Axis, type KeyHandler } from './axis'
import type { UiEvent } from '../intent/events'
import { INTENT_CHORDS } from './intentChords'

/** entity 의 value/min/max/step 을 추출. */
const readBounds = (d: { entities: Record<string, unknown> }, id: string) => {
  const ent = (d.entities[id] ?? {}) as Record<string, unknown>
  return {
    value: Number(ent.value ?? 0),
    min: Number(ent.min ?? 0),
    max: Number(ent.max ?? 100),
    step: Number(ent.step ?? 1),
  }
}

/** value 변환 함수를 받아 KeyHandler 로 — 결과가 현재값과 같으면 null. */
const stepValue = (next: (b: ReturnType<typeof readBounds>) => number): KeyHandler =>
  (d, id) => {
    const b = readBounds(d, id)
    const v = next(b)
    if (v === b.value) return null
    return [{ type: 'value', id, value: v } as UiEvent]
  }

/**
 * numericStep — Slider/Splitter/Spinbutton Arrow/Page/Home/End → value step.
 *
 * 키 매핑은 `INTENT_CHORDS.numericStep` (orientation 별 inc/dec, min/max, pageInc/Dec) 에서 import (SSOT).
 * KeyMap form — chord 매핑 선언, value 산수는 KeyHandler factory 캡슐화.
 *
 * APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *      https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 *      https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */
export const numericStep = (orientation: 'horizontal' | 'vertical' = 'horizontal'): Axis => {
  const o = INTENT_CHORDS.numericStep[orientation]
  return fromKeyMap([
    [o.inc, stepValue((b) => Math.min(b.max, b.value + b.step))],
    [o.dec, stepValue((b) => Math.max(b.min, b.value - b.step))],
    [INTENT_CHORDS.numericStep.min, stepValue((b) => b.min)],
    [INTENT_CHORDS.numericStep.max, stepValue((b) => b.max)],
    [INTENT_CHORDS.numericStep.pageInc, stepValue((b) => Math.min(b.max, b.value + b.step * 10))],
    [INTENT_CHORDS.numericStep.pageDec, stepValue((b) => Math.max(b.min, b.value - b.step * 10))],
  ])
}

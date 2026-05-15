import { describe, expect, it } from 'vitest'
import { ALL_AXIS_EMITS } from '../axes/emits'
import { REDUCE_PRESETS } from '../state/handles'

/**
 * EPIC #95 Layer 2.3 — axis emits ⊆ ∪(reducer presets) 정합.
 *
 * 각 axis 가 emit 하는 모든 event type 이 적어도 하나의 reducer preset 에서 처리되는지 검증.
 * 둘 다 정적 카탈로그라 코드와 카탈로그가 어긋나면 (axis 코드 변경 후 emits.ts 미갱신, 또는
 * reducer 변경 후 handles.ts 미갱신) 다른 회귀 검사로도 잡히지만, 본 검사는
 * axis ↔ reducer 의 의미 매핑 자체가 빈 곳을 표면화.
 */
describe('axis-reducer coverage (EPIC #95 Layer 2.3)', () => {
  const allHandled = new Set<string>([
    ...REDUCE_PRESETS.reduceSingleSelect,
    ...REDUCE_PRESETS.reduceMultiSelect,
    ...REDUCE_PRESETS.reduceRadio,
  ])

  it('모든 axis emit 이 어떤 reducer preset 에서 cover 된다', () => {
    const uncovered: { axis: string; type: string }[] = []
    for (const [axisName, emits] of Object.entries(ALL_AXIS_EMITS)) {
      for (const t of emits) {
        if (!allHandled.has(t)) uncovered.push({ axis: axisName, type: t })
      }
    }
    expect(uncovered).toEqual([])
  })

  it.each(Object.keys(REDUCE_PRESETS))('preset %s — handles 카탈로그가 비어있지 않다', (preset) => {
    expect(REDUCE_PRESETS[preset].length).toBeGreaterThan(0)
  })
})

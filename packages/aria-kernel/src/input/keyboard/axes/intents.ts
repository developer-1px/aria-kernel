/**
 * AxisIntent — axis 가 emit 하는 추상 의도 어휘 (PRD #38 phase 3c, /conflict 해소).
 *
 * UiEvent 가 "본질 행동" (expand/navigate/activate) 이라면, AxisIntent 는
 * "사용자 입력의 의도" — DOM 상태에 따라 어떤 본질 행동으로 풀릴지 결정되는 추상.
 *
 * dispatch 흐름:
 *   axis emit → AxisIntent | UiEvent
 *             ↓
 *   resolver: AxisIntent + data → UiEvent[]
 *             ↓
 *   reducer: UiEvent → state
 *
 * AxisIntent 는 reducer 가 직접 받지 않는다. resolver 가 모두 흡수.
 */

/** treeStep — treeExpand 의 ArrowRight/ArrowLeft/Enter 추상 의도. branch 분기는 resolver. */
export type TreeStepIntent = {
  type: 'treeStep'
  id: string
  /**
   * forward  = ArrowRight (펼치기 / 자식 진입 / 다음 visible)
   * backward = ArrowLeft  (닫기 / 부모로)
   * toggle   = Enter/Space (펼침↔닫힘)
   */
  dir: 'forward' | 'backward' | 'toggle'
}

/** expandSeed — expand axis 의 ArrowRight/ArrowLeft 추상 의도. seed 자식 navigate 합성. */
export type ExpandSeedIntent = {
  type: 'expandSeed'
  id: string
  /** open: 펼치고 첫 자식 focus / close: 부모 닫고 부모 focus */
  dir: 'open' | 'close'
}

/** pageStep — pageNavigate 의 PageUp/PageDown 추상 의도. step N 만큼 sibling 이동. */
export type PageStepIntent = {
  type: 'pageStep'
  id: string
  dir: 'next' | 'prev'
  step: number
}

export type AxisIntent = TreeStepIntent | ExpandSeedIntent | PageStepIntent

export const isAxisIntent = (e: { type: string }): e is AxisIntent =>
  e.type === 'treeStep' || e.type === 'expandSeed' || e.type === 'pageStep'

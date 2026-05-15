import { fromKeyMap, type Axis } from './axis'
import { INTENT_CHORDS } from './intentChords'

/**
 * pageNavigate — PageUp/PageDown 키로 sibling 단위 N 칸 이동.
 *
 * 키는 `INTENT_CHORDS.pageNavigate` (prev/next) 에서 import — SSOT.
 * step=1 이면 feed 식 "다음 article", step>1 이면 grid/list 식 page 점프.
 *
 * Intent-form (PRD #38 phase 3c): chord → `{type:'pageStep', dir, step}` 추상
 * 의도 emit. sibling N 칸 산수는 resolver 가 담당.
 */
export const pageNavigate =
  (_orientation: 'vertical' | 'horizontal' = 'vertical', step = 1): Axis =>
    fromKeyMap([
      [INTENT_CHORDS.pageNavigate.next, { type: 'pageStep', dir: 'next', step } as never],
      [INTENT_CHORDS.pageNavigate.prev, { type: 'pageStep', dir: 'prev', step } as never],
    ])

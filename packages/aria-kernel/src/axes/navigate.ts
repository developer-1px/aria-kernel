import { fromKeyMap, type Axis } from './axis'
import { INTENT_CHORDS } from './intentChords'

/**
 * navigate — siblings prev/next (단일 부모). visible-flat (collapse 반영) 은 treeNavigate.
 * orientation 별 prev/next/start/end 키는 `INTENT_CHORDS.navigate` 에서 import (SSOT).
 *
 * Intent-form (PRD #38 phase 3): axis 는 `{type:'navigate', dir}` 만 emit.
 * 다음 id 산수는 reducer (`resolveNavigate`) 가 data + 현재 focus 로 계산.
 */
export const navigate =
  (orientation: 'vertical' | 'horizontal' = 'vertical'): Axis => {
    const o = INTENT_CHORDS.navigate[orientation]
    return fromKeyMap([
      [o.prev, { type: 'navigate', dir: 'prev' }],
      [o.next, { type: 'navigate', dir: 'next' }],
      [INTENT_CHORDS.navigate.start, { type: 'navigate', dir: 'start' }],
      [INTENT_CHORDS.navigate.end, { type: 'navigate', dir: 'end' }],
    ])
  }

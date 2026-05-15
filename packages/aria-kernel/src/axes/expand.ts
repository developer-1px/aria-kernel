import { fromKeyMap, type Axis } from './axis'
import { INTENT_CHORDS } from './intentChords'

/**
 * expand — accordion·menu 의 단순 open/close (aria-expanded). branch leaf 통과 +
 * nextVisibleLeaf 도출은 treeExpand. 키 매핑은 `INTENT_CHORDS.expand` SSOT.
 *
 * Intent-form (PRD #38 phase 3c): chord → `{type:'expandSeed', dir:'open'|'close'}`
 * 추상 의도 emit. expand+navigate 합성은 resolver 가 담당.
 */
export const expand: Axis = fromKeyMap([
  [INTENT_CHORDS.expand.open,  { type: 'expandSeed', dir: 'open' }],
  [INTENT_CHORDS.expand.close, { type: 'expandSeed', dir: 'close' }],
] as never)

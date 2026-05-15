import { fromKeyMap, type Axis } from './axis'
import { INTENT_CHORDS } from './intentChords'

/**
 * treeNavigate — DFS visible 순회 (collapse 반영). 단일 부모 prev/next 는 navigate.
 *
 * Intent-form (PRD #38 phase 3): chord → `{type:'navigate', dir}` 만 emit.
 * 다음 id 산수 (visible-flat) 는 reducer (`resolveNavigate`) 가 담당.
 */
export const treeNavigate: Axis = fromKeyMap([
  [INTENT_CHORDS.treeNavigate.next,  { type: 'navigate', dir: 'visibleNext' }],
  [INTENT_CHORDS.treeNavigate.prev,  { type: 'navigate', dir: 'visiblePrev' }],
  [INTENT_CHORDS.navigate.start,     { type: 'navigate', dir: 'start' }],
  [INTENT_CHORDS.navigate.end,       { type: 'navigate', dir: 'end' }],
])

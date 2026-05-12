import { fromKeyMap, type Axis } from './axis'
import { INTENT_CHORDS } from './intentChords'

/**
 * treeExpand — APG /treeview/ "Right/Left Arrow". axis 는 추상 의도 (`treeStep`)
 * 만 emit. branch 분기 (leaf/branchOpen/branchClosed) 는 resolver 가 담당.
 *
 * Intent-form (PRD #38 phase 3c, /conflict resolver layer):
 *   ArrowRight → {type:'treeStep', dir:'forward'}
 *   ArrowLeft  → {type:'treeStep', dir:'backward'}
 *   Enter/Space → {type:'treeStep', dir:'toggle'}
 */
export const treeExpand: Axis = fromKeyMap([
  [INTENT_CHORDS.treeExpand.open,  { type: 'treeStep', dir: 'forward' }],
  [INTENT_CHORDS.treeExpand.close, { type: 'treeStep', dir: 'backward' }],
  [INTENT_CHORDS.activate.trigger, { type: 'treeStep', dir: 'toggle' }],
] as never)

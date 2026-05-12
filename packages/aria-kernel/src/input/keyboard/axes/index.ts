import { ROOT, type NormalizedData } from '../../../intent/events'

export { composeAxes, fromKeyMap, tagAxis, axisKeys, type Axis, type KeyHandler, type KeyMap } from './axis'

/**
 * parentOf — returns parent id, or ROOT sentinel if id is top-level.
 * Returns undefined only if id isn't found anywhere.
 */
export const parentOf = (d: NormalizedData, id: string): string | undefined => {
  if (d.meta?.root?.includes(id)) return ROOT
  return Object.entries(d.relationships).find(([, kids]) => kids.includes(id))?.[0]
}

/** siblingsOf — id 와 같은 부모를 공유하는 형제 id 배열 (자기 자신 포함). top-level 이면 root 배열. */
export const siblingsOf = (d: NormalizedData, id: string): string[] => {
  const p = parentOf(d, id)
  if (!p) return []
  if (p === ROOT) return d.meta?.root ?? []
  return d.relationships[p] ?? []
}

/** enabledSiblings — `siblingsOf` 결과에서 disabled entity 를 제거. navigate/multiSelect 의 활성 후보. */
export const enabledSiblings = (d: NormalizedData, id: string): string[] =>
  siblingsOf(d, id).filter((sid) => !d.entities[sid]?.disabled)

export { navigate } from './navigate'
export { expand } from './expand'
export { activate } from './activate'
export { toggle } from './toggle'
export { submenuOpen, submenuClose, submenuOpenDown, submenuOpenUp } from './submenu'
export { typeahead } from './typeahead'
export { treeNavigate } from './treeNavigate'
export { treeExpand } from './treeExpand'
export { multiSelect } from './multiSelect'
export { select } from './select'
export { numericStep } from './numericStep'
export { gridNavigate } from './gridNavigate'
export { gridMultiSelect } from './gridMultiSelect'
export { escape } from './escape'
export { openControl } from './openControl'
export { pageNavigate } from './pageNavigate'
export { matchChord, matchAnyChord, matchEventToChord, type Chord } from './chord'
export { KEYS, type KeyName } from './keys'
export { INTENT_CHORDS } from './intentChords'
export {
  ALL_AXIS_EMITS,
  activateEmits, escapeEmits, navigateEmits, typeaheadEmits,
  multiSelectEmits, numericStepEmits, gridNavigateEmits, submenuEmits,
  toggleEmits, treeExpandEmits, treeNavigateEmits, pageNavigateEmits,
  expandEmits, selectEmits, gridMultiSelectEmits,
} from './emits'

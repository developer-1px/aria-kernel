import { fromKeyMap, tagAxis, type Axis } from './axis'
import { parseTrigger } from '../trigger'
import { isDisabled } from '../intent/events'
import { INTENT_CHORDS } from './intentChords'

/**
 * select — single-select chord (`Space` / click). Emits `{type:'select', id}`.
 * APG `/listbox/` `/treeview/` single-select 의 manual 모드에 매핑.
 *
 * key chord 매칭 + template 합성은 `fromKeyMap` 가 처리. click 과 isDisabled
 * gate 는 axis wrapper 에 유지.
 *
 * `aria-selected` 만 책임. `Enter` (default action) 은 activate 가 보유 — 합성
 * 순서로 분리: composeAxes(..., select, ..., activate) → Space 는 select 흡수,
 * Enter 는 activate 로 fall-through.
 *
 * focus-driven selection-follows-focus 는 `gesture/selectionFollowsFocus` 가
 * navigate→select 변환으로 담당. select axis 는 manual chord 만.
 */
const selectByKey = fromKeyMap([
  [INTENT_CHORDS.select.toggle, (_d, id) => [{ type: 'select', ids: [id] }]],
])

export const select: Axis = tagAxis((d, id, t) => {
  if (isDisabled(d, id)) return null
  const p = parseTrigger(t)
  if (p.kind === 'click') return [{ type: 'select', ids: [id] }]
  return selectByKey(d, id, t)
}, [...selectByKey.chords, 'Click'])

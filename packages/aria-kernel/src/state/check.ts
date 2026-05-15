import type { Reducer } from './compose'
import { batchToggleField, singleReplaceField } from './fieldReducer'

const replaceChecked = singleReplaceField('checked')
const toggleCheckedBatch = batchToggleField('checked')

/**
 * checkToggle — `aria-checked` 축의 토글/세팅 reducer fragment.
 *
 * 처리 어휘: `check { ids; to? }` 통합 (단일/배치).
 * `to` 가 undefined 면 각 id 독립 토글, 명시되면 일괄 set (boolean | 'mixed').
 *
 * APG-aligned: checkbox group · switch group · 일반 multi-toggle.
 *
 * Compose with `reduce`:
 *   const myReduce = composeReducers(reduce, checkToggle)
 */
export const checkToggle: Reducer = (d, e) => {
  if (e.type === 'check') return toggleCheckedBatch(d, e.ids, e.to)
  return d
}

/**
 * singleCheck — `aria-checked` 축의 single-of-group reducer fragment.
 *
 * `check` (직접) · `activate` (Enter/Space/Click) · `select` (selection-follows-focus
 * 가 navigate→select 로 분해한 결과) 셋을 모두 처리 — radio / listbox(single) 입력을
 * 같은 모양으로 흡수. select 축의 `singleSelect` 거울.
 *
 * Compose with `reduce`:
 *   const myReduce = composeReducers(reduce, singleCheck)
 */
export const singleCheck: Reducer = (d, e) => {
  if (e.type === 'activate') return replaceChecked(d, e.id).d
  if (e.type === 'check' && e.ids.length === 1) return replaceChecked(d, e.ids[0]!).d
  if (e.type === 'select' && e.to == null && e.ids.length === 1) {
    return replaceChecked(d, e.ids[0]!).d
  }
  return d
}

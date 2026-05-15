import type { Reducer } from './compose'
import { batchReplaceField, batchToggleField, singleReplaceField } from './fieldReducer'

const replaceSelected = singleReplaceField('selected')
const replaceCurrent = singleReplaceField('current')
const replaceSelectedBatch = batchReplaceField('selected')
const toggleSelected = batchToggleField('selected')

/**
 * singleSelect — `select` / `activate` → `entity.selected` single-replace + focus 갱신.
 * APG-aligned: tabs / listbox(single) / menu / menubar.
 *
 * `select { ids, to: undefined }` plain-click 만 처리 (single-mode 는 항상 ids[0]).
 * `to` 가 정의된 batch event 는 single-mode 에서 무시.
 */
export const singleSelect: Reducer = (d, e) => {
  if (e.type === 'activate') {
    const r = replaceSelected(d, e.id)
    const prevFocus = d.meta?.focus
    if (prevFocus === e.id) return r.d
    return { ...r.d, meta: { ...r.d.meta, focus: e.id } }
  }
  if (e.type === 'select' && e.to == null && e.ids.length === 1) {
    const id = e.ids[0]!
    const r = replaceSelected(d, id)
    const prevFocus = d.meta?.focus
    if (prevFocus === id) return r.d
    return { ...r.d, meta: { ...r.d.meta, focus: id } }
  }
  return d
}

/**
 * singleCurrent — `activate` → `entity.current` single-replace. Navigation list
 * 의 `aria-current="page"` 어휘. select(컬렉션) ≠ current(landmark).
 */
export const singleCurrent: Reducer = (d, e) => {
  if (e.type !== 'activate') return d
  return replaceCurrent(d, e.id).d
}

/**
 * multiSelectToggle — multi-mode `entity.selected` reducer fragment.
 *
 * - `select { ids, to: undefined }` → batch replace (plain click — set ids selected, clear rest).
 * - `select { ids, to: true|false }` → batch set/unset (Cmd/Shift modifiers, range, all/none).
 *
 * APG-aligned: listbox(multi), tree(multi), grid(multi).
 */
export const multiSelectToggle: Reducer = (d, e) => {
  if (e.type !== 'select') return d
  if (e.to == null) return replaceSelectedBatch(d, e.ids)
  return toggleSelected(d, e.ids, e.to)
}

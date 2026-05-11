import { checkToggle, singleCheck } from './check'
import { composeReducers, type Reducer } from './compose'
import { reduce } from './reduce'
import { multiSelectToggle, singleSelect } from './selection'
import { setValue } from './value'

/**
 * reduceSingleSelect — ARIA `aria-selected` (single) 정본 합성 reducer.
 * listbox(single) · tabs · menu · toolbar · accordion 등 가장 보편 시나리오.
 *
 * 합성: select 축 single + check 축 multi-toggle + value. 두 축이 서로 다른 event
 * (`select` vs `check`/`checkMany`) 라 충돌 없이 합성.
 */
export const reduceSingleSelect: Reducer = composeReducers(reduce, singleSelect, checkToggle, setValue)

/**
 * reduceMultiSelect — ARIA `aria-multiselectable="true"` 시나리오.
 * listbox(multi) / tree(multi) / grid(multi).
 *
 * `multiSelectToggle` 가 `select{ids,to?}` (replace/additive/unset) 단일 축 처리.
 */
export const reduceMultiSelect: Reducer = composeReducers(reduce, multiSelectToggle, checkToggle, setValue)

/**
 * reduceRadio — ARIA `role="radiogroup"` 시나리오.
 * check 축이 single-of-group (singleCheck) 으로 동작. select 축은 미사용 (radio 는
 * aria-selected 가 아니라 aria-checked 로 표현).
 */
export const reduceRadio: Reducer = composeReducers(reduce, singleCheck, setValue)


import {
  ROOT, getCollectionChildren, getLabel, isDisabled,
  type NormalizedData, type UiEvent, type ValueEvent,
} from '../types'
import { matchAnyChord, toggle, axisKeys, INTENT_CHORDS } from '../axes'
import type { BaseItem, ItemProps, RootProps } from './types'

/** checkbox keymap registry — `toggle` axis 의 chord SSOT 재활용. */
const CHECKBOX_CHORDS = INTENT_CHORDS.toggle.trigger

/** checkboxKeys — `toggle` axis 에서 자동 도출. 손으로 적은 사본 0. */
export const checkboxKeys = (): readonly string[] => axisKeys(toggle)

const handleCheckboxKey = (e: React.KeyboardEvent, action: () => void): void => {
  if (!matchAnyChord(e as unknown as KeyboardEvent, CHECKBOX_CHORDS)) return
  e.preventDefault()
  action()
}

export type CheckboxState = boolean | 'mixed'

/** Options for {@link checkboxPattern}. */
export interface CheckboxOptions {
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  label?: string
  labelledBy?: string
}

/**
 * checkbox — APG `/checkbox/` recipe (single + mixed).
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * Native `<input type="checkbox">` 가 가능하면 그쪽이 우선. 본 recipe 는
 *   1) host element 가 `<button>` / `<div>` 인 케이스
 *   2) tri-state (`aria-checked="mixed"`)
 * 두 변종을 흡수. mixed → click 은 false → true 로 진행 (APG default).
 *
 * 시그니처는 `switchPattern` 정합 — `(checked, dispatch?, opts)`. dispatch 는
 * `{type:'value', value: !current}` 만 emit (mixed → true).
 *
 * @example canonical (#148)
 *   const [checked, setChecked] = useState<CheckboxState>(false)
 *   const { checkboxProps } = checkboxPattern(checked, (e) => setChecked(e.value), { label: '…' })
 */
export function checkboxPattern(
  checked: CheckboxState,
  dispatch?: (e: ValueEvent<CheckboxState>) => void,
  opts: CheckboxOptions = {},
): { checkboxProps: ItemProps } {
  const { disabled, required, invalid, label, labelledBy } = opts
  const toggle = () => {
    if (disabled) return
    dispatch?.({ type: 'value', value: checked === true ? false : true })
  }

  const checkboxProps: ItemProps = {
    role: 'checkbox',
    type: 'button',
    tabIndex: disabled ? -1 : 0,
    'aria-checked': checked === 'mixed' ? 'mixed' : Boolean(checked),
    'aria-disabled': disabled || undefined,
    'aria-required': required || undefined,
    'aria-invalid': invalid || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'data-state': checked === 'mixed' ? 'mixed' : checked ? 'checked' : 'unchecked',
    onClick: toggle,
    onKeyDown: (e: React.KeyboardEvent) => handleCheckboxKey(e, toggle),
  } as unknown as ItemProps
  return { checkboxProps }
}

/** Options for {@link useCheckboxGroupPattern}. */
export interface CheckboxGroupOptions {
  containerId?: string
  /** group 전체 비활성화. 모든 child 가 disabled 면 자동으로 true 가 된다. */
  disabled?: boolean
  /** group container `aria-label`. */
  label?: string
  labelledBy?: string
  /** parent checkbox 자체의 accessible name (group label 과 분리 가능). */
  parentLabel?: string
}

/**
 * checkbox-group — APG `/checkbox/examples/checkbox-mixed/` 변종.
 * 부모 checkbox 가 자식 checkbox 들의 mixed-state 를 derive.
 *
 * data: ROOT children = child checkbox ids. 각 child entity 의 `selected` 가
 * checked 상태. 부모 state 는 자동 계산:
 *   all true  → parent = true
 *   all false → parent = false
 *   else      → parent = 'mixed'
 *
 * parent click 시 자식 전체를 true (mixed/false 일 때) / false (all true 일 때) 로
 * `checkMany` emit. 자식 click 은 host 가 `check` event 로 dispatch.
 *
 * @example canonical 합성 (#148 §4)
 *   const [data, dispatch] = useReducer(reduceWithDefaults, ITEMS, fromList)
 *   const { groupProps, parentProps, childProps, items } =
 *     useCheckboxGroupPattern(data, dispatch)
 */
export function useCheckboxGroupPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: CheckboxGroupOptions = {},
): {
  groupProps: RootProps
  parentProps: ItemProps
  childProps: (id: string) => ItemProps
  parentChecked: CheckboxState
  items: BaseItem[]
} {
  const { containerId = ROOT, disabled: optDisabled, label, labelledBy, parentLabel } = opts
  const ids = getCollectionChildren(data, containerId)
  const items: BaseItem[] = ids.map((id, i) => ({
    id,
    label: getLabel(data, id),
    selected: Boolean(data.entities[id]?.checked),
    disabled: isDisabled(data, id),
    posinset: i + 1,
    setsize: ids.length,
  }))
  // APG: disabled 자식은 parent 연산에서 제외. 영구 mixed 회피.
  const enabled = items.filter((it) => !it.disabled)
  const enabledIds = enabled.map((it) => it.id)
  const checkedCount = enabled.filter((it) => it.selected).length
  const parentChecked: CheckboxState =
    enabled.length === 0 ? false
    : checkedCount === 0 ? false
    : checkedCount === enabled.length ? true
    : 'mixed'
  const groupDisabled = optDisabled || enabled.length === 0

  const toggleParent = () => {
    if (groupDisabled) return
    const next = parentChecked !== true
    onEvent?.({ type: 'check', ids: enabledIds, to: next })
  }

  const groupProps: RootProps = {
    role: 'group',
    'aria-label': label,
    'aria-labelledby': labelledBy,
  } as unknown as RootProps

  const parentProps: ItemProps = {
    role: 'checkbox',
    type: 'button',
    tabIndex: groupDisabled ? -1 : 0,
    'aria-checked': parentChecked === 'mixed' ? 'mixed' : Boolean(parentChecked),
    'aria-disabled': groupDisabled || undefined,
    'aria-controls': ids.length ? ids.join(' ') : undefined,
    'aria-label': parentLabel,
    'data-state': parentChecked === 'mixed' ? 'mixed' : parentChecked ? 'checked' : 'unchecked',
    onClick: toggleParent,
    onKeyDown: (e: React.KeyboardEvent) => handleCheckboxKey(e, toggleParent),
  } as unknown as ItemProps

  const childProps = (id: string): ItemProps => {
    const it = items.find((x) => x.id === id)
    const disabled = (it?.disabled || false) || groupDisabled
    return {
      id,
      role: 'checkbox',
      type: 'button',
      tabIndex: disabled ? -1 : 0,
      'aria-checked': Boolean(it?.selected),
      'aria-disabled': disabled || undefined,
      'aria-label': it?.label,
      'data-state': it?.selected ? 'checked' : 'unchecked',
      onClick: () => {
        if (disabled) return
        onEvent?.({ type: 'check', ids: [id], to: !it?.selected })
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (disabled) return
        handleCheckboxKey(e, () => onEvent?.({ type: 'check', ids: [id], to: !it?.selected }))
      },
    } as unknown as ItemProps
  }

  return { groupProps, parentProps, childProps, parentChecked, items }
}

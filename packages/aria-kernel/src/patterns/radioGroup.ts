import { useCallback } from 'react'
import { getLabel, isDisabled, type NormalizedData, type UiEvent } from '../types'
import { activate, axisKeys as axisKeysFn, composeAxes, navigate } from '../axes'
import { selectionFollowsFocus as applySelectionFollowsFocus } from '../gesture'
import { usePatternBase } from './usePatternBase'
import type { BaseItem, ItemProps, RootProps } from './types'

/** Options for {@link useRadioGroupPattern}. */
export interface RadioGroupOptions {
  /** 시각·aria-orientation 만. 키보드는 양 축 모두 항상 활성. */
  orientation?: 'horizontal' | 'vertical'
  autoFocus?: boolean
  /** aria-required (form context). */
  required?: boolean
  /** aria-readonly. */
  readOnly?: boolean
  /** aria-invalid. */
  invalid?: boolean
  /** aria-disabled — radiogroup 전체 비활성. */
  disabled?: boolean
  /** aria-label — ARIA: radiogroup requires accessible name. */
  label?: string
  /** aria-labelledby (외부 label element 연결). */
  labelledBy?: string
  /**
   * APG 분기 — `'roving'` (default, DOM focus 가 radio 사이를 이동) vs
   * `'activeDescendant'` (DOM focus 는 radiogroup root, `aria-activedescendant`
   * 가 활성 radio 의 DOM id 를 가리킴).
   */
  focusMode?: 'roving' | 'activeDescendant'
  /** activeDescendant 모드의 radio DOM id prefix. */
  idPrefix?: string
}

// APG radiogroup: 양 축 Arrow 모두 navigate. activate 는 click 활성화 위해 axis 에 포함.
/** RadioGroup 이 등록하는 axis — SSOT (behavior 용). */
export const radioGroupAxis = () =>
  composeAxes(navigate('vertical'), navigate('horizontal'), activate)
const axis = radioGroupAxis()

/**
 * RadioGroup 이 advertise 하는 키 — sff 가 navigate 와 함께 selection 을 가져가
 * Enter/Space 는 redundant. APG radio 도 Enter 미지정 / Space 는 form submit 컨텍스트
 * 한정 → 본 라이브러리는 일관성 위해 둘 다 advertise 제외.
 */
export const radioGroupKeys = (): readonly string[] =>
  axisKeysFn(radioGroupAxis()).filter((k) => k !== 'Enter' && k !== ' ')

/**
 * radioGroup — APG `/radio/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * 항상 selection-follows-focus (APG 강제). single-select.
 *
 * @example canonical 합성 (#148 §4) — radio 는 reduceRadio
 *   const [data, dispatch] = useReducer(reduceRadio, ITEMS, fromList)
 *   const { rootProps, radioProps, items } = useRadioGroupPattern(data, dispatch)
 */
export function useRadioGroupPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: RadioGroupOptions = {},
): {
  rootProps: RootProps
  radioProps: (id: string) => ItemProps
  items: BaseItem[]
} {
  const {
    orientation = 'vertical', autoFocus, required, readOnly, invalid, disabled,
    label, labelledBy, focusMode = 'roving', idPrefix = 'rg',
  } = opts
  const isActiveDescendant = focusMode === 'activeDescendant'
  const radioDomId = (id: string) => `${idPrefix}-radio-${id}`

  const relay = useCallback(
    (e: UiEvent) => {
      if (!onEvent) return
      applySelectionFollowsFocus(data, e).forEach(onEvent)
    },
    [data, onEvent],
  )

  const { focusId, bindFocus, delegate, ids } = usePatternBase(data, axis, relay, { autoFocus })

  const items: BaseItem[] = ids.map((id, i) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: Boolean(ent.checked),
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: ids.length,
    }
  })

  const rootProps: RootProps = {
    role: 'radiogroup',
    'aria-orientation': orientation,
    'aria-required': required || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-invalid': invalid || undefined,
    'aria-disabled': disabled || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...delegate,
    ...(isActiveDescendant
      ? {
          tabIndex: disabled ? -1 : 0,
          'aria-activedescendant': focusId ? radioDomId(focusId) : undefined,
        }
      : {}),
  } as RootProps

  const radioProps = (id: string): ItemProps => {
    const it = items.find((x) => x.id === id)
    const isFocus = focusId === id
    if (isActiveDescendant) {
      return {
        role: 'radio',
        id: radioDomId(id),
        'data-id': id,
        'aria-checked': it?.selected ?? false,
        'aria-disabled': it?.disabled || undefined,
        'data-selected': it?.selected ? '' : undefined,
        'data-disabled': it?.disabled ? '' : undefined,
        'data-active': isFocus ? '' : undefined,
      } as unknown as ItemProps
    }
    return {
      role: 'radio',
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-checked': it?.selected ?? false,
      'aria-disabled': it?.disabled || undefined,
      'data-selected': it?.selected ? '' : undefined,
      'data-disabled': it?.disabled ? '' : undefined,
    } as unknown as ItemProps
  }

  return { rootProps, radioProps, items }
}

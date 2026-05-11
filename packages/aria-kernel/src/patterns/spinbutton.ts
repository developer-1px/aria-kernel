import type { ValueEvent } from '../types'
import { bindValueAxis, pickNumericValue } from '../state/bind'
import { numericStep } from '../axes/numericStep'
import type { ItemProps } from './types'

/** Spinbutton 이 등록하는 axis — SSOT. */
export const spinbuttonAxis = () => numericStep('horizontal')

/** Options for {@link spinbuttonPattern}. */
export interface SpinbuttonOptions {
  min?: number
  max?: number
  step?: number
  label?: string
  /** invalid 표시 — 보통 value < min 또는 > max. host 가 검증해서 넘긴다. */
  invalid?: boolean
  /** aria-valuenow 가 사람 친화적이지 않을 때 (예: 일/요일 등) 우선되는 텍스트. */
  valueText?: string
  /** aria-readonly. */
  readOnly?: boolean
  disabled?: boolean
}

/**
 * spinbutton — APG `/spinbutton/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 *
 * 단일 number 컨트롤. 키보드 (numericStep 재사용):
 *   ArrowUp/ArrowRight = +step
 *   ArrowDown/ArrowLeft = -step
 *   Home / End = min / max
 *   PageUp / PageDown = ±step * 10  (APG: "Optional. Larger step")
 *
 * native `<input type="number">` 가 충분할 때는 그쪽이 우선. custom widget
 * (예: 시:분 picker, 통화 입력 등) 일 때 본 recipe 사용.
 *
 * @example canonical (#148)
 *   const [n, setN] = useState(5)
 *   const { spinbuttonProps } = spinbuttonPattern(n, (e) => setN(e.value),
 *     { min: 0, max: 10, step: 1, label: 'Quantity' })
 */
export function spinbuttonPattern(
  value: number,
  dispatch?: (e: ValueEvent<number>) => void,
  opts: SpinbuttonOptions = {},
): { spinbuttonProps: ItemProps } {
  const { min, max, step = 1, label, invalid, valueText, readOnly, disabled = false } = opts

  const { onKey } = bindValueAxis(
    spinbuttonAxis(),
    { value, min, max, step },
    dispatch,
    pickNumericValue,
  )

  const spinbuttonProps: ItemProps = {
    role: 'spinbutton',
    tabIndex: disabled ? -1 : 0,
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuetext': valueText,
    'aria-label': label,
    'aria-invalid': invalid || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-disabled': disabled || undefined,
    onKeyDown: onKey,
  } as unknown as ItemProps

  return { spinbuttonProps }
}

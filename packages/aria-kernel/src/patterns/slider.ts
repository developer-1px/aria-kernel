import type { ValueEvent } from '../types'
import { bindValueAxis, pickNumericValue } from '../state/bind'
import { numericStep } from '../axes/numericStep'
import type { ItemProps, RootProps } from './types'

/** Slider 가 등록하는 axis — SSOT. */
export const sliderAxis = (opts: { orientation?: 'horizontal' | 'vertical' } = {}) =>
  numericStep(opts.orientation ?? 'horizontal')

/** Options for {@link sliderPattern}. */
export interface SliderOptions {
  orientation?: 'horizontal' | 'vertical'
  min?: number
  max?: number
  step?: number
  label?: string
  disabled?: boolean
  /**
   * `aria-valuetext` 합성기. 의미 있는 표현 (예: 시간 포맷, 별점 텍스트, 단위) 이 필요할 때.
   * APG: rating/seek/temperature 예제는 모두 valuetext 를 다르게 합성.
   */
  valueText?: (value: number) => string
}

/**
 * slider — APG `/slider/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * 단일 number 컨트롤 — 키보드: Arrow ±step, Home/End min/max, PageUp/PageDown ±step*10.
 *
 * @example canonical (#148)
 *   const [value, setValue] = useState(40)
 *   const { thumbProps, ... } = sliderPattern(value, (e) => setValue(e.value),
 *     { min: 0, max: 100, step: 5, label: 'Volume' })
 */
export function sliderPattern(
  value: number,
  dispatch?: (e: ValueEvent<number>) => void,
  opts: SliderOptions = {},
): {
  rootProps: RootProps
  trackProps: ItemProps
  rangeProps: ItemProps
  thumbProps: ItemProps
} {
  const { orientation = 'horizontal', min = 0, max = 100, step = 1, label, disabled = false, valueText } = opts
  const pct = ((value - min) / (max - min)) * 100

  const { onKey } = bindValueAxis(
    sliderAxis({ orientation }),
    { value, min, max, step },
    dispatch,
    pickNumericValue,
  )

  const rootProps: RootProps = {
    role: 'group',
    'aria-orientation': orientation,
  } as RootProps

  const trackProps: ItemProps = {
    'data-orientation': orientation,
  } as unknown as ItemProps

  const rangeProps: ItemProps = {
    'data-orientation': orientation,
    style: orientation === 'horizontal'
      ? { width: `${pct}%` }
      : { height: `${pct}%` },
  } as unknown as ItemProps

  const thumbProps: ItemProps = {
    role: 'slider',
    tabIndex: disabled ? -1 : 0,
    'aria-orientation': orientation,
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuetext': valueText ? valueText(value) : undefined,
    'aria-label': label,
    'aria-disabled': disabled || undefined,
    onKeyDown: onKey,
    style: orientation === 'horizontal'
      ? { left: `${pct}%` }
      : { bottom: `${pct}%` },
  } as unknown as ItemProps

  return { rootProps, trackProps, rangeProps, thumbProps }
}

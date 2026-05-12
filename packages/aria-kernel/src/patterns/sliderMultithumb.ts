import type { ValueEvent } from '../types'
import type { ItemProps, RootProps } from './types'
import { numericStep } from '../axes/numericStep'
import { eventToChord } from '../trigger'

/** Range slider axis — single-axis numericStep, applied per thumb. */
export const sliderMultithumbAxis = (opts: { orientation?: 'horizontal' | 'vertical' } = {}) =>
  numericStep(opts.orientation ?? 'horizontal')

/** Options for {@link sliderMultithumbPattern}. */
export interface SliderMultithumbOptions {
  orientation?: 'horizontal' | 'vertical'
  min?: number
  max?: number
  step?: number
  /** thumb 별 accessible name. 길이는 values 배열과 일치. */
  labels?: string[]
  disabled?: boolean
  /** thumb 별 `aria-valuetext` 합성기 (모든 thumb 공통). */
  valueText?: (value: number, index: number) => string
}

/**
 * slider (multi-thumb) — APG `/slider-multithumb/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
 *
 * 다중 thumb 컨트롤. 각 thumb 의 가용 범위는 인접 thumb 가 clamp:
 *   thumb[i] ∈ [values[i-1] ?? min, values[i+1] ?? max].
 * 키보드: Arrow ±step, Home/End thumb 의 clamp 양 끝, PageUp/PageDown ±step*10.
 */
export function sliderMultithumbPattern(
  values: number[],
  dispatch?: (e: ValueEvent<number[]>) => void,
  opts: SliderMultithumbOptions = {},
): {
  rootProps: RootProps
  trackProps: ItemProps
  rangeProps: ItemProps
  thumbProps: (index: number) => ItemProps
} {
  const { orientation = 'horizontal', min = 0, max = 100, step = 1, labels, disabled = false, valueText } = opts
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const minOf = (i: number) => values[i - 1] ?? min
  const maxOf = (i: number) => values[i + 1] ?? max

  const set = (i: number, next: number) => {
    const clamped = Math.max(minOf(i), Math.min(maxOf(i), next))
    if (clamped === values[i]) return
    const out = [...values]
    out[i] = clamped
    dispatch?.({ type: 'value', value: out })
  }

  const rootProps: RootProps = {
    role: 'group',
    'aria-orientation': orientation,
  } as RootProps

  const lo = pct(values[0] ?? min)
  const hi = pct(values[values.length - 1] ?? max)

  const trackProps: ItemProps = {
    'data-orientation': orientation,
  } as unknown as ItemProps

  const rangeProps: ItemProps = {
    'data-orientation': orientation,
    style: orientation === 'horizontal'
      ? { left: `${lo}%`, width: `${hi - lo}%` }
      : { bottom: `${lo}%`, height: `${hi - lo}%` },
  } as unknown as ItemProps

  const axis = sliderMultithumbAxis({ orientation })

  const thumbProps = (index: number): ItemProps => {
    const v = values[index]
    const lo = minOf(index)
    const hi = maxOf(index)
    const onKeyDown = (e: React.KeyboardEvent) => {
      const data = {
        entities: { _thumb: { value: v, min: lo, max: hi, step } },
        relationships: {},
        meta: {},
      } as never
      const events = axis(data, '_thumb', eventToChord(e as unknown as KeyboardEvent))
      if (!events) return
      const ev = events[0]
      if (!ev || ev.type !== 'value') return
      e.preventDefault()
      if (typeof ev.value === 'number') set(index, ev.value)
    }
    return {
      role: 'slider',
      tabIndex: disabled ? -1 : 0,
      'aria-orientation': orientation,
      'aria-valuenow': v,
      'aria-valuemin': lo,
      'aria-valuemax': hi,
      'aria-valuetext': valueText ? valueText(v, index) : undefined,
      'aria-label': labels?.[index],
      'aria-disabled': disabled || undefined,
      onKeyDown,
      style: orientation === 'horizontal'
        ? { left: `${pct(v)}%` }
        : { bottom: `${pct(v)}%` },
    } as unknown as ItemProps
  }

  return { rootProps, trackProps, rangeProps, thumbProps }
}

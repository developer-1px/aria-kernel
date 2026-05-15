import type { RootProps } from './types'

/** Options for {@link progressbarPattern}. */
export interface ProgressbarOptions {
  /**
   * Current value within [min, max]. `null` ⇒ indeterminate
   * (W3C APG: omit `aria-valuenow` entirely).
   */
  value: number | null
  /** Lower bound. Default `0`. */
  min?: number
  /** Upper bound. Default `100`. */
  max?: number
  /**
   * Human-readable expression of the current value, e.g. "step 3 of 5".
   * Mapped to `aria-valuetext`. Caller decides locale/format.
   */
  valueText?: string
  /** Accessible name. Mapped to `aria-label`. Omit if labelled via `aria-labelledby` externally. */
  label?: string
}

/**
 * progressbar — W3C APG `role="progressbar"` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/meter/ (cf. progressbar role)
 *
 * No keyboard axis (read-only). Pure function — no hooks. Caller spreads
 * `rootProps` onto the visual container (typically a `<div>` with a bar fill).
 *
 * Indeterminate is signalled by `value: null` per APG — `aria-valuenow` is
 * not emitted at all, NOT set to 0.
 *
 * @example
 *   const { rootProps } = progressbarPattern({ value: uploaded, max: total, label: 'Upload' })
 *   return <div {...rootProps}><div style={{ width: `${pct}%` }} /></div>
 */
export function progressbarPattern(opts: ProgressbarOptions): { rootProps: RootProps } {
  const { value, min = 0, max = 100, valueText, label } = opts
  const rootProps: RootProps = {
    role: 'progressbar',
    'aria-valuemin': min,
    'aria-valuemax': max,
  }
  if (value !== null) rootProps['aria-valuenow'] = value
  if (valueText !== undefined) rootProps['aria-valuetext'] = valueText
  if (label !== undefined) rootProps['aria-label'] = label
  return { rootProps }
}

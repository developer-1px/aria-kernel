import type { ValueEvent } from '../types'
import { bindValueAxis, pickNumericValue } from '../state/bind'
import { numericStep } from '../axes/numericStep'
import type { ItemProps, RootProps } from './types'

/** Splitter 가 등록하는 axis — SSOT. (vertical separator → horizontal arrow keys, vice versa) */
export const splitterAxis = (opts: { orientation?: 'horizontal' | 'vertical' } = {}) => {
  const o = opts.orientation ?? 'vertical'
  return numericStep(o === 'vertical' ? 'horizontal' : 'vertical')
}

/** Options for {@link splitterPattern}. */
export interface SplitterOptions {
  orientation?: 'horizontal' | 'vertical'
  min?: number
  max?: number
  step?: number
  label?: string
  disabled?: boolean
}

/**
 * splitter — APG `Window Splitter`.
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 *
 * 단일 number 컨트롤 — slider 와 axis 공유 (numericStep), role=separator 만 다름.
 *
 * @example canonical (#148)
 *   const [pos, setPos] = useState(40)
 *   const { handleProps, ... } = splitterPattern(pos, (e) => setPos(e.value), { min: 10, max: 90 })
 */
export function splitterPattern(
  value: number,
  dispatch?: (e: ValueEvent<number>) => void,
  opts: SplitterOptions = {},
): {
  rootProps: RootProps
  handleProps: ItemProps
} {
  const { orientation = 'vertical', min = 0, max = 100, step = 1, label, disabled = false } = opts

  const { onKey } = bindValueAxis(
    splitterAxis({ orientation }),
    { value, min, max, step },
    dispatch,
    pickNumericValue,
  )

  const rootProps: RootProps = { role: 'group' } as RootProps

  const handleProps: ItemProps = {
    role: 'separator',
    tabIndex: disabled ? -1 : 0,
    'aria-orientation': orientation,
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-label': label,
    'aria-disabled': disabled || undefined,
    onKeyDown: onKey,
  } as unknown as ItemProps

  return { rootProps, handleProps }
}

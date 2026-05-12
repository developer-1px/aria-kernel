import type { ItemProps } from './types'
import type { UiEvent, ValueEvent } from '../intent/events'
import { activate } from '../input/keyboard/axes'
import { bindValueAxis } from '../view-state/bind'

/** Switch 가 등록하는 axis — SSOT. */
export const switchAxis = () => activate

/** Options for {@link switchPattern}. */
export interface SwitchOptions {
  label?: string
  disabled?: boolean
}

/**
 * switch — WAI-ARIA `switch` role.
 * https://www.w3.org/TR/wai-aria-1.2/#switch
 *
 * 단일 boolean 컨트롤 — activate 시 `{type:'value', value:!checked}` 직렬 emit.
 *
 * @example canonical (#148)
 *   const [on, setOn] = useState(false)
 *   const { switchProps } = switchPattern(on, (e) => setOn(e.value), { label: 'Mute' })
 */
export function switchPattern(
  checked: boolean,
  dispatch?: (e: ValueEvent<boolean>) => void,
  opts: SwitchOptions = {},
): { switchProps: ItemProps } {
  const { label, disabled = false } = opts

  // activate → !checked 로 변환. axis 는 activate 만 emit, 다른 type 은 무시.
  const pickToggle = (e: UiEvent): boolean | undefined =>
    e.type === 'activate' ? !checked : undefined

  const { onKey, onClick } = bindValueAxis(
    activate,
    { value: checked, disabled },
    dispatch,
    pickToggle,
  )

  const switchProps: ItemProps = {
    role: 'switch',
    tabIndex: disabled ? -1 : 0,
    'aria-checked': checked,
    'aria-disabled': disabled || undefined,
    'aria-label': label,
    'data-state': checked ? 'on' : 'off',
    'data-disabled': disabled ? '' : undefined,
    onClick,
    onKeyDown: onKey,
  } as unknown as ItemProps

  return { switchProps }
}

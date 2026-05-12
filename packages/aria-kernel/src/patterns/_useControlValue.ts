import { useState } from 'react'
import { ROOT, type UiEvent } from '../types'

/**
 * useControlValue<T> — control 패턴(switch/checkbox/radio/slider/spinbutton/textbox/combobox 입력)의
 * value 표준 어댑터. controlled/uncontrolled hybrid storage + UiEvent dispatch 를 한 hook 으로 묶어
 * `ControlProps<T>` 어휘를 그대로 받아 즉시 [value, setValue] 로 쓸 수 있게 한다.
 *
 *  controlled 주입(value !== undefined)  → 외부 state 그대로 사용, setValue 는 onEvent 만 emit.
 *  controlled 미주입                     → 내부 useState 로 자체 보유, setValue 는 둘 다.
 *
 * 모든 setValue 호출은 `{type:'value', id, value}` event 를 onEvent 로 emit —
 * single dispatch interface 정합. host 가 받은 'value' 를 외부 store 와 동기화.
 *
 *  @param controlled  외부 prop value (undefined 면 uncontrolled)
 *  @param defaultValue  uncontrolled 시작값
 *  @param onEvent  dispatch 통로 ('value' event emit 대상)
 *  @param id  emit event 의 id (default: ROOT)
 *
 *  @example
 *  const [checked, setChecked] = useControlValue(props.value, false, props.onEvent)
 *  <button aria-pressed={checked} onClick={() => setChecked(!checked)} />
 */
export function useControlValue<T>(
  controlled: T | undefined,
  defaultValue: T,
  onEvent?: (e: UiEvent) => void,
  id: string = ROOT,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = controlled !== undefined
  const value = isControlled ? controlled : internal
  const setValue = (next: T) => {
    if (!isControlled) setInternal(next)
    onEvent?.({ type: 'value', id, value: next })
  }
  return [value, setValue]
}

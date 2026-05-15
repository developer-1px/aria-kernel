import { useRef } from 'react'
import { BLUR_RACE_DELAY_MS } from '../key/timing'

/**
 * usePopupBlurRace — popup host (combobox input · listbox button 등) 가 blur 직후
 * option mousedown→activate 가 도달할 race window 만큼 close 를 지연하는 표준 구현.
 *
 * 3개 combobox variant (combobox · comboboxSelect · comboboxGrid) 가 동일한 timer-
 * cancel 패턴을 반복하던 것을 흡수. Radix · HeadlessUI · Reach Combobox de facto.
 *
 * @param delayMs - close 지연 시간 (default: {@link BLUR_RACE_DELAY_MS} = 100ms)
 * @returns `{ schedule, cancel }` — onBlur 에서 schedule, mousedown 에서 cancel
 *
 * @example
 *   const blurRace = usePopupBlurRace()
 *   const onBlur = () => blurRace.schedule(() => onEvent({ type: 'open', id: ROOT, open: false }))
 *   const onMouseDown = () => blurRace.cancel()
 */
export function usePopupBlurRace(delayMs: number = BLUR_RACE_DELAY_MS) {
  const timerRef = useRef<number | null>(null)

  const cancel = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const schedule = (fn: () => void) => {
    cancel()
    timerRef.current = window.setTimeout(() => {
      fn()
      timerRef.current = null
    }, delayMs)
  }

  return { schedule, cancel }
}

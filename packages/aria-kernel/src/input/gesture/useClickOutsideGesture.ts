import { useEffect, type RefObject } from 'react'

export type ClickOutsideRef = RefObject<Element | null>

/**
 * useClickOutsideGesture — ref 밖 pointerdown 발생 시 handler 호출.
 *
 * Dialog/Popover 의 outside-dismiss 자리. `pointerdown` 기준 (click 보다 일찍 fire
 * — focus race 방지). `document` capture phase 부착 — stopPropagation 우회.
 *
 * 출처: W3C Pointer Events Level 3 + UI Events. `/gesture` 영역 — "ARIA 의미와
 * 결합된 pointer 어휘" (Dialog/Popover dismiss intent).
 *
 * @param refs - 단일 ref 또는 ref 배열. 어느 ref 내부든 inside 취급.
 * @param handler - outside pointerdown 시 호출
 * @param opts.enabled - false 면 리스너 부착 안 함 (default true)
 *
 * @example Dialog dismiss
 *   const ref = useRef<HTMLDivElement>(null)
 *   useClickOutsideGesture(ref, () => setOpen(false), { enabled: open })
 *
 * @example Popover (trigger + content 둘 다 inside)
 *   useClickOutsideGesture([triggerRef, contentRef], () => close())
 */
export function useClickOutsideGesture(
  refs: ClickOutsideRef | ClickOutsideRef[],
  handler: (e: PointerEvent) => void,
  opts: { enabled?: boolean } = {},
): void {
  const { enabled = true } = opts
  useEffect(() => {
    if (!enabled) return
    const list = Array.isArray(refs) ? refs : [refs]
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      for (const r of list) {
        const el = r.current
        if (el && el.contains(target)) return
      }
      handler(e)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [refs, handler, enabled])
}

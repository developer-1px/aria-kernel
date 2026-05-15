import { useEffect, type RefObject } from 'react'
import { KEYS } from '../axes/keys'

const FOCUSABLE_SELECTOR = [
  'a[href]', 'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])',
  'iframe', 'audio[controls]', 'video[controls]',
  '[contenteditable="true"]', 'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** focusTrapKeys — 선언형 SSOT. dialog 등 wrapper 가 표시용으로 읽음. */
export const focusTrapKeys = (): readonly string[] => [KEYS.Tab]

/**
 * useFocusTrap — Tab/Shift+Tab DOM focus 경계 관리 primitive.
 *
 * dialog/popover modal recipe 의 focus trap 부분을 분리. data 비의존, rootRef + enabled 만 받는다.
 */
export const useFocusTrap = (
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void => {
  useEffect(() => {
    if (!enabled) return
    const root = rootRef.current
    if (!root) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== KEYS.Tab) return
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (!focusables.length) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [rootRef, enabled])
}

import { useEffect, useRef, useState, type RefObject } from 'react'
import { escapeKeys } from '../axes/escape'
import { INTENT_CHORDS } from '../axes/intentChords'
import { bindGlobalKeyMap } from '../key/bindGlobalKeyMap'
import { matchAnyChord } from '../axes/chord'
import { useFocusTrap, focusTrapKeys } from './focusTrap'
import type { ItemProps, RootProps } from './types'

/**
 * Dialog 가 등록하는 키 — declarative SSOT 합집합.
 * - Escape: `escape` axis 의 chord (INTENT_CHORDS.escape.close)
 * - Tab: `useFocusTrap` 의 focusTrapKeys (modal 일 때만)
 *
 * 손으로 적은 사본 0 — 모든 키가 자기 primitive 의 선언에서 도출됨.
 */
export const dialogKeys = (opts: { modal?: boolean } = {}): readonly string[] =>
  (opts.modal ?? true) ? [...escapeKeys(), ...focusTrapKeys()] : [...escapeKeys()]

/** Options for {@link useDialogPattern}. */
export interface DialogOptions {
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean
  returnFocusRef?: RefObject<HTMLElement | null>
  initialFocusRef?: RefObject<HTMLElement | null>
  returnFocus?: boolean
  label?: string
  labelledBy?: string
  describedBy?: string
  rootRef?: RefObject<HTMLElement | null>
  onOpenChange?: (open: boolean) => void
  /**
   * 사용자 chord 미들웨어. dialog open 인 동안 window keydown 에 등록.
   * 예: `on: { 'Enter': () => find.next(), 'shift+Enter': () => find.prev() }`.
   * modifier 없는 chord 는 editable 안에서 탈취하지 않음 (bindGlobalKeyMap 규칙과 동일).
   */
  on?: Record<string, () => void>
}

const FOCUSABLE_SELECTOR = [
  'a[href]', 'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])',
  'iframe', 'audio[controls]', 'video[controls]',
  '[contenteditable="true"]', 'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * dialog — APG `/dialog-modal/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * 키 처리는 두 declarative primitive 의 합성:
 * - `bindGlobalKeyMap` + `INTENT_CHORDS.escape.close` → Escape 닫기
 * - `useFocusTrap` → Tab/Shift+Tab DOM focus 경계 (modal=true)
 *
 * focus 진입/복귀 는 별도 layer (focus management) — useEffect 잔존.
 */
export function useDialogPattern(opts: DialogOptions = {}): {
  rootRef: RefObject<HTMLElement | null>
  rootProps: RootProps
  backdropProps: RootProps
  closeProps: ItemProps
  open: boolean
  setOpen: (open: boolean) => void
} {
  const {
    open: openProp,
    defaultOpen = false,
    modal = true,
    returnFocusRef,
    initialFocusRef,
    returnFocus = true,
    label, labelledBy, describedBy,
    onOpenChange,
    on,
  } = opts
  const internalRootRef = useRef<HTMLElement | null>(null)
  const rootRef = opts.rootRef ?? internalRootRef
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Escape 닫기 — declarative keymap 등록 (bindGlobalKeyMap 이 SSOT 메커니즘).
  useEffect(() => {
    if (!open) return
    return bindGlobalKeyMap(
      [[INTENT_CHORDS.escape.close, { type: 'open', id: 'dialog', open: false }]],
      (e) => {
        if (e.type === 'open' && e.open === false) setOpen(false)
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Tab focus trap — declarative focus primitive (modal 일 때만 활성).
  useFocusTrap(rootRef, open && modal)

  // 사용자 chord 미들웨어 — open 인 동안 window keydown 부착.
  useEffect(() => {
    if (!open || !on) return
    const entries = Object.entries(on)
    if (entries.length === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      for (const [chord, fn] of entries) {
        if (matchAnyChord(e, [chord])) { e.preventDefault(); fn(); return }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, on])

  // Focus management — 진입 focus + 닫힐 때 trigger 복귀.
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return
    const active = document.activeElement
    previousFocusRef.current = active instanceof HTMLElement ? active : null
    const first = initialFocusRef?.current ?? root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? root
    first.focus({ preventScroll: true })
    return () => {
      if (!returnFocus) return
      const target = returnFocusRef?.current ?? previousFocusRef.current
      if (target && document.contains(target)) target.focus({ preventScroll: true })
    }
  }, [open, rootRef, returnFocusRef, initialFocusRef, returnFocus])

  const rootProps: RootProps = {
    role: 'dialog',
    'aria-modal': modal,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    ref: rootRef as React.Ref<HTMLElement>,
    tabIndex: -1,
    hidden: !open,
    'data-state': open ? 'open' : 'closed',
  } as unknown as RootProps

  const closeProps: ItemProps = {
    type: 'button',
    onClick: () => setOpen(false),
  } as unknown as ItemProps

  // backdrop — ARIA punt. modal dialog 의 backdrop click 닫기는 spec 본문이 아니라
  // 플랫폼 관행(Radix Dialog.Overlay · RAC ModalOverlay 의 사실상 표준 위치). kernel 이 흡수.
  // mousedown 자체 타깃이 backdrop 일 때만 닫는다 — dialog 내부 drag-out 으로 닫히는 사고 방지.
  const backdropProps: RootProps = {
    'data-state': open ? 'open' : 'closed',
    hidden: !open,
    onMouseDown: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) setOpen(false)
    },
  } as unknown as RootProps

  return { rootRef, rootProps, backdropProps, closeProps, open, setOpen }
}

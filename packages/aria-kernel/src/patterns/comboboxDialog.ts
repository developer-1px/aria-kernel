import { useEffect, useId, useRef } from 'react'
import { matchAnyChord } from '../axes'
import { useDialogPattern, dialogKeys, type DialogOptions } from './dialog'
import type { ItemProps, RootProps } from './types'

/**
 * useComboboxDialogPattern 이 흡수하는 키 — SSOT.
 * - ArrowDown / Alt+ArrowDown: open (APG combobox-datepicker)
 * - dialogKeys: Escape (+ modal=true 인 경우 Tab)
 */
export const comboboxDialogKeys = (opts: { modal?: boolean } = {}): readonly string[] =>
  ['ArrowDown', 'Alt+ArrowDown', ...dialogKeys({ modal: opts.modal ?? false })]

/** Options for {@link useComboboxDialogPattern}. */
export interface ComboboxDialogOptions
  extends Pick<DialogOptions, 'returnFocusRef' | 'initialFocusRef' | 'modal'> {
  label?: string
  labelledBy?: string
  required?: boolean
  readOnly?: boolean
  invalid?: boolean
  disabled?: boolean
}

/** Return shape of {@link useComboboxDialogPattern}. */
export interface ComboboxDialogReturn {
  /** input/textbox element 에 spread. role="combobox" + aria-* 자동. */
  inputProps: ItemProps
  /** popover container (dialog) 에 spread. useDialogPattern 의 rootProps. */
  popoverProps: RootProps
  /** open icon button 에 spread (선택사항). */
  triggerProps: ItemProps
  open: boolean
  setOpen: (open: boolean) => void
}

/**
 * combobox dialog-popup variant — APG `combobox-datepicker` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/
 *
 * data 없음 — popup 내용은 호스트가 임의 dialog 콘텐츠로 채움 (calendar grid 등).
 * 자유 텍스트 입력 충돌 방지: openOnType / openOnFocus default false.
 *
 * 키 흡수: ArrowDown / Alt+ArrowDown → open. Escape / outside click → close (useDialogPattern).
 * focus trap / returnFocus / Escape 모두 useDialogPattern 합성.
 *
 * 격리 근거 (계약 4축 모두 다름):
 *   ① 입력: data 없음
 *   ② 반환: inputProps/popoverProps/triggerProps (listbox variant 와 다른 키 집합)
 *   ③ 상태: collection 없음
 *   ④ 라이프사이클: navigate/activate 없음, open/close 만
 *
 * @example canonical (#148 §4) — opts-only 패턴 (collection 없는 wrapper, popup 안에서 별도 합성)
 *   const { inputProps, popoverProps, triggerProps, open } = useComboboxDialogPattern({ label: '…' })
 */
export function useComboboxDialogPattern(opts: ComboboxDialogOptions): ComboboxDialogReturn {
  const {
    label, labelledBy, required, readOnly, invalid, disabled,
    returnFocusRef, initialFocusRef, modal = false,
  } = opts
  const dialogId = useId()
  const inputRef = useRef<HTMLElement | null>(null)
  const dialog = useDialogPattern({
    modal,
    returnFocusRef: returnFocusRef ?? (inputRef as React.RefObject<HTMLElement | null>),
    initialFocusRef,
    label: label ?? 'Combobox popup',
    labelledBy,
  })
  const { open, setOpen, rootProps: dialogRootProps, rootRef: dialogRootRef } = dialog

  // outside click — input + dialog 외부 mousedown 시 close.
  useEffect(() => {
    if (!open) return
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (dialogRootRef.current?.contains(t)) return
      if (inputRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open, dialogRootRef, setOpen])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const ev = e as unknown as KeyboardEvent
    // Alt+ArrowDown / ArrowDown → open. APG combobox-datepicker.
    if (matchAnyChord(ev, ['ArrowDown', 'Alt+ArrowDown'])) {
      if (!open) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    // Escape close — useDialogPattern 의 global Escape 가 처리.
  }

  const inputProps: ItemProps = {
    role: 'combobox',
    ref: inputRef as React.Ref<HTMLElement>,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': dialogId,
    'aria-required': required || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-invalid': invalid || undefined,
    'aria-disabled': disabled || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    onKeyDown,
  } as unknown as ItemProps

  const popoverProps: RootProps = {
    ...dialogRootProps,
    id: dialogId,
  } as unknown as RootProps

  const triggerProps: ItemProps = {
    type: 'button',
    tabIndex: -1,
    'aria-label': label ? `Open ${label}` : 'Open',
    onClick: () => setOpen(!open),
  } as unknown as ItemProps

  return { inputProps, popoverProps, triggerProps, open, setOpen }
}

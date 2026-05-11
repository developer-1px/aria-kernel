import type { RefObject } from 'react'
import { useDialogPattern, type DialogOptions } from './dialog'
import type { ItemProps, RootProps } from './types'

/** Options for {@link useAlertDialogPattern}. */
export type AlertDialogOptions = DialogOptions & {
  /**
   * cancel/dismiss action 의 ref. open 시 자동 focus 우선 대상 (`initialFocusRef`
   * 가 따로 주어지지 않은 경우). 파괴적 동작 (Confirm) 보다 안전한 기본 focus.
   */
  cancelRef?: RefObject<HTMLElement | null>
}

/**
 * alert-dialog — APG `/alertdialog/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 *
 * `useDialogPattern` 의 preset — `role="alertdialog"` + cancel 버튼 자동 focus.
 * confirm/destructive prompt 에 사용.
 *
 * @example canonical (#148 §4) — opts-only 패턴 (단일 인스턴스, 데이터 컬렉션 아님)
 *   const { rootProps, closeProps } = useAlertDialogPattern({ open, onClose, cancelRef })
 */
export function useAlertDialogPattern(opts: AlertDialogOptions = {}): {
  rootRef: RefObject<HTMLElement | null>
  rootProps: RootProps
  closeProps: ItemProps
  open: boolean
  setOpen: (open: boolean) => void
} {
  const { cancelRef, initialFocusRef, ...rest } = opts
  const r = useDialogPattern({
    ...rest,
    initialFocusRef: initialFocusRef ?? cancelRef,
  })
  return {
    ...r,
    rootProps: { ...r.rootProps, role: 'alertdialog' } as RootProps,
  }
}

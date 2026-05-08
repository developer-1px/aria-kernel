import { useEffect, useState, useRef, type RefObject } from 'react'
import { INTENT_CHORDS } from '../axes/intentChords'
import { escapeKeys } from '../axes/escape'
import { bindGlobalKeyMap } from '../key/bindGlobalKeyMap'
import type { ItemProps, RootProps } from './types'

/** Tooltip 키 — declarative SSOT. escape axis 의 chord 도출. */
export const tooltipKeys = (): readonly string[] => [...escapeKeys()]

/** Options for {@link useTooltipPattern}. */
export interface TooltipOptions {
  /** 보이기 delay (ms). APG 권장 ~400ms. */
  delayShow?: number
  /** 숨기기 delay (ms). */
  delayHide?: number
  idPrefix?: string
  /** 외부에서 trigger ref 를 제어해야 할 때 주입. 미주입 시 내부 ref 생성. */
  triggerRef?: RefObject<HTMLElement | null>
}

/**
 * tooltip — APG `/tooltip/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 *
 * hover/focus 로 열림, blur/Escape 로 닫힘. Escape 처리는 `bindGlobalKeyMap`
 * (declarative SSOT 메커니즘).
 */
export function useTooltipPattern(opts: TooltipOptions = {}): {
  open: boolean
  triggerRef: RefObject<HTMLElement | null>
  triggerProps: ItemProps
  tipProps: RootProps
} {
  const { delayShow = 400, delayHide = 100, idPrefix = 'tip' } = opts
  const internalRef = useRef<HTMLElement | null>(null)
  const triggerRef = opts.triggerRef ?? internalRef
  const [open, setOpen] = useState(false)
  const tipId = `${idPrefix}-content`
  const tRef = useRef<number | null>(null)

  const show = () => {
    if (tRef.current) window.clearTimeout(tRef.current)
    tRef.current = window.setTimeout(() => setOpen(true), delayShow)
  }
  const hide = () => {
    if (tRef.current) window.clearTimeout(tRef.current)
    tRef.current = window.setTimeout(() => setOpen(false), delayHide)
  }

  useEffect(
    () =>
      bindGlobalKeyMap(
        [[INTENT_CHORDS.escape.close, { type: 'open', id: 'tooltip', open: false }]],
        (e) => {
          if (e.type === 'open' && e.open === false) setOpen(false)
        },
      ),
    [],
  )

  const triggerProps: ItemProps = {
    ref: triggerRef as React.Ref<HTMLElement>,
    'aria-describedby': open ? tipId : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  } as unknown as ItemProps

  const tipProps: RootProps = {
    role: 'tooltip',
    id: tipId,
    hidden: !open,
    'data-state': open ? 'open' : 'closed',
  } as unknown as RootProps

  return { open, triggerRef, triggerProps, tipProps }
}

/**
 * useAnnouncer — ARIA live-region announcer primitive.
 * https://www.w3.org/TR/wai-aria-1.2/#aria-live
 *
 * Two hidden live regions (polite + assertive) + queue + debounce + empty-then-fill.
 *
 *   const { announce, politeProps, assertiveProps } = useAnnouncer()
 *   announce('3 selected')
 *   announce('Save failed', { assertive: true })
 *   announce('Loading…', { dedupe: 500 })
 *
 *   <div {...politeProps} />
 *   <div {...assertiveProps} />
 *
 * SR tribal knowledge encoded here:
 *  - Two separate regions (politeness changes mid-flight are ignored by SR).
 *  - empty-then-fill: identical successive messages need a brief blank to re-announce.
 *  - dedupe window: coalesce duplicate messages within N ms.
 *  - visually hidden style (sr-only equivalent) so consumers don't reinvent it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface AnnouncerRegionProps {
  'aria-live': 'polite' | 'assertive'
  'aria-atomic': true
  role: 'status' | 'alert'
  style: React.CSSProperties
  children: string
}

export interface AnnounceOptions {
  /** Send to assertive region. default false (polite). */
  assertive?: boolean
  /** Coalesce identical messages within N ms. default 0 (no dedupe). */
  dedupe?: number
}

export interface UseAnnouncerOptions {
  /** Reserved for future API symmetry. Currently unused — politeness is per-call. */
  defaultPoliteness?: 'polite' | 'assertive'
}

export interface UseAnnouncerResult {
  announce: (message: string, options?: AnnounceOptions) => void
  politeProps: AnnouncerRegionProps
  assertiveProps: AnnouncerRegionProps
}

// Visually hidden — SR reads it, sighted users don't see it.
const HIDDEN_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

// Two ticks: clear → then fill on next tick so SR diff sees a change even for identical text.
const EMPTY_THEN_FILL_DELAY = 50

export function useAnnouncer(_options: UseAnnouncerOptions = {}): UseAnnouncerResult {
  const [politeText, setPoliteText] = useState('')
  const [assertiveText, setAssertiveText] = useState('')

  // Last-announced tracking per region for dedupe.
  const lastPoliteRef = useRef<{ msg: string; at: number }>({ msg: '', at: 0 })
  const lastAssertiveRef = useRef<{ msg: string; at: number }>({ msg: '', at: 0 })

  // Pending timers — cleared on unmount.
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current.clear()
    },
    [],
  )

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timersRef.current.delete(t)
      fn()
    }, ms)
    timersRef.current.add(t)
  }, [])

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      if (!message) return
      const assertive = options.assertive === true
      const lastRef = assertive ? lastAssertiveRef : lastPoliteRef
      const setter = assertive ? setAssertiveText : setPoliteText
      const now = Date.now()
      const dedupe = options.dedupe ?? 0

      if (
        dedupe > 0 &&
        lastRef.current.msg === message &&
        now - lastRef.current.at < dedupe
      ) {
        return
      }
      lastRef.current = { msg: message, at: now }

      // empty-then-fill: clear immediately, fill on next tick.
      setter('')
      schedule(() => setter(message), EMPTY_THEN_FILL_DELAY)
    },
    [schedule],
  )

  const politeProps = useMemo<AnnouncerRegionProps>(
    () => ({
      'aria-live': 'polite',
      'aria-atomic': true,
      role: 'status',
      style: HIDDEN_STYLE,
      children: politeText,
    }),
    [politeText],
  )

  const assertiveProps = useMemo<AnnouncerRegionProps>(
    () => ({
      'aria-live': 'assertive',
      'aria-atomic': true,
      role: 'alert',
      style: HIDDEN_STYLE,
      children: assertiveText,
    }),
    [assertiveText],
  )

  return { announce, politeProps, assertiveProps }
}

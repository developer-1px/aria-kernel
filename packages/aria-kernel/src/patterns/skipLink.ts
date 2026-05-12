/**
 * useSkipLink — "Skip to main content" primitive.
 * https://www.w3.org/WAI/WCAG21/Techniques/general/G1
 *
 * Visible-on-focus link + click → target element focus + scrollIntoView.
 *
 *   const skip = useSkipLink({ targetId: 'main' })
 *   <a {...skip.linkProps}>Skip to main content</a>
 *
 * Encapsulates the "sr-only until :focus" CSS via inline style + onFocus/onBlur
 * so consumers don't reinvent it. href is preserved as `#${targetId}` so the
 * browser's native "skip link" affordance (URL hash, history) still works.
 *
 * Focus management: target receives DOM focus. If it isn't focusable, we
 * temporarily add tabIndex=-1 + focus + scrollIntoView, matching the
 * widely-deployed WebAIM/MDN recipe.
 */
import { useCallback, useMemo, useState } from 'react'

export interface UseSkipLinkOptions {
  /** id of the landmark/target element to jump to. */
  targetId: string
  /** scroll behavior — passed to scrollIntoView. default 'smooth'. */
  scrollBehavior?: ScrollBehavior
}

export interface SkipLinkProps {
  href: string
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void
  onFocus: () => void
  onBlur: () => void
  style: React.CSSProperties
}

export interface UseSkipLinkResult {
  linkProps: SkipLinkProps
}

// sr-only equivalent — visually hidden, still focusable.
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

// Visible-on-focus — pulled into the top-left for keyboard users.
const VISIBLE_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
}

export function useSkipLink(options: UseSkipLinkOptions): UseSkipLinkResult {
  const { targetId, scrollBehavior = 'smooth' } = options
  const [focused, setFocused] = useState(false)

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      const target = typeof document !== 'undefined' ? document.getElementById(targetId) : null
      if (!target) return
      // Make non-focusable elements focusable (WebAIM recipe).
      const hadTabIndex = target.hasAttribute('tabindex')
      if (!hadTabIndex) target.setAttribute('tabindex', '-1')
      target.focus()
      target.scrollIntoView({ behavior: scrollBehavior, block: 'start' })
    },
    [targetId, scrollBehavior],
  )

  const linkProps = useMemo<SkipLinkProps>(
    () => ({
      href: `#${targetId}`,
      onClick,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      style: focused ? VISIBLE_STYLE : HIDDEN_STYLE,
    }),
    [targetId, onClick, focused],
  )

  return { linkProps }
}

/**
 * useSkipLink — Demo render + tab/click only.
 * Verifies: hidden-until-focus style, href, target focus + scroll on click.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useSkipLink } from './useSkipLink'

afterEach(cleanup)

function Demo() {
  const skip = useSkipLink({ targetId: 'main', scrollBehavior: 'auto' })
  return (
    <div>
      <a data-testid="link" {...skip.linkProps}>Skip to main content</a>
      <div id="main" data-testid="main">main</div>
    </div>
  )
}

describe('useSkipLink', () => {
  it('renders an anchor with href pointing at targetId', () => {
    render(<Demo />)
    const link = screen.getByTestId('link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('#main')
  })

  it('is visually hidden until focused', () => {
    render(<Demo />)
    const link = screen.getByTestId('link') as HTMLAnchorElement
    expect(link.style.position).toBe('absolute')
    expect(link.style.overflow).toBe('hidden')
    fireEvent.focus(link)
    // visible-on-focus — overflow no longer clipped
    expect(link.style.overflow).not.toBe('hidden')
    fireEvent.blur(link)
    expect(link.style.overflow).toBe('hidden')
  })

  it('click focuses the target element and calls scrollIntoView', () => {
    render(<Demo />)
    const link = screen.getByTestId('link') as HTMLAnchorElement
    const main = screen.getByTestId('main')
    const scrollSpy = vi.fn()
    main.scrollIntoView = scrollSpy
    fireEvent.click(link)
    expect(document.activeElement).toBe(main)
    expect(scrollSpy).toHaveBeenCalledOnce()
    // tabindex was added so non-focusable target can receive focus
    expect(main.getAttribute('tabindex')).toBe('-1')
  })

  it('preserves target tabindex if already present', () => {
    function D() {
      const skip = useSkipLink({ targetId: 't' })
      return (
        <div>
          <a data-testid="link" {...skip.linkProps}>skip</a>
          <div id="t" data-testid="t" tabIndex={0}>t</div>
        </div>
      )
    }
    render(<D />)
    const t = screen.getByTestId('t')
    t.scrollIntoView = vi.fn()
    fireEvent.click(screen.getByTestId('link'))
    expect(t.getAttribute('tabindex')).toBe('0')
  })

  it('does nothing when target is missing', () => {
    function D() {
      const skip = useSkipLink({ targetId: 'nope' })
      return <a data-testid="link" {...skip.linkProps}>skip</a>
    }
    render(<D />)
    // should not throw
    fireEvent.click(screen.getByTestId('link'))
    expect(document.activeElement).not.toBeNull()
  })
})

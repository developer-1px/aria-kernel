/**
 * useAnnouncer — Demo render + button click only.
 * region textContent + aria-live attributes 만 검증. 내부 unit test 0건.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useAnnouncer } from './liveRegion'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

function Demo() {
  const { announce, politeProps, assertiveProps } = useAnnouncer()
  return (
    <div>
      <button onClick={() => announce('3 selected')}>polite</button>
      <button onClick={() => announce('Save failed', { assertive: true })}>assertive</button>
      <button onClick={() => announce('Loading', { dedupe: 500 })}>dedupe</button>
      <div data-testid="polite" {...politeProps} />
      <div data-testid="assertive" {...assertiveProps} />
    </div>
  )
}

const flush = () => act(() => { vi.advanceTimersByTime(100) })

describe('useAnnouncer', () => {
  it('renders two regions with correct aria-live politeness', () => {
    render(<Demo />)
    const polite = screen.getByTestId('polite')
    const assertive = screen.getByTestId('assertive')
    expect(polite.getAttribute('aria-live')).toBe('polite')
    expect(polite.getAttribute('role')).toBe('status')
    expect(assertive.getAttribute('aria-live')).toBe('assertive')
    expect(assertive.getAttribute('role')).toBe('alert')
    expect(polite.getAttribute('aria-atomic')).toBe('true')
  })

  it('announces polite message into polite region only', () => {
    render(<Demo />)
    fireEvent.click(screen.getByText('polite'))
    flush()
    expect(screen.getByTestId('polite').textContent).toBe('3 selected')
    expect(screen.getByTestId('assertive').textContent).toBe('')
  })

  it('announces assertive message into assertive region only', () => {
    render(<Demo />)
    fireEvent.click(screen.getByText('assertive'))
    flush()
    expect(screen.getByTestId('assertive').textContent).toBe('Save failed')
    expect(screen.getByTestId('polite').textContent).toBe('')
  })

  it('empty-then-fill — region clears before refilling so SR re-announces identical text', () => {
    render(<Demo />)
    fireEvent.click(screen.getByText('polite'))
    flush()
    expect(screen.getByTestId('polite').textContent).toBe('3 selected')
    // second click clears immediately, then fills
    fireEvent.click(screen.getByText('polite'))
    expect(screen.getByTestId('polite').textContent).toBe('')
    flush()
    expect(screen.getByTestId('polite').textContent).toBe('3 selected')
  })

  it('dedupe coalesces identical messages within the window', () => {
    render(<Demo />)
    fireEvent.click(screen.getByText('dedupe'))
    flush()
    expect(screen.getByTestId('polite').textContent).toBe('Loading')
    // within window — second click is dropped, region stays
    fireEvent.click(screen.getByText('dedupe'))
    flush()
    expect(screen.getByTestId('polite').textContent).toBe('Loading')
  })

  it('ignores empty messages', () => {
    function E() {
      const { announce, politeProps } = useAnnouncer()
      return (
        <div>
          <button onClick={() => announce('')}>empty</button>
          <div data-testid="r" {...politeProps} />
        </div>
      )
    }
    render(<E />)
    fireEvent.click(screen.getByText('empty'))
    flush()
    expect(screen.getByTestId('r').textContent).toBe('')
  })

  it('region is visually hidden', () => {
    render(<Demo />)
    const polite = screen.getByTestId('polite')
    // clip rect is the load-bearing SR-only signal
    expect(polite.style.position).toBe('absolute')
    expect(polite.style.overflow).toBe('hidden')
  })
})

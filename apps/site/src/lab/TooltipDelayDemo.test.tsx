import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TooltipDelayDemo } from './TooltipDelayDemo'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

const trigger = () => screen.getByRole('button', { name: /hover/ })
const tip = () => document.querySelector('[role="tooltip"]') as HTMLElement

describe('Tooltip delay demo — black-box', () => {
  it('초기에 tip 은 hidden', () => {
    render(<TooltipDelayDemo />)
    expect(tip().hidden).toBe(true)
  })

  it('hover 즉시 아닌 delayShow 뒤에 열림', () => {
    render(<TooltipDelayDemo />)
    fireEvent.mouseEnter(trigger())
    expect(tip().hidden).toBe(true)
    act(() => { vi.advanceTimersByTime(300) })
    expect(tip().hidden).toBe(false)
  })

  it('hover 해제 → delayHide 뒤에 닫힘', () => {
    render(<TooltipDelayDemo />)
    fireEvent.mouseEnter(trigger())
    act(() => { vi.advanceTimersByTime(300) })
    fireEvent.mouseLeave(trigger())
    act(() => { vi.advanceTimersByTime(100) })
    expect(tip().hidden).toBe(true)
  })

  it('focus 로도 열림 (키보드 접근성)', () => {
    render(<TooltipDelayDemo />)
    fireEvent.focus(trigger())
    act(() => { vi.advanceTimersByTime(300) })
    expect(tip().hidden).toBe(false)
  })
})

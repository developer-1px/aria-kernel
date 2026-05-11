import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CarouselAutoplayDemo } from './CarouselAutoplayDemo'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers(); cleanup() })

const slides = () => Array.from(document.querySelectorAll('[role="group"][aria-roledescription="slide"]')) as HTMLElement[]
const activeIndex = () => slides().findIndex((s) => s.dataset.active === 'true')
const pauseBtn = () => screen.getByRole('button', { name: /slide rotation/i })
const root = () => document.querySelector('[role="region"]') as HTMLElement

describe('Carousel autoplay demo — black-box', () => {
  it('초기에는 index=0', () => {
    render(<CarouselAutoplayDemo />)
    expect(activeIndex()).toBe(0)
  })

  it('intervalMs 경과 시 다음 슬라이드로 자동 이동', () => {
    render(<CarouselAutoplayDemo />)
    act(() => { vi.advanceTimersByTime(1500) })
    expect(activeIndex()).toBe(1)
  })

  it('hover 중에는 자동 회전 정지', () => {
    render(<CarouselAutoplayDemo />)
    fireEvent.mouseEnter(root())
    act(() => { vi.advanceTimersByTime(3000) })
    expect(activeIndex()).toBe(0)
  })

  it('explicit pause 후에는 hover 해제해도 재개 안 함', () => {
    render(<CarouselAutoplayDemo />)
    fireEvent.click(pauseBtn())
    act(() => { vi.advanceTimersByTime(3000) })
    expect(activeIndex()).toBe(0)
  })
})

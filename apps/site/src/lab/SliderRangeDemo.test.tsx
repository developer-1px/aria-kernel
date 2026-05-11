import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SliderRangeDemo } from './SliderRangeDemo'

afterEach(cleanup)

const thumbs = () => screen.getAllByRole('slider')
const valNow = (i: number) => Number(thumbs()[i]!.getAttribute('aria-valuenow'))

describe('SliderRange demo — black-box', () => {
  it('초기 values = [20, 70]', () => {
    render(<SliderRangeDemo />)
    expect(valNow(0)).toBe(20)
    expect(valNow(1)).toBe(70)
  })

  it('thumb[0] ArrowRight → +step (5)', () => {
    render(<SliderRangeDemo />)
    fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight' })
    expect(valNow(0)).toBe(25)
  })

  it('thumb[0] 가 thumb[1] 을 추월 ❌ (neighbor clamp)', () => {
    render(<SliderRangeDemo />)
    for (let i = 0; i < 20; i++) fireEvent.keyDown(thumbs()[0]!, { key: 'ArrowRight' })
    expect(valNow(0)).toBeLessThanOrEqual(valNow(1))
    expect(valNow(0)).toBe(70)
  })

  it('thumb[1] 의 valuemin = thumb[0] 의 현재값 (dynamic clamp)', () => {
    render(<SliderRangeDemo />)
    expect(thumbs()[1]!.getAttribute('aria-valuemin')).toBe('20')
  })
})

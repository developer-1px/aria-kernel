import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SliderKeyboardDemo } from './SliderKeyboardDemo'

afterEach(cleanup)

const thumb = () => screen.getByRole('slider')
const valueNow = () => Number(thumb().getAttribute('aria-valuenow'))

describe('Slider keyboard demo — black-box', () => {
  it('초기 value=40', () => {
    render(<SliderKeyboardDemo />)
    expect(valueNow()).toBe(40)
  })

  it('ArrowRight → +step (5)', () => {
    render(<SliderKeyboardDemo />)
    fireEvent.keyDown(thumb(), { key: 'ArrowRight' })
    expect(valueNow()).toBe(45)
  })

  it('PageUp → +step*10 (50)', () => {
    render(<SliderKeyboardDemo />)
    fireEvent.keyDown(thumb(), { key: 'PageUp' })
    expect(valueNow()).toBe(90)
  })

  it('Home → min (0)', () => {
    render(<SliderKeyboardDemo />)
    fireEvent.keyDown(thumb(), { key: 'Home' })
    expect(valueNow()).toBe(0)
  })

  it('End → max (100)', () => {
    render(<SliderKeyboardDemo />)
    fireEvent.keyDown(thumb(), { key: 'End' })
    expect(valueNow()).toBe(100)
  })

  it('max 에서 ArrowRight 누적되어도 max 초과 안 함', () => {
    render(<SliderKeyboardDemo />)
    fireEvent.keyDown(thumb(), { key: 'End' })
    fireEvent.keyDown(thumb(), { key: 'ArrowRight' })
    expect(valueNow()).toBe(100)
  })
})

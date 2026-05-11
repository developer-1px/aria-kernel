import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CheckboxMixedDemo } from './CheckboxMixedDemo'

afterEach(cleanup)

const parent = () => screen.getAllByRole('checkbox')[0]!
const child = (i: number) => screen.getAllByRole('checkbox')[i + 1]!
const state = (el: HTMLElement) => el.getAttribute('aria-checked')

describe('Checkbox mixed demo — black-box', () => {
  it('초기: parent=false, 자식 모두 false', () => {
    render(<CheckboxMixedDemo />)
    expect(state(parent())).toBe('false')
    expect(state(child(0))).toBe('false')
  })

  it('자식 하나 체크 → parent=mixed', () => {
    render(<CheckboxMixedDemo />)
    fireEvent.click(child(0))
    expect(state(parent())).toBe('mixed')
  })

  it('자식 전체 체크 → parent=true', () => {
    render(<CheckboxMixedDemo />)
    fireEvent.click(child(0))
    fireEvent.click(child(1))
    fireEvent.click(child(2))
    expect(state(parent())).toBe('true')
  })

  it('parent click (mixed 상태) → 자식 전체 true', () => {
    render(<CheckboxMixedDemo />)
    fireEvent.click(child(0))
    fireEvent.click(parent())
    expect(state(child(0))).toBe('true')
    expect(state(child(1))).toBe('true')
    expect(state(child(2))).toBe('true')
    expect(state(parent())).toBe('true')
  })

  it('parent click (all true 상태) → 자식 전체 false', () => {
    render(<CheckboxMixedDemo />)
    fireEvent.click(parent())
    fireEvent.click(parent())
    expect(state(child(0))).toBe('false')
    expect(state(parent())).toBe('false')
  })
})

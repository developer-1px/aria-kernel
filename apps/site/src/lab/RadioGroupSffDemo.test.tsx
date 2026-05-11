import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RadioGroupSffDemo } from './RadioGroupSffDemo'

afterEach(cleanup)

const radios = () => screen.getAllByRole('radio')
const isChecked = (i: number) => radios()[i]!.getAttribute('aria-checked') === 'true'

describe('RadioGroup sff demo — black-box', () => {
  it('초기에는 아무것도 체크 안 됨', () => {
    render(<RadioGroupSffDemo />)
    expect(isChecked(0)).toBe(false)
    expect(isChecked(1)).toBe(false)
    expect(isChecked(2)).toBe(false)
  })

  it('Click → 해당 radio checked', () => {
    render(<RadioGroupSffDemo />)
    fireEvent.click(radios()[1]!)
    expect(isChecked(0)).toBe(false)
    expect(isChecked(1)).toBe(true)
    expect(isChecked(2)).toBe(false)
  })

  it('ArrowDown → focus 이동과 함께 자동 체크 (sff)', () => {
    render(<RadioGroupSffDemo />)
    fireEvent.click(radios()[0]!)
    fireEvent.keyDown(radios()[0]!, { key: 'ArrowDown' })
    expect(isChecked(0)).toBe(false)
    expect(isChecked(1)).toBe(true)
  })

  it('radiogroup role + accessible name', () => {
    render(<RadioGroupSffDemo />)
    const group = screen.getByRole('radiogroup', { name: '사이즈' })
    expect(group).toBeTruthy()
  })
})

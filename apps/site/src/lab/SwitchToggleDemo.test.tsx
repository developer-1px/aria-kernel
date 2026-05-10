import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SwitchToggleDemo } from './SwitchToggleDemo'

afterEach(cleanup)

const sw = () => screen.getByRole('switch')
const isOn = () => sw().getAttribute('aria-checked') === 'true'

describe('Switch toggle demo — black-box', () => {
  it('초기에는 off', () => {
    render(<SwitchToggleDemo />)
    expect(isOn()).toBe(false)
  })

  it('Click 으로 토글', () => {
    render(<SwitchToggleDemo />)
    fireEvent.click(sw())
    expect(isOn()).toBe(true)
    fireEvent.click(sw())
    expect(isOn()).toBe(false)
  })

  it('Space 로 토글', () => {
    render(<SwitchToggleDemo />)
    fireEvent.keyDown(sw(), { key: ' ' })
    expect(isOn()).toBe(true)
  })

  it('Enter 로도 토글 (kernel 의 absorption)', () => {
    render(<SwitchToggleDemo />)
    fireEvent.keyDown(sw(), { key: 'Enter' })
    expect(isOn()).toBe(true)
  })

  it('role=switch + aria-checked 노출', () => {
    render(<SwitchToggleDemo />)
    expect(sw().getAttribute('role')).toBe('switch')
    expect(sw().getAttribute('aria-checked')).toBe('false')
  })
})

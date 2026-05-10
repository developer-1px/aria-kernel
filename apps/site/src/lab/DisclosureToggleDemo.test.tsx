import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DisclosureToggleDemo } from './DisclosureToggleDemo'

afterEach(cleanup)

const trigger = () => screen.getByRole('button', { name: /FAQ/ })
const panel = () => document.querySelector('[role="region"]') as HTMLElement
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true'

describe('Disclosure toggle demo — black-box', () => {
  it('초기 closed: aria-expanded=false, panel hidden', () => {
    render(<DisclosureToggleDemo />)
    expect(isOpen()).toBe(false)
    expect(panel().hidden).toBe(true)
  })

  it('Click → open + panel visible', () => {
    render(<DisclosureToggleDemo />)
    fireEvent.click(trigger())
    expect(isOpen()).toBe(true)
    expect(panel().hidden).toBe(false)
  })

  it('Enter → toggle', () => {
    render(<DisclosureToggleDemo />)
    fireEvent.keyDown(trigger(), { key: 'Enter' })
    expect(isOpen()).toBe(true)
    fireEvent.keyDown(trigger(), { key: 'Enter' })
    expect(isOpen()).toBe(false)
  })

  it('Space → toggle', () => {
    render(<DisclosureToggleDemo />)
    fireEvent.keyDown(trigger(), { key: ' ' })
    expect(isOpen()).toBe(true)
  })

  it('aria-controls = panel id (연결)', () => {
    render(<DisclosureToggleDemo />)
    expect(trigger().getAttribute('aria-controls')).toBe(panel().id)
  })
})

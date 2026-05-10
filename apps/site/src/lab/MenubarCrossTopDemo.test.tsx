import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MenubarCrossTopDemo } from './MenubarCrossTopDemo'

afterEach(cleanup)

const top = (name: string) => screen.getByRole('menuitem', { name })
const focused = () => document.activeElement as HTMLElement
const isOpen = (name: string) => top(name).getAttribute('aria-expanded') === 'true'

describe('Menubar cross-top demo — black-box', () => {
  it('role=menubar + label', () => {
    render(<MenubarCrossTopDemo />)
    expect(screen.getByRole('menubar', { name: 'Main' })).toBeTruthy()
  })

  it('초기 focus = 첫 top item (File)', () => {
    render(<MenubarCrossTopDemo />)
    expect(focused().textContent).toBe('File')
  })

  it('ArrowRight → 다음 top (Edit)', () => {
    render(<MenubarCrossTopDemo />)
    fireEvent.keyDown(top('File'), { key: 'ArrowRight' })
    expect(focused().textContent).toBe('Edit')
  })

  it('ArrowDown → submenu open + first child', () => {
    render(<MenubarCrossTopDemo />)
    fireEvent.keyDown(top('File'), { key: 'ArrowDown' })
    expect(isOpen('File')).toBe(true)
    expect(focused().textContent).toBe('New')
  })

  it('Escape → close submenu, top focus 유지', () => {
    render(<MenubarCrossTopDemo />)
    fireEvent.keyDown(top('File'), { key: 'ArrowDown' })
    fireEvent.keyDown(focused(), { key: 'Escape' })
    expect(isOpen('File')).toBe(false)
  })
})

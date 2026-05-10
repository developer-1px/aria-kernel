import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ToolbarSeparatorDemo } from './ToolbarSeparatorDemo'

afterEach(cleanup)

const focused = () => document.querySelector('[role="button"][tabindex="0"], [role="toolbar"] [tabindex="0"]') as HTMLElement | null
const fire = (key: string) => fireEvent.keyDown(focused()!, { key })

describe('Toolbar separator demo — black-box', () => {
  it('role=toolbar + label', () => {
    render(<ToolbarSeparatorDemo />)
    expect(screen.getByRole('toolbar', { name: 'Format' })).toBeTruthy()
  })

  it('separator role=separator', () => {
    render(<ToolbarSeparatorDemo />)
    expect(document.querySelector('[role="separator"]')).toBeTruthy()
  })

  it('초기 focus = 첫 버튼 (B)', () => {
    render(<ToolbarSeparatorDemo />)
    expect(focused()?.textContent).toBe('B')
  })

  it('ArrowRight 3회 → U → (separator skip) → ⇐', () => {
    render(<ToolbarSeparatorDemo />)
    fire('ArrowRight'); fire('ArrowRight'); fire('ArrowRight')
    expect(focused()?.textContent).toBe('⇐')
  })

  it('단일 tab stop — non-focus 버튼들은 tabindex=-1', () => {
    render(<ToolbarSeparatorDemo />)
    const buttons = screen.getAllByRole('button')
    const tabbable = buttons.filter((b) => b.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
  })
})

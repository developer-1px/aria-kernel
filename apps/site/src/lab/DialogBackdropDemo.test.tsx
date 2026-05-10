import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DialogBackdropDemo } from './DialogBackdropDemo'

afterEach(cleanup)

const openTrigger = () => screen.getByRole('button', { name: 'Open dialog' })
const dialog = () => screen.queryByRole('dialog')
const backdrop = () => document.querySelector('[data-state="open"]') as HTMLElement | null

describe('Dialog backdrop demo — black-box', () => {
  it('초기에 dialog 는 닫혀있다', () => {
    render(<DialogBackdropDemo />)
    expect(dialog()).toBeNull()
  })

  it('trigger 클릭으로 dialog open + backdrop 등장', () => {
    render(<DialogBackdropDemo />)
    fireEvent.click(openTrigger())
    expect(dialog()).not.toBeNull()
    expect(backdrop()).not.toBeNull()
  })

  it('backdrop self-target mousedown 으로 닫힌다 (kernel 흡수)', () => {
    render(<DialogBackdropDemo />)
    fireEvent.click(openTrigger())
    const bd = backdrop()!
    fireEvent.mouseDown(bd, { target: bd })
    expect(dialog()).toBeNull()
  })

  it('inside-click 으로는 닫히지 않는다 (drag-out 보호)', () => {
    render(<DialogBackdropDemo />)
    fireEvent.click(openTrigger())
    const inside = screen.getByText('제목')
    fireEvent.mouseDown(inside)
    expect(dialog()).not.toBeNull()
  })

  it('Escape 로도 닫힌다 (escape axis)', () => {
    render(<DialogBackdropDemo />)
    fireEvent.click(openTrigger())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(dialog()).toBeNull()
  })
})

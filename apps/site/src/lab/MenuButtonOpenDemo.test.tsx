import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MenuButtonOpenDemo } from './MenuButtonOpenDemo'

afterEach(cleanup)

const trigger = () => screen.getByRole('button', { name: /파일/ })
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true'
const activeItem = () => document.querySelector('[role="menuitem"][data-active]') as HTMLElement | null

describe('MenuButton open demo — black-box', () => {
  it('초기: aria-expanded=false, haspopup=menu', () => {
    render(<MenuButtonOpenDemo />)
    expect(isOpen()).toBe(false)
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
  })

  it('Click → open + 첫 항목 active', () => {
    render(<MenuButtonOpenDemo />)
    fireEvent.click(trigger())
    expect(isOpen()).toBe(true)
    expect(activeItem()?.textContent).toBe('새로 만들기')
  })

  it('ArrowDown (closed) → open + 첫 항목 active', () => {
    render(<MenuButtonOpenDemo />)
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    expect(isOpen()).toBe(true)
    expect(activeItem()?.textContent).toBe('새로 만들기')
  })

  it('ArrowUp (closed) → open + 마지막 항목 active', () => {
    render(<MenuButtonOpenDemo />)
    fireEvent.keyDown(trigger(), { key: 'ArrowUp' })
    expect(isOpen()).toBe(true)
    expect(activeItem()?.textContent).toBe('종료')
  })

  it('Enter (closed) → open + 첫 항목 active', () => {
    render(<MenuButtonOpenDemo />)
    fireEvent.keyDown(trigger(), { key: 'Enter' })
    expect(isOpen()).toBe(true)
    expect(activeItem()?.textContent).toBe('새로 만들기')
  })
})

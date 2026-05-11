import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MenuOutsideCloseDemo } from './MenuOutsideCloseDemo'

afterEach(cleanup)

const trigger = () => screen.getByRole('button', { name: /메뉴 (열|닫)기/ })
const menu = () => screen.queryByRole('menu')
const item = (name: string) => screen.getByRole('menuitem', { name })

describe('Menu outside-close demo — black-box', () => {
  it('초기에 menu 는 닫혀있다', () => {
    render(<MenuOutsideCloseDemo />)
    expect(menu()).toBeNull()
  })

  it('trigger 클릭으로 menu 가 열린다', () => {
    render(<MenuOutsideCloseDemo />)
    fireEvent.click(trigger())
    expect(menu()).not.toBeNull()
  })

  it('외부 클릭(document mousedown) 으로 닫힌다 — kernel onInteractOutside 흡수', () => {
    render(<MenuOutsideCloseDemo />)
    fireEvent.click(trigger())
    fireEvent.mouseDown(document.body)
    expect(menu()).toBeNull()
  })

  it('내부 menuitem 클릭은 외부가 아니므로 onInteractOutside 안 부름 — activate 로 닫힘', () => {
    render(<MenuOutsideCloseDemo />)
    fireEvent.click(trigger())
    fireEvent.click(item('복사'))
    expect(menu()).toBeNull()
  })

  it('Escape 로도 닫힌다 (escape axis) — focused item 에서 keydown', () => {
    render(<MenuOutsideCloseDemo />)
    fireEvent.click(trigger())
    const focused = document.activeElement as HTMLElement
    fireEvent.keyDown(focused, { key: 'Escape' })
    expect(menu()).toBeNull()
  })
})

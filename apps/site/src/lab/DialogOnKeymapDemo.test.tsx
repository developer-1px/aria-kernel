import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DialogOnKeymapDemo } from './DialogOnKeymapDemo'

afterEach(cleanup)

const input = () => screen.getByRole('textbox') as HTMLInputElement
const matchLabel = () => screen.getByText(/match:/).textContent ?? ''

describe('Dialog on-keymap demo — black-box', () => {
  it('초기 input 빈 상태 — match (없음)', () => {
    render(<DialogOnKeymapDemo />)
    expect(matchLabel()).toMatch(/없음/)
  })

  it('input 에 a 입력 → 3 matches; 첫 매치 alpha', () => {
    render(<DialogOnKeymapDemo />)
    fireEvent.change(input(), { target: { value: 'a' } })
    expect(matchLabel()).toMatch(/alpha/)
    expect(matchLabel()).toMatch(/3개/)
  })

  it('input focus 상태에서 Enter → 다음 match 로 이동 (dialog on Enter 흡수)', () => {
    render(<DialogOnKeymapDemo />)
    fireEvent.change(input(), { target: { value: 'a' } })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(matchLabel()).toMatch(/banana/)
  })

  it('Shift+Enter → 이전 match 로 (wrap)', () => {
    render(<DialogOnKeymapDemo />)
    fireEvent.change(input(), { target: { value: 'a' } })
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true })
    expect(matchLabel()).toMatch(/durian/)
  })

  it('consumer 의 input 에 onKeyDown 부착 0 — kernel on 미들웨어가 흡수', () => {
    render(<DialogOnKeymapDemo />)
    const inp = input()
    expect(inp.onkeydown).toBeNull()
  })
})

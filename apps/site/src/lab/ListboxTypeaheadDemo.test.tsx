import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ListboxTypeaheadDemo } from './ListboxTypeaheadDemo'

let nowSpy: ReturnType<typeof vi.spyOn>
let mockNow = 1_000_000
beforeEach(() => {
  mockNow = 1_000_000
  nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => mockNow)
})
afterEach(() => { nowSpy.mockRestore(); cleanup() })
const advance = (ms: number) => { mockNow += ms }

const focused = () => document.querySelector('[role="option"][tabindex="0"]') as HTMLElement | null
const fire = (key: string) => fireEvent.keyDown(focused()!, { key })

describe('Listbox typeahead demo — black-box', () => {
  it('초기 focus = 첫 옵션 (Brazil)', () => {
    render(<ListboxTypeaheadDemo />)
    expect(focused()?.textContent).toBe('Brazil')
  })

  it('"j" → Japan 으로 점프', () => {
    render(<ListboxTypeaheadDemo />)
    fire('j')
    expect(focused()?.textContent).toBe('Japan')
  })

  it('"k" 연속 입력 → buffer 누적 = "kor" → Korea', () => {
    render(<ListboxTypeaheadDemo />)
    fire('k'); fire('o'); fire('r')
    expect(focused()?.textContent).toBe('Korea')
  })

  it('500ms 경과 후 buffer 초기화 — "c" 후 1초 뒤 "j" → Japan', () => {
    render(<ListboxTypeaheadDemo />)
    fire('c')
    expect(focused()?.textContent).toBe('Canada')
    advance(1000)
    fire('j')
    expect(focused()?.textContent).toBe('Japan')
  })

  it('listbox role 노출', () => {
    render(<ListboxTypeaheadDemo />)
    expect(screen.getByRole('listbox', { name: '국가' })).toBeTruthy()
  })
})

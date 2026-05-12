import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Demo, { meta } from './radioGroup'

afterEach(cleanup)

const group = () => screen.getByRole('radiogroup') as HTMLElement
const radios = () => screen.getAllByRole('radio') as HTMLElement[]
const focused = () => radios().find((r) => r.tabIndex === 0)!
const checked = () => radios().filter((r) => r.getAttribute('aria-checked') === 'true')

describe('radio demo — black-box (keyboard + mouse)', () => {
  it('초기 — Medium 이 checked', () => {
    render(<Demo />)
    expect(checked().length).toBe(1)
    expect(checked()[0].textContent).toContain('Medium')
  })

  it('radiogroup role + 3개 radio', () => {
    render(<Demo />)
    expect(group().getAttribute('role')).toBe('radiogroup')
    expect(radios().length).toBe(3)
  })

  it('마우스 클릭으로 다른 radio 선택', () => {
    render(<Demo />)
    fireEvent.click(radios()[0])
    expect(checked().length).toBe(1)
    expect(checked()[0].textContent).toContain('Small')
  })

  it('Space 로 focus 된 radio 가 selected 된다', () => {
    render(<Demo />)
    fireEvent.click(radios()[0])
    // focus 다음 radio 로 이동 후 Space
    fireEvent.keyDown(focused(), { key: 'ArrowDown' })
    fireEvent.keyDown(focused(), { key: ' ' })
    expect(checked()[0].textContent).toContain('Medium')
  })

  it('ArrowDown 으로 focus + selection 동시 이동 (sff)', () => {
    render(<Demo />)
    fireEvent.click(radios()[0])
    expect(focused().textContent).toContain('Small')
    fireEvent.keyDown(focused(), { key: 'ArrowDown' })
    expect(focused().textContent).toContain('Medium')
    expect(checked()[0].textContent).toContain('Medium')
  })

  it('ArrowUp 으로 focus + selection 이전 radio (sff)', () => {
    render(<Demo />)
    // 시작점을 명시적으로 Large 로 — End 키 사용 (sff 적용 후 navigate=Large + select=Large).
    fireEvent.click(radios()[0])
    fireEvent.keyDown(focused(), { key: 'End' })
    expect(focused().textContent).toContain('Large')
    fireEvent.keyDown(focused(), { key: 'ArrowUp' })
    expect(focused().textContent).toContain('Medium')
    expect(checked()[0].textContent).toContain('Medium')
  })

  it('ArrowRight 도 navigate + sff', () => {
    render(<Demo />)
    fireEvent.click(radios()[0])
    fireEvent.keyDown(focused(), { key: 'ArrowRight' })
    expect(focused().textContent).toContain('Medium')
    expect(checked()[0].textContent).toContain('Medium')
  })

  it('Home/End 로 첫/마지막 radio 로 focus 이동', () => {
    render(<Demo />)
    fireEvent.click(radios()[0])
    fireEvent.keyDown(focused(), { key: 'End' })
    expect(focused().textContent).toContain('Large')
    fireEvent.keyDown(focused(), { key: 'Home' })
    expect(focused().textContent).toContain('Small')
  })

  it('aria-orientation=vertical', () => {
    render(<Demo />)
    expect(group().getAttribute('aria-orientation')).toBe('vertical')
  })

  it('meta.keys 의 모든 키가 black-box 동작을 일으킨다 (focus 또는 checked)', () => {
    const snap = () => ({
      checked: radios().map((r) => r.getAttribute('aria-checked')).join(','),
      focusLabel: focused()?.textContent ?? '',
    })
    const startsFromLast = ['Home', 'ArrowUp', 'ArrowLeft', 'PageUp']
    for (const key of meta.keys!()) {
      cleanup()
      render(<Demo />)
      fireEvent.click(radios()[0])
      if (startsFromLast.includes(key)) fireEvent.keyDown(focused(), { key: 'End' })
      const before = snap()
      if (key === 'Click') fireEvent.click(radios()[2])
      else fireEvent.keyDown(focused(), { key })
      const after = snap()
      const changed = before.checked !== after.checked || before.focusLabel !== after.focusLabel
      expect({ key, changed }).toEqual({ key, changed: true })
    }
  })
})

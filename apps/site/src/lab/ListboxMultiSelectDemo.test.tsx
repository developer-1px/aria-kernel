import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ListboxMultiSelectDemo } from './ListboxMultiSelectDemo'

afterEach(cleanup)

const opt = (label: string) => screen.getByRole('option', { name: label })
const isSel = (label: string) => opt(label).getAttribute('aria-selected') === 'true'

describe('Listbox multiselect demo — black-box', () => {
  it('listbox 에 aria-multiselectable=true', () => {
    render(<ListboxMultiSelectDemo />)
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true')
  })

  it('Space 로 토글', () => {
    render(<ListboxMultiSelectDemo />)
    const a = opt('사과')
    a.focus()
    fireEvent.keyDown(a, { key: ' ' })
    expect(isSel('사과')).toBe(true)
    fireEvent.keyDown(a, { key: ' ' })
    expect(isSel('사과')).toBe(false)
  })

  it('Ctrl/Cmd+Click 으로 개별 토글', () => {
    render(<ListboxMultiSelectDemo />)
    fireEvent.click(opt('사과'), { ctrlKey: true })
    fireEvent.click(opt('체리'), { ctrlKey: true })
    expect(isSel('사과')).toBe(true)
    expect(isSel('바나나')).toBe(false)
    expect(isSel('체리')).toBe(true)
  })

  it('Shift+Click 으로 범위 선택', () => {
    render(<ListboxMultiSelectDemo />)
    fireEvent.click(opt('사과'))
    fireEvent.click(opt('체리'), { shiftKey: true })
    expect(isSel('사과')).toBe(true)
    expect(isSel('바나나')).toBe(true)
    expect(isSel('체리')).toBe(true)
    expect(isSel('대추')).toBe(false)
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ComboboxFilterDemo } from './ComboboxFilterDemo'

afterEach(cleanup)

const input = () => screen.getByRole('combobox') as HTMLInputElement
const options = () => Array.from(document.querySelectorAll('[role="option"]')) as HTMLElement[]
const labels = () => options().map((o) => o.textContent)

describe('Combobox filter demo — black-box', () => {
  it('focus 시 popup 열림 (openOnFocus)', () => {
    render(<ComboboxFilterDemo />)
    fireEvent.focus(input())
    expect(input().getAttribute('aria-expanded')).toBe('true')
  })

  it('타이핑 → 매칭 옵션만 visible', () => {
    render(<ComboboxFilterDemo />)
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: 'ap' } })
    expect(labels()).toEqual(['Apple', 'Apricot', 'Grape'])
  })

  it('case-insensitive 매칭', () => {
    render(<ComboboxFilterDemo />)
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: 'KI' } })
    expect(labels()).toEqual(['Kiwi'])
  })

  it('매칭 없음 → empty 상태', () => {
    render(<ComboboxFilterDemo />)
    fireEvent.focus(input())
    fireEvent.change(input(), { target: { value: 'zzz' } })
    expect(labels()).toEqual([])
    expect(screen.getByText('매칭 없음')).toBeTruthy()
  })

  it('Escape → popup close (aria-expanded=false)', () => {
    render(<ComboboxFilterDemo />)
    fireEvent.focus(input())
    expect(input().getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(input(), { key: 'Escape' })
    expect(input().getAttribute('aria-expanded')).toBe('false')
  })
})

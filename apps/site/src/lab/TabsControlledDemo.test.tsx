import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TabsControlledDemo } from './TabsControlledDemo'

afterEach(cleanup)

const tab = (name: string) => screen.getByRole('tab', { name })
const selected = () => screen.getAllByRole('tab').filter((t) => t.getAttribute('aria-selected') === 'true')

describe('Tabs controlled demo — black-box', () => {
  it('초기 selected = Sheet1', () => {
    render(<TabsControlledDemo />)
    expect(selected().map((t) => t.textContent)).toEqual(['Sheet1'])
  })

  it('Sheet3 클릭 → activate → active=Sheet3', () => {
    render(<TabsControlledDemo />)
    fireEvent.click(tab('Sheet3'))
    expect(selected().map((t) => t.textContent)).toEqual(['Sheet3'])
  })

  it('ArrowRight → sff navigate → 다음 탭으로 selection 따라감', () => {
    render(<TabsControlledDemo />)
    tab('Sheet1').focus()
    fireEvent.keyDown(tab('Sheet1'), { key: 'ArrowRight' })
    expect(selected().map((t) => t.textContent)).toEqual(['Sheet2'])
  })

  it('ArrowLeft 끝에서 → wrap to last (APG horizontal tabs)', () => {
    render(<TabsControlledDemo />)
    tab('Sheet1').focus()
    fireEvent.keyDown(tab('Sheet1'), { key: 'ArrowLeft' })
    expect(selected().map((t) => t.textContent)).toEqual(['Sheet3'])
  })

  it('data.entities mutation 없이 active prop 만으로 동작 — selection 1개 invariant', () => {
    render(<TabsControlledDemo />)
    fireEvent.click(tab('Sheet2'))
    fireEvent.click(tab('Sheet3'))
    expect(selected()).toHaveLength(1)
    expect(selected()[0].textContent).toBe('Sheet3')
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AccordionSingleDemo } from './AccordionSingleDemo'

afterEach(cleanup)

const btn = (label: RegExp) => screen.getByRole('button', { name: label })
const isOpen = (label: RegExp) => btn(label).getAttribute('aria-expanded') === 'true'

describe('Accordion single demo — black-box', () => {
  it('초기에는 모두 닫혀있다', () => {
    render(<AccordionSingleDemo />)
    expect(isOpen(/주문은/)).toBe(false)
    expect(isOpen(/반품/)).toBe(false)
    expect(isOpen(/배송/)).toBe(false)
  })

  it('하나 열면 그 항목만 expanded=true', () => {
    render(<AccordionSingleDemo />)
    fireEvent.click(btn(/주문은/))
    expect(isOpen(/주문은/)).toBe(true)
  })

  it('두 번째 열면 첫 번째는 자동 collapse (single mode)', () => {
    render(<AccordionSingleDemo />)
    fireEvent.click(btn(/주문은/))
    fireEvent.click(btn(/반품/))
    expect(isOpen(/주문은/)).toBe(false)
    expect(isOpen(/반품/)).toBe(true)
  })

  it('열린 항목 다시 클릭하면 닫힌다', () => {
    render(<AccordionSingleDemo />)
    fireEvent.click(btn(/주문은/))
    fireEvent.click(btn(/주문은/))
    expect(isOpen(/주문은/)).toBe(false)
  })
})

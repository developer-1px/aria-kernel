import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TreeArrowDemo } from './TreeArrowDemo'

afterEach(cleanup)

const focused = () => document.querySelector('[role="treeitem"][tabindex="0"]') as HTMLElement
const fire = (key: string) => fireEvent.keyDown(focused(), { key })
const itemByLabel = (label: string) =>
  screen.getAllByRole('treeitem').find((el) => el.textContent?.includes(label))!
const isExpanded = (label: string) => itemByLabel(label).getAttribute('aria-expanded') === 'true'

describe('Tree arrow demo — black-box', () => {
  it('초기 focus = Fruits (collapsed)', () => {
    render(<TreeArrowDemo />)
    expect(focused().textContent).toContain('Fruits')
    expect(isExpanded('Fruits')).toBe(false)
  })

  it('Right on collapsed = expand', () => {
    render(<TreeArrowDemo />)
    fire('ArrowRight')
    expect(isExpanded('Fruits')).toBe(true)
  })

  it('Right on expanded = move to first child', () => {
    render(<TreeArrowDemo />)
    fire('ArrowRight')
    fire('ArrowRight')
    expect(focused().textContent).toContain('Apple')
  })

  it('Left on leaf = move to parent', () => {
    render(<TreeArrowDemo />)
    fire('ArrowRight'); fire('ArrowRight')
    expect(focused().textContent).toContain('Apple')
    fire('ArrowLeft')
    expect(focused().textContent).toContain('Fruits')
  })

  it('↓ focus 이동은 expand 유발 ❌', () => {
    render(<TreeArrowDemo />)
    fire('ArrowDown')
    expect(focused().textContent).toContain('Vegetables')
    expect(isExpanded('Fruits')).toBe(false)
    expect(isExpanded('Vegetables')).toBe(false)
  })
})

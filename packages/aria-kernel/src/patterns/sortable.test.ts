import { describe, it, expect } from 'vitest'
import { sortablePattern } from './sortable'

describe('sortablePattern (keyboard reorder markup, axis follow-up)', () => {
  const items = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' },
  ]

  it('rootProps: role=listbox + aria-label + aria-activedescendant when active id given', () => {
    const { rootProps } = sortablePattern({ items, label: 'Priorities', activeId: 'b' })
    expect(rootProps.role).toBe('listbox')
    expect(rootProps['aria-label']).toBe('Priorities')
    expect(rootProps['aria-activedescendant']).toBe('sortable-b')
  })

  it('rootProps omits aria-activedescendant when no activeId', () => {
    const { rootProps } = sortablePattern({ items })
    expect('aria-activedescendant' in rootProps).toBe(false)
  })

  it('itemProps(id): role=option, stable id, tabIndex=-1 (composite roving)', () => {
    const { itemProps } = sortablePattern({ items })
    const p = itemProps('a')
    expect(p.role).toBe('option')
    expect(p.id).toBe('sortable-a')
    expect(p.tabIndex).toBe(-1)
    expect(p['data-id']).toBe('a')
  })

  it('itemProps grabbed: aria-selected=true when id===grabbedId', () => {
    const { itemProps } = sortablePattern({ items, grabbedId: 'b' })
    expect(itemProps('b')['aria-selected']).toBe(true)
    expect(itemProps('a')['aria-selected']).toBe(false)
  })

  it('idPrefix override', () => {
    const { itemProps, rootProps } = sortablePattern({ items, idPrefix: 'pri', activeId: 'a' })
    expect(itemProps('a').id).toBe('pri-a')
    expect(rootProps['aria-activedescendant']).toBe('pri-a')
  })

  it('itemProps omits aria-selected when no grabbedId set', () => {
    const { itemProps } = sortablePattern({ items })
    expect('aria-selected' in itemProps('a')).toBe(false)
  })
})

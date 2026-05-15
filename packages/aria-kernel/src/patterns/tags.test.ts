import { describe, it, expect } from 'vitest'
import { tagsPattern } from './tags'

describe('tagsPattern (chip list ARIA recipe)', () => {
  const tags = [
    { id: 't1', label: 'react' },
    { id: 't2', label: 'a11y' },
  ]

  it('rootProps: role=list + aria-label when provided', () => {
    const { rootProps } = tagsPattern({ tags, label: 'Topics' })
    expect(rootProps.role).toBe('list')
    expect(rootProps['aria-label']).toBe('Topics')
  })

  it('rootProps omits aria-label when not provided', () => {
    const { rootProps } = tagsPattern({ tags })
    expect('aria-label' in rootProps).toBe(false)
  })

  it('chipProps(id): role=listitem + data-id', () => {
    const { chipProps } = tagsPattern({ tags })
    const p = chipProps('t1')
    expect(p.role).toBe('listitem')
    expect(p['data-id']).toBe('t1')
  })

  it('removeProps(id, label): type=button + aria-label="Remove <label>"', () => {
    const { removeProps } = tagsPattern({ tags })
    const p = removeProps('t1', 'react')
    expect(p.type).toBe('button')
    expect(p['aria-label']).toBe('Remove react')
  })

  it('removeProps onClick calls onRemove with the id', () => {
    const calls: string[] = []
    const { removeProps } = tagsPattern({ tags, onRemove: (id) => calls.push(id) })
    removeProps('t2', 'a11y').onClick?.({ preventDefault() {}, stopPropagation() {} } as never)
    expect(calls).toEqual(['t2'])
  })

  it('removeProps onClick is a no-op when no onRemove given', () => {
    const { removeProps } = tagsPattern({ tags })
    expect(() => removeProps('t1', 'react').onClick?.({ preventDefault() {}, stopPropagation() {} } as never)).not.toThrow()
  })
})

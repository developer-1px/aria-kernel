import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fromList } from '../view-state/fromTree'
import { useTabsPattern } from './tabs'

const data = (entries: Array<{ id: string; selected?: boolean }>) =>
  fromList(entries.map(({ id, selected }) => ({ id, label: id, selected })))

describe('useTabsPattern — controlled active prop', () => {
  it('active 미제공 시 data.entities[id].selected 따라감 (uncontrolled)', () => {
    const d = data([{ id: 'a' }, { id: 'b', selected: true }, { id: 'c' }])
    const { result } = renderHook(() => useTabsPattern(d, undefined, { label: 't' }))
    expect(result.current.items.find((i) => i.id === 'b')?.selected).toBe(true)
    expect(result.current.items.find((i) => i.id === 'a')?.selected).toBe(false)
  })

  it('active 제공 시 data.entities.selected 무시, active===id 로 도출', () => {
    const d = data([{ id: 'a', selected: true }, { id: 'b' }, { id: 'c' }])
    const { result } = renderHook(() => useTabsPattern(d, undefined, { label: 't', active: 'c' }))
    expect(result.current.items.find((i) => i.id === 'c')?.selected).toBe(true)
    expect(result.current.items.find((i) => i.id === 'a')?.selected).toBe(false)
  })

  it('selection 카디널리티 항상 1 (active 가 미존재 id 이면 0)', () => {
    const d = data([{ id: 'a' }, { id: 'b' }])
    const { result } = renderHook(() => useTabsPattern(d, undefined, { label: 't', active: 'z' }))
    const sel = result.current.items.filter((i) => i.selected)
    expect(sel.length).toBe(0)
  })
})

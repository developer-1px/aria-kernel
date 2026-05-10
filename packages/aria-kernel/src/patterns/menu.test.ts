import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fromList } from '../state/fromTree'
import { useMenuPattern } from './menu'

const data = () => fromList([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }])

describe('useMenuPattern — listener lifecycle', () => {
  it('open=false → document mousedown 리스너 부착 안 함', () => {
    const spy = vi.spyOn(document, 'addEventListener')
    renderHook(() => useMenuPattern(data(), undefined, { label: 'm', onInteractOutside: () => {}, open: false }))
    expect(spy.mock.calls.some(([type]) => type === 'mousedown')).toBe(false)
    spy.mockRestore()
  })

  it('onInteractOutside 미제공 → 리스너 부착 안 함 (open=true 여도)', () => {
    const spy = vi.spyOn(document, 'addEventListener')
    renderHook(() => useMenuPattern(data(), undefined, { label: 'm', open: true }))
    expect(spy.mock.calls.some(([type]) => type === 'mousedown')).toBe(false)
    spy.mockRestore()
  })

  it('open=true + onInteractOutside 제공 → 리스너 부착', () => {
    const spy = vi.spyOn(document, 'addEventListener')
    renderHook(() => useMenuPattern(data(), undefined, { label: 'm', onInteractOutside: () => {}, open: true }))
    expect(spy.mock.calls.some(([type]) => type === 'mousedown')).toBe(true)
    spy.mockRestore()
  })

  it('rootProps.role = menu (ARIA shape)', () => {
    const { result } = renderHook(() => useMenuPattern(data(), undefined, { label: 'm' }))
    expect((result.current.rootProps as Record<string, unknown>).role).toBe('menu')
  })
})

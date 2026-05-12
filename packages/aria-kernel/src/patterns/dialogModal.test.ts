import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDialogModalPattern } from './dialogModal'

describe('useDialogModalPattern — backdropProps + onOpenChange + on', () => {
  it('rootProps role=dialog, aria-modal 반영', () => {
    const { result } = renderHook(() => useDialogModalPattern({ open: true, modal: true, label: 'D' }))
    expect((result.current.rootProps as unknown as Record<string, unknown>).role).toBe('dialog')
    expect((result.current.rootProps as unknown as Record<string, unknown>)['aria-modal']).toBe(true)
  })

  it('backdropProps.onMouseDown — self-target 만 setOpen(false)', () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useDialogModalPattern({ open: true, onOpenChange }))
    const bd = result.current.backdropProps as unknown as Record<string, unknown>
    const onMouseDown = bd.onMouseDown as (e: { target: unknown; currentTarget: unknown }) => void
    const self = {}
    onMouseDown({ target: self, currentTarget: self })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('backdropProps.onMouseDown — target !== currentTarget 이면 무시', () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useDialogModalPattern({ open: true, onOpenChange }))
    const bd = result.current.backdropProps as unknown as Record<string, unknown>
    const onMouseDown = bd.onMouseDown as (e: { target: unknown; currentTarget: unknown }) => void
    onMouseDown({ target: {}, currentTarget: {} })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closeProps.onClick → onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useDialogModalPattern({ open: true, onOpenChange }))
    const cp = result.current.closeProps as unknown as Record<string, unknown>
    act(() => { (cp.onClick as () => void)() })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('useDialogModalPattern — on keymap middleware', () => {
  it('open=true + on 제공 → window keydown 리스너 부착', () => {
    const spy = vi.spyOn(window, 'addEventListener')
    renderHook(() => useDialogModalPattern({ open: true, on: { Enter: () => {} } }))
    expect(spy.mock.calls.some(([type]) => type === 'keydown')).toBe(true)
    spy.mockRestore()
  })

  it('open=false → 리스너 부착 안 함', () => {
    const spy = vi.spyOn(window, 'addEventListener')
    renderHook(() => useDialogModalPattern({ open: false, on: { Enter: () => {} } }))
    expect(spy.mock.calls.some(([type]) => type === 'keydown')).toBe(false)
    spy.mockRestore()
  })

  it('open=true→false 전환 시 리스너 cleanup', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { rerender } = renderHook(
      ({ open }: { open: boolean }) => useDialogModalPattern({ open, on: { Enter: () => {} } }),
      { initialProps: { open: true } },
    )
    const added = addSpy.mock.calls.filter(([t]) => t === 'keydown').length
    rerender({ open: false })
    const removed = removeSpy.mock.calls.filter(([t]) => t === 'keydown').length
    expect(removed).toBeGreaterThanOrEqual(added)
    addSpy.mockRestore(); removeSpy.mockRestore()
  })
})

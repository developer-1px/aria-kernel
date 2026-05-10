import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDialogPattern } from './dialog'

describe('useDialogPattern — backdropProps + onOpenChange + on', () => {
  it('rootProps role=dialog, aria-modal 반영', () => {
    const { result } = renderHook(() => useDialogPattern({ open: true, modal: true, label: 'D' }))
    expect((result.current.rootProps as Record<string, unknown>).role).toBe('dialog')
    expect((result.current.rootProps as Record<string, unknown>)['aria-modal']).toBe(true)
  })

  it('backdropProps.onMouseDown — self-target 만 setOpen(false)', () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useDialogPattern({ open: true, onOpenChange }))
    const bd = result.current.backdropProps as Record<string, unknown>
    const onMouseDown = bd.onMouseDown as (e: { target: unknown; currentTarget: unknown }) => void
    const self = {}
    onMouseDown({ target: self, currentTarget: self })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('backdropProps.onMouseDown — target !== currentTarget 이면 무시', () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useDialogPattern({ open: true, onOpenChange }))
    const bd = result.current.backdropProps as Record<string, unknown>
    const onMouseDown = bd.onMouseDown as (e: { target: unknown; currentTarget: unknown }) => void
    onMouseDown({ target: {}, currentTarget: {} })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closeProps.onClick → onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    const { result } = renderHook(() => useDialogPattern({ open: true, onOpenChange }))
    const cp = result.current.closeProps as Record<string, unknown>
    act(() => { (cp.onClick as () => void)() })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

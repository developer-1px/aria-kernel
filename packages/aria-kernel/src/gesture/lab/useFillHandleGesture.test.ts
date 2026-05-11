import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFillHandleGesture } from './useFillHandleGesture'

interface Rect { rMin: number; rMax: number; cMin: number; cMax: number }
const SRC: Rect = { rMin: 0, rMax: 0, cMin: 0, cMax: 0 }
const TGT: Rect = { rMin: 0, rMax: 2, cMin: 0, cMax: 0 }

describe('useFillHandleGesture (lab)', () => {
  it('mousedown on handle → preview = source', () => {
    const { result } = renderHook(() => useFillHandleGesture<Rect>({ onCommit: vi.fn() }))
    act(() => {
      result.current.handleProps(SRC).onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    })
    expect(result.current.preview).toEqual(SRC)
  })

  it('setTarget while dragging → preview = target', () => {
    const { result } = renderHook(() => useFillHandleGesture<Rect>({ onCommit: vi.fn() }))
    act(() => {
      result.current.handleProps(SRC).onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
      result.current.setTarget(TGT)
    })
    expect(result.current.preview).toEqual(TGT)
  })

  it('mouseup with target → onCommit(source, target), preview cleared', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useFillHandleGesture<Rect>({ onCommit }))
    act(() => {
      result.current.handleProps(SRC).onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
      result.current.setTarget(TGT)
    })
    act(() => { window.dispatchEvent(new MouseEvent('mouseup')) })
    expect(onCommit).toHaveBeenCalledWith(SRC, TGT)
    expect(result.current.preview).toBeNull()
  })

  it('mouseup with target===source → onCommit 호출 안 됨 (no-op)', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useFillHandleGesture<Rect>({ onCommit }))
    act(() => {
      result.current.handleProps(SRC).onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    })
    act(() => { window.dispatchEvent(new MouseEvent('mouseup')) })
    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.preview).toBeNull()
  })

  it('setTarget without active drag → preview 변화 없음', () => {
    const { result } = renderHook(() => useFillHandleGesture<Rect>({ onCommit: vi.fn() }))
    act(() => { result.current.setTarget(TGT) })
    expect(result.current.preview).toBeNull()
  })
})

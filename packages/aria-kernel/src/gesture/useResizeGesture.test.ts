import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useResizeGesture } from './useResizeGesture'

function dispatchMouse(type: string, clientX: number, clientY: number) {
  const e = new MouseEvent(type, { clientX, clientY, bubbles: true })
  window.dispatchEvent(e)
}

describe('useResizeGesture', () => {
  it('mousedown → mousemove → onChange(initial + dx) (axis x)', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useResizeGesture({ axis: 'x', initial: () => 100, onChange }),
    )
    const handleProps = result.current.handleProps as unknown as { onMouseDown: (e: { clientX: number; clientY: number; preventDefault?: () => void }) => void }
    handleProps.onMouseDown({ clientX: 50, clientY: 0, preventDefault: () => {} })
    dispatchMouse('mousemove', 80, 0)
    expect(onChange).toHaveBeenLastCalledWith(130) // 100 + (80 - 50)
    dispatchMouse('mouseup', 80, 0)
  })

  it('min/max 클램핑', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useResizeGesture({ axis: 'x', initial: () => 100, onChange, min: 50, max: 150 }),
    )
    const hp = result.current.handleProps as unknown as { onMouseDown: (e: { clientX: number; clientY: number; preventDefault?: () => void }) => void }
    hp.onMouseDown({ clientX: 0, clientY: 0, preventDefault: () => {} })
    dispatchMouse('mousemove', -100, 0)  // 100 - 100 = 0 → clamped to 50
    expect(onChange).toHaveBeenLastCalledWith(50)
    dispatchMouse('mousemove', 200, 0)   // 100 + 200 = 300 → clamped to 150
    expect(onChange).toHaveBeenLastCalledWith(150)
    dispatchMouse('mouseup', 0, 0)
  })

  it('mouseup 후 mousemove 무시', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useResizeGesture({ axis: 'x', initial: () => 100, onChange }),
    )
    const hp = result.current.handleProps as unknown as { onMouseDown: (e: { clientX: number; clientY: number; preventDefault?: () => void }) => void }
    hp.onMouseDown({ clientX: 0, clientY: 0, preventDefault: () => {} })
    dispatchMouse('mousemove', 10, 0)
    expect(onChange).toHaveBeenCalledTimes(1)
    dispatchMouse('mouseup', 10, 0)
    onChange.mockClear()
    dispatchMouse('mousemove', 999, 0)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('axis y — clientY delta', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useResizeGesture({ axis: 'y', initial: () => 200, onChange }),
    )
    const hp = result.current.handleProps as unknown as { onMouseDown: (e: { clientX: number; clientY: number; preventDefault?: () => void }) => void }
    hp.onMouseDown({ clientX: 0, clientY: 100, preventDefault: () => {} })
    dispatchMouse('mousemove', 0, 150)  // 200 + (150 - 100) = 250
    expect(onChange).toHaveBeenLastCalledWith(250)
    dispatchMouse('mouseup', 0, 150)
  })
})

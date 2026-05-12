import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fromTree } from '../../view-state/fromTree'
import { useGridDragSelectGesture, useGridDragSelectGestureRaw } from './useGridDragSelectGesture'
import type { UiEvent } from '../../intent/events'

type Node = { id: string; children?: Node[] }
const grid2x2 = fromTree<Node>([
  { id: 'r0', children: [{ id: 'A0' }, { id: 'B0' }] },
  { id: 'r1', children: [{ id: 'A1' }, { id: 'B1' }] },
])

describe('useGridDragSelectGesture', () => {
  it('mousedown(A0) → dispatch navigate + select(A0, anchor=true)', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() => useGridDragSelectGesture(grid2x2, dispatch))
    const h = result.current.getCellHandlers('A0')
    h.onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    expect(dispatch).toHaveBeenCalledWith({ type: 'navigate', id: 'A0' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'select', ids: ['A0'], anchor: true, to: true })
  })

  it('mousedown(A0) → mouseenter(B1) → rect events emit', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() => useGridDragSelectGesture(grid2x2, dispatch))
    const a0 = result.current.getCellHandlers('A0')
    a0.onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    dispatch.mockClear()
    const b1 = result.current.getCellHandlers('B1')
    b1.onMouseEnter({} as unknown as React.MouseEvent)
    // rect from A0 to B1 covers all 4 cells
    expect(dispatch).toHaveBeenCalledWith({ type: 'navigate', id: 'B1' })
    expect(dispatch).toHaveBeenCalledWith({ type: 'select', ids: ['A0', 'B0', 'A1', 'B1'], to: true })
  })

  it('mouseup 후 mouseenter 무시', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() => useGridDragSelectGesture(grid2x2, dispatch))
    result.current.getCellHandlers('A0').onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    window.dispatchEvent(new MouseEvent('mouseup'))
    dispatch.mockClear()
    result.current.getCellHandlers('B1').onMouseEnter({} as unknown as React.MouseEvent)
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('드래그 없이 mouseenter → 무시 (drag 아닌 hover)', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() => useGridDragSelectGesture(grid2x2, dispatch))
    result.current.getCellHandlers('B1').onMouseEnter({} as unknown as React.MouseEvent)
    expect(dispatch).not.toHaveBeenCalled()
  })
})

describe('useGridDragSelectGestureRaw (#157)', () => {
  it('mousedown → onAnchorChange(id), mouseenter → onRectChange(anchor, head)', () => {
    const onAnchorChange = vi.fn()
    const onRectChange = vi.fn()
    const { result } = renderHook(() =>
      useGridDragSelectGestureRaw({ onAnchorChange, onRectChange }),
    )
    result.current.getCellHandlers('A').onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    expect(onAnchorChange).toHaveBeenCalledWith('A')
    expect(onRectChange).not.toHaveBeenCalled()

    result.current.getCellHandlers('D').onMouseEnter({} as unknown as React.MouseEvent)
    expect(onRectChange).toHaveBeenCalledWith('A', 'D')
  })

  it('mouseup 후 mouseenter 무시', () => {
    const onRectChange = vi.fn()
    const { result } = renderHook(() =>
      useGridDragSelectGestureRaw({ onAnchorChange: () => {}, onRectChange }),
    )
    result.current.getCellHandlers('A').onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    window.dispatchEvent(new MouseEvent('mouseup'))
    result.current.getCellHandlers('D').onMouseEnter({} as unknown as React.MouseEvent)
    expect(onRectChange).not.toHaveBeenCalled()
  })

  it('anchor 자기 자신 enter → onRectChange 호출 ❌', () => {
    const onRectChange = vi.fn()
    const { result } = renderHook(() =>
      useGridDragSelectGestureRaw({ onAnchorChange: () => {}, onRectChange }),
    )
    result.current.getCellHandlers('A').onMouseDown({ preventDefault: () => {} } as unknown as React.MouseEvent)
    result.current.getCellHandlers('A').onMouseEnter({} as unknown as React.MouseEvent)
    expect(onRectChange).not.toHaveBeenCalled()
  })
})

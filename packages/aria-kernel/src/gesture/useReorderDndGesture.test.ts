import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { fromTree } from '../state/fromTree'
import {
  useReorderDndGesture,
  useReorderDndGestureRaw,
  positionToMoveMode,
} from './useReorderDndGesture'
import type { UiEvent } from '../types'

type Node = { id: string; children?: Node[] }
const list = fromTree<Node>([{ id: 'A' }, { id: 'B' }, { id: 'C' }])

// jsdom DragEvent shim — clientY + bounding rect + currentTarget.
const dragEvent = (clientY: number, height = 20): React.DragEvent => {
  const el = document.createElement('li')
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ top: 0, left: 0, height, width: 100, right: 100, bottom: height, x: 0, y: 0, toJSON() {} }),
  })
  return {
    currentTarget: el,
    clientY,
    preventDefault: () => {},
    dataTransfer: { setData: () => {}, getData: () => '', effectAllowed: '', dropEffect: '' },
  } as unknown as React.DragEvent
}

describe('useReorderDndGestureRaw (#165)', () => {
  it('dragstart(A) → onDragStart(A) 호출', () => {
    const onDragStart = vi.fn()
    const { result } = renderHook(() => useReorderDndGestureRaw({ onDragStart }))
    const h = result.current.getItemHandlers('A')
    act(() => h.onDragStart(dragEvent(0)))
    expect(onDragStart).toHaveBeenCalledWith('A')
  })

  it('dragstart(A) → dragover(B, y=상단) → onDragOver(A, B, "before")', () => {
    const onDragOver = vi.fn()
    const { result } = renderHook(() => useReorderDndGestureRaw({ onDragOver }))
    act(() => result.current.getItemHandlers('A').onDragStart(dragEvent(0)))
    act(() => result.current.getItemHandlers('B').onDragOver(dragEvent(2, 20)))
    expect(onDragOver).toHaveBeenCalledWith('A', 'B', 'before')
  })

  it('dragstart(A) → dragover(B, y=하단) → onDragOver(A, B, "after")', () => {
    const onDragOver = vi.fn()
    const { result } = renderHook(() => useReorderDndGestureRaw({ onDragOver }))
    act(() => result.current.getItemHandlers('A').onDragStart(dragEvent(0)))
    act(() => result.current.getItemHandlers('B').onDragOver(dragEvent(18, 20)))
    expect(onDragOver).toHaveBeenCalledWith('A', 'B', 'after')
  })

  it('allowInside: dragover(B, y=중앙) → "inside"', () => {
    const onDragOver = vi.fn()
    const { result } = renderHook(() => useReorderDndGestureRaw({ onDragOver, allowInside: true }))
    act(() => result.current.getItemHandlers('A').onDragStart(dragEvent(0)))
    act(() => result.current.getItemHandlers('B').onDragOver(dragEvent(10, 20)))
    expect(onDragOver).toHaveBeenCalledWith('A', 'B', 'inside')
  })

  it('drop(B) → onDrop(A, B, position) + 자기 자신 drop 무시', () => {
    const onDrop = vi.fn()
    const { result } = renderHook(() => useReorderDndGestureRaw({ onDrop }))
    act(() => result.current.getItemHandlers('A').onDragStart(dragEvent(0)))
    act(() => result.current.getItemHandlers('A').onDrop(dragEvent(0)))
    expect(onDrop).not.toHaveBeenCalled()
    act(() => result.current.getItemHandlers('B').onDrop(dragEvent(2, 20)))
    expect(onDrop).toHaveBeenCalledWith('A', 'B', 'before')
  })

  it('드래그 없이 dragover/drop → 무시', () => {
    const onDragOver = vi.fn()
    const onDrop = vi.fn()
    const { result } = renderHook(() => useReorderDndGestureRaw({ onDragOver, onDrop }))
    act(() => result.current.getItemHandlers('B').onDragOver(dragEvent(0)))
    act(() => result.current.getItemHandlers('B').onDrop(dragEvent(0)))
    expect(onDragOver).not.toHaveBeenCalled()
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('dragend 후 dragover 무시', () => {
    const onDragOver = vi.fn()
    const { result } = renderHook(() => useReorderDndGestureRaw({ onDragOver }))
    act(() => result.current.getItemHandlers('A').onDragStart(dragEvent(0)))
    act(() => result.current.getItemHandlers('A').onDragEnd(dragEvent(0)))
    act(() => result.current.getItemHandlers('B').onDragOver(dragEvent(2, 20)))
    expect(onDragOver).not.toHaveBeenCalled()
  })
})

describe('useReorderDndGesture (bound)', () => {
  it('drop → dispatch({type:"move", id, targetId, mode}) emit', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() => useReorderDndGesture(list, dispatch))
    act(() => result.current.getItemHandlers('A').onDragStart(dragEvent(0)))
    act(() => result.current.getItemHandlers('C').onDrop(dragEvent(18, 20)))
    expect(dispatch).toHaveBeenCalledWith({ type: 'move', id: 'A', targetId: 'C', mode: 'sibling-after' })
  })

  it('allowInside: 중앙 drop → mode "child"', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() => useReorderDndGesture(list, dispatch, { allowInside: true }))
    act(() => result.current.getItemHandlers('A').onDragStart(dragEvent(0)))
    act(() => result.current.getItemHandlers('C').onDrop(dragEvent(10, 20)))
    expect(dispatch).toHaveBeenCalledWith({ type: 'move', id: 'A', targetId: 'C', mode: 'child' })
  })
})

describe('positionToMoveMode', () => {
  it('before → sibling-before, after → sibling-after, inside → child', () => {
    expect(positionToMoveMode('before')).toBe('sibling-before')
    expect(positionToMoveMode('after')).toBe('sibling-after')
    expect(positionToMoveMode('inside')).toBe('child')
  })
})

import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { fromTree } from '../../view-state/fromTree'
import {
  useKeyboardDndGesture,
  useKeyboardDndGestureRaw,
} from './useKeyboardDndGesture'
import type { UiEvent } from '../../intent/events'

type Node = { id: string; children?: Node[] }
const list = fromTree<Node>([{ id: 'A' }, { id: 'B' }, { id: 'C' }])

// minimal ReactKeyboardEvent shim — we only consume `key` + `preventDefault`.
const kbd = (key: string): React.KeyboardEvent =>
  ({ key, preventDefault: () => {} } as unknown as React.KeyboardEvent)

describe('useKeyboardDndGestureRaw (#168)', () => {
  it('idle: Space on item lifts → state=lifted, aria-grabbed=true, announce', () => {
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], announce }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    expect(result.current.state).toBe('lifted')
    expect(result.current.liftedId).toBe('A')
    expect(result.current.handleProps('A')['aria-grabbed']).toBe(true)
    expect(result.current.handleProps('B')['aria-grabbed']).toBe(false)
    expect(announce).toHaveBeenCalledWith('Lifted item at position 1 of 3.')
  })

  it('idle: aria-grabbed undefined on every item before lift', () => {
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B'] }),
    )
    expect(result.current.handleProps('A')['aria-grabbed']).toBeUndefined()
    expect(result.current.handleProps('B')['aria-grabbed']).toBeUndefined()
  })

  it('lifted: ArrowDown moves target, announces', () => {
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], announce }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    announce.mockClear()
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    expect(result.current.targetIndex).toBe(1)
    expect(announce).toHaveBeenCalledWith('Moved to position 2 of 3.')
  })

  it('lifted: Space drops → onCommit({from,to,...}), announces dropped, state=idle', () => {
    const onCommit = vi.fn()
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], onCommit, announce }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith({ from: 0, to: 2, fromId: 'A', toId: 'C' })
    expect(result.current.state).toBe('idle')
    expect(announce).toHaveBeenLastCalledWith('Item moved from position 1 to 3.')
  })

  it('lifted: Enter drops with commit', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], onCommit }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('Enter')))
    expect(onCommit).toHaveBeenCalledWith({ from: 0, to: 1, fromId: 'A', toId: 'B' })
  })

  it('lifted: Escape cancels — no commit, announces cancelled', () => {
    const onCommit = vi.fn()
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], onCommit, announce }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('Escape')))
    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
    expect(announce).toHaveBeenLastCalledWith('Cancelled. Returned to position 1.')
  })

  it('drop at same position → no commit (lifted → drop without move)', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], onCommit }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
  })

  it('Home / End jump to bounds', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C', 'D'], onCommit }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('End')))
    expect(result.current.targetIndex).toBe(3)
    act(() => result.current.handleProps('A').onKeyDown(kbd('Home')))
    expect(result.current.targetIndex).toBe(0)
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    // 0 === from(0) → no commit
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('clamps at boundaries (ArrowUp at idx 0 stays + no announce)', () => {
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], announce }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    announce.mockClear()
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowUp')))
    expect(result.current.targetIndex).toBe(0)
    expect(announce).not.toHaveBeenCalled()
  })

  it('horizontal axis: ArrowRight moves, ArrowDown ignored', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], axis: 'horizontal', onCommit }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    expect(result.current.targetIndex).toBe(0) // ignored
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowRight')))
    expect(result.current.targetIndex).toBe(1)
    act(() => result.current.handleProps('A').onKeyDown(kbd('Enter')))
    expect(onCommit).toHaveBeenCalledWith({ from: 0, to: 1, fromId: 'A', toId: 'B' })
  })

  it('vertical axis: ArrowLeft/Right do nothing', () => {
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], announce }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    announce.mockClear()
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowRight')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowLeft')))
    expect(announce).not.toHaveBeenCalled()
  })

  it('Space on other item while lifted → ignored', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B', 'C'], onCommit }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('B').onKeyDown(kbd(' ')))
    expect(result.current.state).toBe('lifted')
    expect(result.current.liftedId).toBe('A')
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('idle: non-Space keys ignored', () => {
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B'], announce }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('Enter')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('Escape')))
    expect(result.current.state).toBe('idle')
    expect(announce).not.toHaveBeenCalled()
  })

  it('unknown id → noop', () => {
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B'] }),
    )
    act(() => result.current.handleProps('Z').onKeyDown(kbd(' ')))
    expect(result.current.state).toBe('idle')
  })

  it('i18n messages override', () => {
    const announce = vi.fn<(m: string) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({
        items: ['A', 'B'],
        announce,
        messages: {
          lifted: (i) => `들어올림 ${i + 1}`,
          moved: (_f, t) => `이동 ${t + 1}`,
        },
      }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    expect(announce).toHaveBeenCalledWith('들어올림 1')
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    expect(announce).toHaveBeenLastCalledWith('이동 2')
  })

  it('Spacebar legacy key works for lift+drop', () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A', 'B'], onCommit }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd('Spacebar')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('Spacebar')))
    expect(onCommit).toHaveBeenCalledWith({ from: 0, to: 1, fromId: 'A', toId: 'B' })
  })

  it('tabIndex always 0', () => {
    const { result } = renderHook(() =>
      useKeyboardDndGestureRaw({ items: ['A'] }),
    )
    expect(result.current.handleProps('A').tabIndex).toBe(0)
  })
})

describe('useKeyboardDndGesture (bound)', () => {
  it('moving down → dispatch move sibling-after', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGesture(list, dispatch, { items: ['A', 'B', 'C'] }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    expect(dispatch).toHaveBeenCalledWith({
      type: 'move', id: 'A', targetId: 'B', mode: 'sibling-after',
    })
  })

  it('moving up → dispatch move sibling-before', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGesture(list, dispatch, { items: ['A', 'B', 'C'] }),
    )
    act(() => result.current.handleProps('C').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('C').onKeyDown(kbd('ArrowUp')))
    act(() => result.current.handleProps('C').onKeyDown(kbd(' ')))
    expect(dispatch).toHaveBeenCalledWith({
      type: 'move', id: 'C', targetId: 'B', mode: 'sibling-before',
    })
  })

  it('Escape: no dispatch', () => {
    const dispatch = vi.fn<(e: UiEvent) => void>()
    const { result } = renderHook(() =>
      useKeyboardDndGesture(list, dispatch, { items: ['A', 'B', 'C'] }),
    )
    act(() => result.current.handleProps('A').onKeyDown(kbd(' ')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('ArrowDown')))
    act(() => result.current.handleProps('A').onKeyDown(kbd('Escape')))
    expect(dispatch).not.toHaveBeenCalled()
  })
})

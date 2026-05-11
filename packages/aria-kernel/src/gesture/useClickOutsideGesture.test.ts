import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useClickOutsideGesture } from './useClickOutsideGesture'

describe('useClickOutsideGesture', () => {
  it('outside pointerdown → handler 호출', () => {
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    document.body.append(inside, outside)
    const handler = vi.fn()

    renderHook(() => {
      const ref = useRef(inside)
      useClickOutsideGesture(ref, handler)
    })

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)

    inside.remove()
    outside.remove()
  })

  it('inside pointerdown → handler 호출 ❌', () => {
    const inside = document.createElement('div')
    const child = document.createElement('span')
    inside.append(child)
    document.body.append(inside)
    const handler = vi.fn()

    renderHook(() => {
      const ref = useRef(inside)
      useClickOutsideGesture(ref, handler)
    })

    inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(handler).not.toHaveBeenCalled()

    inside.remove()
  })

  it('ref 배열 — 어느 ref 내부든 inside 취급', () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    const outside = document.createElement('div')
    document.body.append(a, b, outside)
    const handler = vi.fn()

    renderHook(() => {
      const ra = useRef(a)
      const rb = useRef(b)
      useClickOutsideGesture([ra, rb], handler)
    })

    a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(handler).not.toHaveBeenCalled()

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)

    a.remove(); b.remove(); outside.remove()
  })

  it('enabled: false → 리스너 부착 안 함', () => {
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    document.body.append(inside, outside)
    const handler = vi.fn()

    renderHook(() => {
      const ref = useRef(inside)
      useClickOutsideGesture(ref, handler, { enabled: false })
    })

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(handler).not.toHaveBeenCalled()

    inside.remove(); outside.remove()
  })

  it('unmount → 리스너 cleanup', () => {
    const inside = document.createElement('div')
    const outside = document.createElement('div')
    document.body.append(inside, outside)
    const handler = vi.fn()

    const { unmount } = renderHook(() => {
      const ref = useRef(inside)
      useClickOutsideGesture(ref, handler)
    })

    unmount()
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(handler).not.toHaveBeenCalled()

    inside.remove(); outside.remove()
  })
})

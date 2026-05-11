import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useContextMenuGesture } from './useContextMenuGesture'

function setup() {
  const el = document.createElement('div')
  document.body.append(el)
  return el
}

describe('useContextMenuGesture', () => {
  it('contextmenu 이벤트 → onOpen(x, y, target) 호출', () => {
    const el = setup()
    const onOpen = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture({ onOpen }))
    const props = result.current
    ;(props.onContextMenu as (e: unknown) => void)({
      preventDefault: () => {},
      clientX: 42,
      clientY: 99,
      currentTarget: el,
      target: el,
    } as unknown as Event)
    expect(onOpen).toHaveBeenCalledWith(42, 99, el)
    el.remove()
  })

  it('preventDefault 호출됨 (브라우저 기본 메뉴 차단)', () => {
    const el = setup()
    const onOpen = vi.fn()
    const preventDefault = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture({ onOpen }))
    ;(result.current.onContextMenu as (e: unknown) => void)({
      preventDefault, clientX: 0, clientY: 0, currentTarget: el, target: el,
    } as unknown as Event)
    expect(preventDefault).toHaveBeenCalled()
    el.remove()
  })

  it('Shift+F10 → onOpen 호출 (target 좌표 fallback)', () => {
    const el = setup()
    el.getBoundingClientRect = () => ({ left: 10, top: 20, right: 50, bottom: 60, x: 10, y: 20, width: 40, height: 40, toJSON: () => ({}) })
    const onOpen = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture({ onOpen }))
    const e = new KeyboardEvent('keydown', { key: 'F10', shiftKey: true })
    Object.defineProperty(e, 'currentTarget', { value: el })
    Object.defineProperty(e, 'preventDefault', { value: vi.fn() })
    ;(result.current.onKeyDown as (e: unknown) => void)(e)
    expect(onOpen).toHaveBeenCalledWith(10, 20, el)
    el.remove()
  })

  it('ContextMenu 키 → onOpen 호출', () => {
    const el = setup()
    el.getBoundingClientRect = () => ({ left: 5, top: 7, right: 0, bottom: 0, x: 5, y: 7, width: 0, height: 0, toJSON: () => ({}) })
    const onOpen = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture({ onOpen }))
    const e = new KeyboardEvent('keydown', { key: 'ContextMenu' })
    Object.defineProperty(e, 'currentTarget', { value: el })
    Object.defineProperty(e, 'preventDefault', { value: vi.fn() })
    ;(result.current.onKeyDown as (e: unknown) => void)(e)
    expect(onOpen).toHaveBeenCalledWith(5, 7, el)
    el.remove()
  })

  it('관련 없는 키 → 호출 안 됨', () => {
    const el = setup()
    const onOpen = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture({ onOpen }))
    const e = new KeyboardEvent('keydown', { key: 'F10' })  // Shift 없음
    Object.defineProperty(e, 'currentTarget', { value: el })
    Object.defineProperty(e, 'preventDefault', { value: vi.fn() })
    ;(result.current.onKeyDown as (e: unknown) => void)(e)
    expect(onOpen).not.toHaveBeenCalled()
    el.remove()
  })

  it('enabled: false → 마우스·키보드 모두 호출 안 됨', () => {
    const el = setup()
    const onOpen = vi.fn()
    const preventDefault = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture({ onOpen, enabled: false }))

    ;(result.current.onContextMenu as (e: unknown) => void)({
      preventDefault, clientX: 1, clientY: 2, currentTarget: el, target: el,
    } as unknown as Event)

    const k = new KeyboardEvent('keydown', { key: 'ContextMenu' })
    Object.defineProperty(k, 'currentTarget', { value: el })
    Object.defineProperty(k, 'preventDefault', { value: vi.fn() })
    ;(result.current.onKeyDown as (e: unknown) => void)(k)

    expect(onOpen).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
    el.remove()
  })
})

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
    expect(onOpen).toHaveBeenCalledWith(undefined, 42, 99, el)
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
    expect(onOpen).toHaveBeenCalledWith(undefined, 10, 20, el)
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
    expect(onOpen).toHaveBeenCalledWith(undefined, 5, 7, el)
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

  it('getHandlers(id) — 항목당 모드 (#156)', () => {
    const el = setup()
    const onOpen = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture<string>({ onOpen }))
    const h = result.current.getHandlers('cell-7')
    ;(h.onContextMenu as (e: unknown) => void)({
      preventDefault: () => {}, clientX: 3, clientY: 4, currentTarget: el, target: el,
    } as unknown as Event)
    expect(onOpen).toHaveBeenCalledWith('cell-7', 3, 4, el)
    el.remove()
  })

  it('getHandlers — 같은 hook 호출로 다른 id 핸들러 생성 (Rules of Hooks 안전)', () => {
    const onOpen = vi.fn()
    const { result } = renderHook(() => useContextMenuGesture<string>({ onOpen }))
    const a = result.current.getHandlers('A')
    const b = result.current.getHandlers('B')
    const el = setup()
    ;(a.onContextMenu as (e: unknown) => void)({
      preventDefault: () => {}, clientX: 0, clientY: 0, currentTarget: el, target: el,
    } as unknown as Event)
    ;(b.onContextMenu as (e: unknown) => void)({
      preventDefault: () => {}, clientX: 0, clientY: 0, currentTarget: el, target: el,
    } as unknown as Event)
    expect(onOpen).toHaveBeenNthCalledWith(1, 'A', 0, 0, el)
    expect(onOpen).toHaveBeenNthCalledWith(2, 'B', 0, 0, el)
    el.remove()
  })
})

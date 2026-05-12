import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFileDropGesture } from './useFileDropGesture'

/** ReactDragEvent shim — onDragEnter 등에 직접 주입할 최소 객체. */
function dragEvent(opts: {
  files?: File[]
  types?: string[]
}) {
  const types = opts.types ?? (opts.files ? ['Files'] : [])
  const fileArr = opts.files ?? []
  const fileList = {
    ...fileArr,
    length: fileArr.length,
    item: (i: number) => fileArr[i] ?? null,
  } as unknown as FileList
  const dt: Partial<DataTransfer> = {
    types: types as unknown as DataTransfer['types'],
    files: fileList,
    dropEffect: 'none',
  }
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: dt as DataTransfer,
  } as unknown as React.DragEvent
}

const txt = (name: string, size = 10, type = 'text/plain') => {
  const f = new File(['x'.repeat(size)], name, { type })
  return f
}

describe('useFileDropGesture', () => {
  it('drop with valid file → onFiles 호출', () => {
    const onFiles = vi.fn()
    const { result } = renderHook(() => useFileDropGesture({ onFiles }))
    const file = txt('a.txt')
    act(() => {
      result.current.rootProps.onDrop(dragEvent({ files: [file] }))
    })
    expect(onFiles).toHaveBeenCalledWith([file])
  })

  it('dragenter/leave depth counter — 자식 bubble 시 state 유지', () => {
    const { result } = renderHook(() => useFileDropGesture({ onFiles: vi.fn() }))
    expect(result.current.state).toBe('idle')
    act(() => {
      result.current.rootProps.onDragEnter(dragEvent({ types: ['Files'] }))
    })
    expect(result.current.state).toBe('over')
    // 자식 진입 (depth 2)
    act(() => {
      result.current.rootProps.onDragEnter(dragEvent({ types: ['Files'] }))
    })
    expect(result.current.state).toBe('over')
    // 자식 leave (depth 1) — 여전히 over
    act(() => {
      result.current.rootProps.onDragLeave(dragEvent({ types: ['Files'] }))
    })
    expect(result.current.state).toBe('over')
    // 부모 leave (depth 0) — idle
    act(() => {
      result.current.rootProps.onDragLeave(dragEvent({ types: ['Files'] }))
    })
    expect(result.current.state).toBe('idle')
  })

  it('accept MIME glob — image/* 통과, text/plain reject', () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    const { result } = renderHook(() =>
      useFileDropGesture({ accept: ['image/*'], onFiles, onReject }),
    )
    const png = txt('a.png', 4, 'image/png')
    const txtFile = txt('a.txt', 4, 'text/plain')
    act(() => result.current.rootProps.onDrop(dragEvent({ files: [png] })))
    expect(onFiles).toHaveBeenCalledWith([png])
    act(() => result.current.rootProps.onDrop(dragEvent({ files: [txtFile] })))
    expect(onReject).toHaveBeenCalledWith({ kind: 'type', file: txtFile, accept: ['image/*'] })
  })

  it('accept 확장자 — .pdf 통과', () => {
    const onFiles = vi.fn()
    const { result } = renderHook(() =>
      useFileDropGesture({ accept: ['.pdf'], onFiles }),
    )
    const pdf = txt('doc.pdf', 4, 'application/octet-stream')
    act(() => result.current.rootProps.onDrop(dragEvent({ files: [pdf] })))
    expect(onFiles).toHaveBeenCalledWith([pdf])
  })

  it('maxSize 초과 → reject', () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    const { result } = renderHook(() =>
      useFileDropGesture({ maxSize: 5, onFiles, onReject }),
    )
    const big = txt('big.txt', 100)
    act(() => result.current.rootProps.onDrop(dragEvent({ files: [big] })))
    expect(onFiles).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalledWith({ kind: 'size', file: big, maxSize: 5 })
  })

  it('multiple: false + 여러 파일 drop → reject', () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    const { result } = renderHook(() =>
      useFileDropGesture({ multiple: false, onFiles, onReject }),
    )
    const a = txt('a.txt'); const b = txt('b.txt')
    act(() => result.current.rootProps.onDrop(dragEvent({ files: [a, b] })))
    expect(onFiles).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalledWith({ kind: 'multiple', files: [a, b] })
  })

  it('non-file drag (text) → onDragEnter 무시', () => {
    const { result } = renderHook(() => useFileDropGesture({ onFiles: vi.fn() }))
    act(() => {
      result.current.rootProps.onDragEnter(dragEvent({ types: ['text/plain'] }))
    })
    expect(result.current.state).toBe('idle')
  })

  it('enabled: false → 모든 핸들러 무동작', () => {
    const onFiles = vi.fn()
    const { result } = renderHook(() => useFileDropGesture({ enabled: false, onFiles }))
    act(() => {
      result.current.rootProps.onDragEnter(dragEvent({ types: ['Files'] }))
      result.current.rootProps.onDrop(dragEvent({ files: [txt('a.txt')] }))
    })
    expect(result.current.state).toBe('idle')
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('openPicker → hidden input 트리거', () => {
    const { result } = renderHook(() =>
      useFileDropGesture({ accept: ['image/*', '.pdf'], multiple: false, onFiles: vi.fn() }),
    )
    const clicked = vi.fn()
    // intercept input.click
    const origClick = HTMLInputElement.prototype.click
    HTMLInputElement.prototype.click = function () { clicked(this.type, this.accept, this.multiple) }
    act(() => result.current.openPicker())
    expect(clicked).toHaveBeenCalledWith('file', 'image/*,.pdf', false)
    HTMLInputElement.prototype.click = origClick
  })

  it('reject 시 state 는 idle 로 복귀 (rejecting 경유)', () => {
    const { result } = renderHook(() =>
      useFileDropGesture({ accept: ['image/*'], onFiles: vi.fn(), onReject: vi.fn() }),
    )
    act(() => {
      result.current.rootProps.onDrop(dragEvent({ files: [txt('a.txt')] }))
    })
    // setTimeout(0) 비동기 — micro tick 후 idle
    expect(['rejecting', 'idle']).toContain(result.current.state)
  })
})

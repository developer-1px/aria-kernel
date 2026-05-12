import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent as ReactDragEvent } from 'react'

/** Reject reason — onReject 콜백에 전달되는 분류. */
export type FileDropRejectReason =
  | { kind: 'type'; file: File; accept: string[] }
  | { kind: 'size'; file: File; maxSize: number }
  | { kind: 'multiple'; files: File[] }

export interface FileDropGestureOptions {
  /**
   * MIME glob (e.g. 'image/*', 'application/pdf') 또는 확장자 ('.pdf', '.png').
   * 빈 배열/미지정이면 모든 파일 허용.
   */
  accept?: string[]
  /** 바이트 단위 최대 크기. 미지정이면 제한 없음. */
  maxSize?: number
  /** false 면 첫 파일만 통과, 여러 개 drop 시 reject. default true. */
  multiple?: boolean
  /** 유효한 파일이 1개 이상 통과했을 때. */
  onFiles?: (files: File[]) => void
  /** 검증 실패. 파일·이유 정보 포함. */
  onReject?: (reason: FileDropRejectReason) => void
  /** false 면 모든 리스너 무동작. default true. */
  enabled?: boolean
}

export type FileDropGestureState = 'idle' | 'over' | 'rejecting'

export interface FileDropGestureResult {
  rootProps: {
    onDragEnter: (e: ReactDragEvent) => void
    onDragOver: (e: ReactDragEvent) => void
    onDragLeave: (e: ReactDragEvent) => void
    onDrop: (e: ReactDragEvent) => void
  }
  state: FileDropGestureState
  /** keyboard fallback — hidden `<input type=file>` 트리거. */
  openPicker: () => void
}

/** MIME glob ('image/*') 또는 확장자 ('.pdf') 매칭. */
const matchesAccept = (file: File, accept: string[]): boolean => {
  if (accept.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  for (const raw of accept) {
    const a = raw.trim().toLowerCase()
    if (!a) continue
    if (a.startsWith('.')) {
      if (name.endsWith(a)) return true
    } else if (a.endsWith('/*')) {
      const prefix = a.slice(0, -1) // 'image/'
      if (type.startsWith(prefix)) return true
    } else if (type === a) {
      return true
    }
  }
  return false
}

/**
 * useFileDropGesture — HTML5 Drag and Drop file 입력 + keyboard picker fallback 흡수.
 *
 * dragenter/leave 의 자식 bubble 버그를 depth counter 로 해결 (well-known issue).
 * accept(MIME glob + 확장자) + maxSize + multiple 검증을 reject reason 으로 분류.
 * `openPicker()` 는 hidden `<input type=file>` 을 1회 트리거 (keyboard equivalent).
 *
 * 출처: HTML Living Standard §Drag and drop, §The input element (type=file).
 *
 * @example field-level drop
 *   const drop = useFileDropGesture({ accept: ['image/*'], maxSize: 10_000_000, onFiles, onReject })
 *   <div {...drop.rootProps} data-state={drop.state}>...</div>
 *   <button onClick={drop.openPicker}>Browse...</button>
 */
export function useFileDropGesture(opts: FileDropGestureOptions = {}): FileDropGestureResult {
  const { enabled = true } = opts

  const [state, setState] = useState<FileDropGestureState>('idle')
  const depthRef = useRef(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Latest-ref pattern — 핸들러는 안정, 옵션 변경은 즉시 반영.
  const optsRef = useRef(opts)
  optsRef.current = opts

  const validate = useCallback(
    (raw: FileList | File[] | null): File[] | null => {
      const list = raw ? Array.from(raw) : []
      if (list.length === 0) return null
      const { accept: acc = [], maxSize: ms, multiple: mu = true, onReject: rj } = optsRef.current
      if (!mu && list.length > 1) {
        rj?.({ kind: 'multiple', files: list })
        return null
      }
      const taken = mu ? list : list.slice(0, 1)
      for (const f of taken) {
        if (!matchesAccept(f, acc)) {
          rj?.({ kind: 'type', file: f, accept: acc })
          return null
        }
        if (ms != null && f.size > ms) {
          rj?.({ kind: 'size', file: f, maxSize: ms })
          return null
        }
      }
      return taken
    },
    [],
  )

  const onDragEnter = useCallback((e: ReactDragEvent) => {
    if (!enabled) return
    // dataTransfer.types 에 'Files' 가 있을 때만 file drop 으로 취급.
    const types = e.dataTransfer?.types
    const isFiles = types && Array.from(types).includes('Files')
    if (!isFiles) return
    e.preventDefault()
    depthRef.current += 1
    if (depthRef.current === 1) setState('over')
  }, [enabled])

  const onDragOver = useCallback((e: ReactDragEvent) => {
    if (!enabled) return
    const types = e.dataTransfer?.types
    const isFiles = types && Array.from(types).includes('Files')
    if (!isFiles) return
    // drop 받으려면 dragover 에서 preventDefault 필수 (HTML spec).
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  }, [enabled])

  const onDragLeave = useCallback((e: ReactDragEvent) => {
    if (!enabled) return
    if (depthRef.current === 0) return
    depthRef.current -= 1
    if (depthRef.current === 0) setState('idle')
    void e
  }, [enabled])

  const onDrop = useCallback((e: ReactDragEvent) => {
    if (!enabled) return
    e.preventDefault()
    depthRef.current = 0
    const files = validate(e.dataTransfer?.files ?? null)
    if (files) {
      setState('idle')
      optsRef.current.onFiles?.(files)
    } else {
      setState('rejecting')
      // 짧은 visual feedback 후 idle 로 복귀.
      window.setTimeout(() => setState('idle'), 0)
    }
  }, [enabled, validate])

  const openPicker = useCallback(() => {
    if (!enabled) return
    let input = inputRef.current
    if (!input) {
      input = document.createElement('input')
      input.type = 'file'
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      input.style.opacity = '0'
      input.setAttribute('aria-hidden', 'true')
      input.addEventListener('change', () => {
        const files = validate(input!.files)
        if (files) optsRef.current.onFiles?.(files)
        input!.value = '' // 같은 파일 재선택 허용
      })
      document.body.appendChild(input)
      inputRef.current = input
    }
    input.multiple = optsRef.current.multiple ?? true
    const acc = optsRef.current.accept ?? []
    input.accept = acc.join(',')
    input.click()
  }, [enabled, validate])

  useEffect(() => {
    return () => {
      const input = inputRef.current
      if (input && input.parentNode) input.parentNode.removeChild(input)
      inputRef.current = null
    }
  }, [])

  return {
    rootProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
    state,
    openPicker,
  }
}

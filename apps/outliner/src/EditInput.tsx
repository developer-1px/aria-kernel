import { useEffect, useRef } from 'react'
import { KEYS } from '@p/aria-kernel'

/**
 * EditInput — 인라인 편집 primitive (contenteditable 기반).
 * Enter=commit / Escape=cancel / blur=commit. input 대신 contenteditable 로
 * 자연스러운 줄바꿈·자동 높이 조절. commit 시 부모 treeitem 으로 focus 복원.
 */
export function EditInput({ initial, onCommit, className }: { initial: string; onCommit: (value: string, cancelled: boolean) => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(false)
  const committedRef = useRef(false)
  const commit = () => {
    if (committedRef.current) return
    committedRef.current = true
    const owner = ref.current?.closest<HTMLElement>('[role="treeitem"]') ?? null
    onCommit(ref.current?.textContent ?? '', cancelRef.current)
    owner?.focus()
  }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.textContent = initial
    const t = setTimeout(() => {
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }, 0)
    return () => clearTimeout(t)
  }, [initial])
  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.nativeEvent.isComposing || e.keyCode === 229) return
        if (e.key === KEYS.Enter) { e.preventDefault(); commit() }
        if (e.key === KEYS.Escape) { cancelRef.current = true; commit() }
      }}
      className={className}
    />
  )
}

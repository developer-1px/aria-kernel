import { useState } from 'react'
import { useDialogModalPattern } from '@interactive-os/aria-kernel/patterns'

const HAYSTACK = ['alpha', 'banana', 'cherry', 'durian', 'elder', 'fig']

export function DialogOnKeymapDemo() {
  const [open, setOpen] = useState(true)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)

  const matches = HAYSTACK.filter((s) => q && s.includes(q))
  const current = matches[matches.length ? idx % matches.length : 0]

  const next = () => setIdx((i) => (matches.length ? (i + 1) % matches.length : 0))
  const prev = () => setIdx((i) => (matches.length ? (i - 1 + matches.length) % matches.length : 0))

  const { rootProps } = useDialogModalPattern({
    open, modal: false, label: 'Find',
    onOpenChange: setOpen,
    on: { Enter: next, 'shift+Enter': prev },
  })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.5</span>
          Dialog — on keymap
        </h1>
        <p className="text-sm text-neutral-500">
          <code>on: {'{'} Enter, shift+Enter {'}'}</code> — input 안에서 직접
          <code> onKeyDown </code> 부착 없이도 dialog 가 흡수.
        </p>
      </header>

      {!open && (
        <button onClick={() => setOpen(true)} className="rounded bg-neutral-900 px-4 py-2 text-white">
          다이얼로그 다시 열기
        </button>
      )}

      {open && (
        <div {...rootProps} className="inline-block rounded border border-neutral-200 p-4 shadow">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0) }}
            placeholder="찾기 — Enter ↓ / Shift+Enter ↑"
            className="w-72 rounded border border-neutral-300 px-3 py-1.5 text-sm"
            autoFocus
          />
          <div className="mt-2 text-sm">
            <div>
              match: <strong>{current ?? '(없음)'}</strong> ({matches.length}개)
            </div>
            <ol className="mt-1 list-decimal pl-6 text-xs text-neutral-500">
              {matches.map((m, i) => (
                <li key={m} className={i === idx % Math.max(matches.length, 1) ? 'font-bold text-neutral-900' : ''}>{m}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

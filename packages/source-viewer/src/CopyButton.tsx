import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-live="polite" className="text-[10px] text-stone-500">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}
      </span>
      <button
        type="button"
        onClick={handle}
        className="rounded border border-stone-700 bg-stone-800 px-2 py-0.5 text-xs text-stone-300 hover:bg-stone-700"
      >
        Copy
      </button>
    </span>
  )
}

import { useEffect, useRef, useState } from 'react'
import { alertPattern } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Alert · Toast',
  apg: 'alert',
  kind: 'overlay' as const,
  blurb: 'Stacked live alerts — auto-dismiss after 3s or manual close.',
  keys: () => [],
}

type Toast = { id: number; message: string; type: 'auto' | 'manual' }

export default function AlertToastDemo() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id))

  const showAuto = () => {
    const id = nextId.current++
    setToasts((ts) => [...ts, { id, message: `Saved draft #${id}`, type: 'auto' }])
  }

  const showManual = () => {
    const id = nextId.current++
    setToasts((ts) => [...ts, { id, message: `Connection lost #${id} — please retry.`, type: 'manual' }])
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={showAuto}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
        >
          Show auto-dismiss
        </button>
        <button
          onClick={showManual}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
        >
          Show manual
        </button>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { rootProps } = alertPattern()

  useEffect(() => {
    if (toast.type !== 'auto') return
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [toast.type, onDismiss])

  return (
    <div
      {...rootProps}
      aria-live={toast.type === 'manual' ? 'assertive' : 'polite'}
      className="pointer-events-auto flex min-w-[16rem] items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 shadow-md"
    >
      <span className="flex-1">{toast.message}</span>
      {toast.type === 'manual' && (
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="rounded px-1 text-amber-900/70 hover:bg-amber-100 hover:text-amber-900"
        >
          ✕
        </button>
      )}
    </div>
  )
}

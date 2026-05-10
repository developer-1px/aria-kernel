import { useRef, useState } from 'react'
import { useAlertDialogPattern } from '@p/aria-kernel/patterns'

export function AlertDialogCancelDemo() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<string>('—')
  const cancelRef = useRef<HTMLButtonElement>(null)
  const { rootRef, rootProps, closeProps } = useAlertDialogPattern({
    open,
    onOpenChange: setOpen,
    label: '삭제 확인',
    cancelRef,
  })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.16</span>
          AlertDialog — cancel-first focus
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — destructive prompt 의 초기 focus 선정 implementation-defined.
          kernel = cancelRef 우선 (안전 default).
        </p>
      </header>

      <button onClick={() => setOpen(true)} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
        파일 삭제
      </button>
      <p className="mt-3 text-sm">결과: <strong>{result}</strong></p>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            ref={rootRef as React.RefObject<HTMLDivElement>}
            {...rootProps}
            aria-describedby="ad-desc"
            className="w-80 rounded bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-bold">정말 삭제하시겠습니까?</h2>
            <p id="ad-desc" className="mt-2 text-sm text-neutral-600">
              이 동작은 되돌릴 수 없습니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                ref={cancelRef}
                {...closeProps}
                onClick={() => { setResult('취소됨'); setOpen(false) }}
                className="rounded border border-neutral-300 px-4 py-1.5 text-sm hover:bg-neutral-50"
              >
                취소
              </button>
              <button
                onClick={() => { setResult('삭제됨'); setOpen(false) }}
                className="rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

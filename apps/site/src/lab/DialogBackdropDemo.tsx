import { useState } from 'react'
import { useDialogModalPattern } from '@p/aria-kernel/patterns'

export function DialogBackdropDemo() {
  const [open, setOpen] = useState(false)
  const { rootProps, backdropProps, closeProps } = useDialogModalPattern({
    open, onOpenChange: setOpen,
    modal: true, label: 'Backdrop demo',
  })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.1</span>
          Dialog backdrop + outside-close
        </h1>
        <p className="text-sm text-neutral-500">
          backdrop click 으로 닫힘 — kernel 의 <code>backdropProps</code> 가 mousedown
          타깃 검사까지 흡수. consumer 는 backdrop DOM 만 그리고 onClick 손으로 안 붙임.
        </p>
      </header>

      <button
        onClick={() => setOpen(true)}
        className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
      >
        Open dialog
      </button>

      {open && (
        <div
          {...backdropProps}
          className="fixed inset-0 z-40 bg-black/40 grid place-items-center"
        >
          <div
            {...rootProps}
            className="rounded bg-white p-6 shadow-xl outline-none min-w-[20rem]"
          >
            <h2 className="mb-2 text-lg font-semibold">제목</h2>
            <p className="mb-4 text-sm text-neutral-600">
              backdrop(어두운 영역) 클릭하거나 Escape 눌러서 닫기.
            </p>
            <button
              {...closeProps}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <details className="mt-8 text-sm">
        <summary className="cursor-pointer font-semibold">소비자 코드</summary>
        <pre className="mt-2 overflow-auto rounded bg-neutral-900 p-3 text-xs text-neutral-100">
{`const { rootProps, backdropProps, closeProps } = useDialogModalPattern({
  open, onOpenChange: setOpen, modal: true, label: 'Backdrop demo',
})

<div {...backdropProps} className="fixed inset-0 ...">
  <div {...rootProps} className="rounded bg-white ...">
    <button {...closeProps}>닫기</button>
  </div>
</div>`}
        </pre>
      </details>
    </div>
  )
}

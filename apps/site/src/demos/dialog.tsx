import { useRef } from 'react'
import { dialogModalKeys, useDialogModalPattern } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Dialog',
  apg: 'dialog-modal',
  kind: 'overlay' as const,
  blurb: 'A modal dialog that opens from a trigger and returns the user to where they started.',
  keys: () => dialogModalKeys(),
}

export default function DialogDemo() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { rootProps, closeProps, open, setOpen } = useDialogModalPattern({
    returnFocusRef: triggerRef,
    label: 'Confirm action',
  })

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
      >
        Open dialog
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div
            {...rootProps}
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
          >
            <h2 className="text-base font-semibold">Confirm action</h2>
            <p className="mt-2 text-sm text-stone-600">
              Modal with focus management and Escape close.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button {...closeProps} className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useRef, useState } from 'react'
import { useDialogPattern, dialogKeys } from '@p/aria-kernel/patterns'
import { CalendarGrid, calendarGridKeys } from './_calendarGrid'

export const meta = {
  title: 'Dialog · Date Picker',
  apg: 'dialog-modal',
  kind: 'overlay' as const,
  blurb: 'Button trigger opens a modal dialog containing a calendar grid.',
  keys: () => [...dialogKeys({ modal: true }), ...calendarGridKeys()],
}

export default function DialogDatepickerDemo() {
  const [date, setDate] = useState('')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const { rootProps, open, setOpen } = useDialogPattern({
    label: 'Choose date',
    modal: true,
    returnFocusRef: triggerRef,
  })

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
      >
        📅 Choose date — {date || 'Pick a date'}
      </button>

      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30">
          <div
            {...rootProps}
            className="w-72 rounded-md border border-stone-200 bg-white p-3 text-sm shadow-lg outline-none"
          >
            <CalendarGrid
              value={date}
              open={open}
              onCommit={(iso) => { setDate(iso); setOpen(false) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

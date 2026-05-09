import { useState } from 'react'
import { useComboboxDialogPattern } from '@p/aria-kernel/patterns'
import { CalendarGrid } from './_calendarGrid'

export const meta = {
  title: 'Combobox · Date Picker',
  apg: 'combobox',
  kind: 'collection' as const,
  blurb: 'Editable combobox that opens a dialog containing a calendar grid.',
  keys: () => ['ArrowDown', 'Alt+ArrowDown', 'Escape'],
}

export default function ComboboxDatepickerDemo() {
  const [date, setDate] = useState('')
  const { inputProps, popoverProps, triggerProps, open, setOpen } = useComboboxDialogPattern({
    label: 'Date',
  })

  return (
    <div className="relative w-72">
      <div className="flex gap-1">
        <input
          {...inputProps}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="YYYY-MM-DD"
          className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm"
        />
        <button
          {...triggerProps}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
        >📅</button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-72">
          <div
            {...popoverProps}
            className="rounded-md border border-stone-200 bg-white p-3 text-sm shadow-lg outline-none"
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

import { useState } from 'react'
import { spinbuttonAxis, spinbuttonPattern } from '@interactive-os/aria-kernel/patterns'
import { axisKeys } from '@interactive-os/aria-kernel'

export const meta = {
  title: 'Spinbutton',
  apg: 'spinbutton',
  kind: 'collection' as const,
  blurb: 'Hotel booking quantity selectors — adults, children, pets.',
  keys: () => axisKeys(spinbuttonAxis()),
}

type Field = { id: string; label: string; min: number; max: number }

const FIELDS: Field[] = [
  { id: 'adults', label: 'Adults', min: 1, max: 8 },
  { id: 'children', label: 'Children', min: 0, max: 6 },
  { id: 'pets', label: 'Pets', min: 0, max: 3 },
]

export default function SpinbuttonDemo() {
  const [values, setValues] = useState<Record<string, number>>({ adults: 2, children: 0, pets: 0 })

  return (
    <div className="flex w-72 flex-col gap-3 text-sm">
      {FIELDS.map((f) => {
        const v = values[f.id]
        const set = (n: number) => setValues((prev) => ({ ...prev, [f.id]: n }))
        const { spinbuttonProps } = spinbuttonPattern(
          v,
          (e) => set(e.value),
          { min: f.min, max: f.max, step: 1, label: f.label },
        )
        const atMin = v <= f.min
        const atMax = v >= f.max
        return (
          <div key={f.id} className="flex items-center justify-between gap-3">
            <span className="text-stone-700">{f.label}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={`Decrease ${f.label}`}
                disabled={atMin}
                onClick={() => set(v - 1)}
                className="grid h-8 w-8 place-items-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              >
                −
              </button>
              <span
                {...spinbuttonProps}
                className="grid h-8 w-10 place-items-center rounded-md border border-stone-300 bg-white tabular-nums text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              >
                {v}
              </span>
              <button
                type="button"
                aria-label={`Increase ${f.label}`}
                disabled={atMax}
                onClick={() => set(v + 1)}
                className="grid h-8 w-8 place-items-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

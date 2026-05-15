import { useState } from 'react'
import { sliderPattern } from '@interactive-os/aria-kernel/patterns'

export function SliderKeyboardDemo() {
  const [value, setValue] = useState(40)
  const { rootProps, trackProps, rangeProps, thumbProps } = sliderPattern(
    value,
    (e) => setValue(e.value),
    { min: 0, max: 100, step: 5, label: 'Volume' },
  )

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.10</span>
          Slider — keyboard step semantics
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — large step 크기 implementation-defined. kernel 의 numericStep axis 가
          Arrow=±step, PageUp/Down=±step×10, Home/End=min/max 흡수.
        </p>
      </header>

      <div {...rootProps} className="space-y-3">
        <div {...trackProps} className="relative h-2 w-full rounded bg-neutral-200">
          <div {...rangeProps} className="absolute left-0 top-0 h-full rounded bg-blue-500" />
          <div
            {...thumbProps}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-600 bg-white focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <p className="text-sm">value: <strong>{value}</strong></p>
        <p className="text-xs text-neutral-400">
          ←/→ ±5 · PageUp/PageDown ±50 · Home=0 · End=100
        </p>
      </div>
    </div>
  )
}

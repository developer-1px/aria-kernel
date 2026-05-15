import { useState } from 'react'
import { sliderAxis, sliderPattern } from '@interactive-os/aria-kernel/patterns'
import { axisKeys } from '@interactive-os/aria-kernel'

export const meta = {
  title: 'Slider · Rating',
  apg: 'slider',
  kind: 'single-value' as const,
  blurb: 'Five-step satisfaction scale with descriptive aria-valuetext.',
  keys: () => axisKeys(sliderAxis()),
}

const LABELS = ['', 'Very poor', 'Poor', 'Average', 'Good', 'Excellent']

export default function SliderRatingDemo() {
  const [value, setValue] = useState(3)
  const { rootProps, trackProps, rangeProps, thumbProps } = sliderPattern(
    value,
    (e) => setValue(e.value),
    {
      min: 1, max: 5, step: 1,
      label: 'Satisfaction',
      valueText: (v) => `${v} out of 5 — ${LABELS[v]}`,
    },
  )

  return (
    <div className="w-72">
      <div className="mb-1 flex justify-between text-xs text-stone-600">
        <span>Satisfaction</span>
        <span>{LABELS[value]}</span>
      </div>
      <div {...rootProps}>
        <div {...trackProps} className="relative h-2 rounded-full bg-stone-200">
          <span {...rangeProps} className="absolute inset-y-0 rounded-full bg-stone-900" />
          <span
            {...thumbProps}
            className="absolute -top-1.5 -translate-x-1/2 grid h-5 w-5 place-items-center rounded-full border-2 border-stone-900 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          />
        </div>
      </div>
    </div>
  )
}

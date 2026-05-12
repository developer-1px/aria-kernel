import { useState } from 'react'
import { sliderMultithumbPattern, sliderMultithumbAxis } from '@p/aria-kernel/patterns'
import { axisKeys } from '@p/aria-kernel'

export const meta = {
  title: 'Slider · Multi-Thumb',
  apg: 'slider',
  kind: 'single-value' as const,
  blurb: 'Two-thumb price range — each thumb is clamped by its neighbor.',
  keys: () => axisKeys(sliderMultithumbAxis()),
}

export default function SliderRangeDemo() {
  const [values, setValues] = useState<number[]>([20, 70])
  const { rootProps, trackProps, rangeProps, thumbProps } = sliderMultithumbPattern(
    values,
    (e) => setValues(e.value),
    {
      min: 0, max: 100, step: 1,
      labels: ['Min price', 'Max price'],
    },
  )

  return (
    <div className="w-72">
      <div {...rootProps} className="space-y-2">
        <div className="flex justify-between text-xs text-stone-600">
          <span>${values[0]}</span>
          <span>${values[1]}</span>
        </div>
        <div {...trackProps} className="relative h-2 rounded-full bg-stone-200">
          <span {...rangeProps} className="absolute inset-y-0 rounded-full bg-stone-900" />
          {values.map((_, i) => (
            <span
              key={i}
              {...thumbProps(i)}
              className="absolute -top-1.5 -translate-x-1/2 grid h-5 w-5 place-items-center rounded-full border-2 border-stone-900 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

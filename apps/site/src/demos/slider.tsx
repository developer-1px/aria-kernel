import { useState } from 'react'
import { sliderAxis, sliderPattern } from '@interactive-os/aria-kernel/patterns'
import { axisKeys } from '@interactive-os/aria-kernel'

export const meta = {
  title: 'Slider',
  apg: 'slider',
  kind: 'single-value' as const,
  blurb: 'A bounded numeric control for adjusting a value in fixed steps.',
  keys: () => axisKeys(sliderAxis()),
}

export default function SliderDemo() {
  const [value, setValue] = useState(40)
  const { rootProps, trackProps, rangeProps, thumbProps } = sliderPattern(value, (e) => setValue(e.value), {
    min: 0,
    max: 100,
    step: 5,
    label: 'Volume',
  })

  return (
    <div className="space-y-2">
      <div {...rootProps} className="relative h-6 w-64">
        <div {...trackProps} className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-stone-200" />
        <div
          {...rangeProps}
          style={{ width: `${value}%` }}
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-stone-900"
        />
        <button
          {...thumbProps}
          style={{ left: `${value}%` }}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-stone-900 bg-white shadow"
        />
      </div>
      <p className="text-xs text-stone-500">value: {value}</p>
    </div>
  )
}

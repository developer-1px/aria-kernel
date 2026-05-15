import { useState } from 'react'
import { sliderAxis, sliderPattern } from '@interactive-os/aria-kernel/patterns'
import { axisKeys } from '@interactive-os/aria-kernel'

export const meta = {
  title: 'Slider · Media Seek',
  apg: 'slider',
  kind: 'single-value' as const,
  blurb: 'Time slider where aria-valuetext announces minutes:seconds, not raw seconds.',
  keys: () => axisKeys(sliderAxis()),
}

const fmt = (s: number) =>
  `${Math.floor(s / 60)} minute${Math.floor(s / 60) === 1 ? '' : 's'} ${s % 60} second${s % 60 === 1 ? '' : 's'}`

export default function SliderSeekDemo() {
  const [value, setValue] = useState(73)
  const { rootProps, trackProps, rangeProps, thumbProps } = sliderPattern(
    value,
    (e) => setValue(e.value),
    {
      min: 0, max: 240, step: 1,
      label: 'Playback position',
      valueText: fmt,
    },
  )

  return (
    <div className="w-80">
      <div className="mb-1 flex justify-between font-mono text-xs text-stone-600">
        <span>{Math.floor(value / 60)}:{String(value % 60).padStart(2, '0')}</span>
        <span>4:00</span>
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

import { useState } from 'react'
import { sliderMultithumbPattern } from '@p/aria-kernel/patterns'

export function SliderRangeDemo() {
  const [values, setValues] = useState([20, 70])
  const { rootProps, trackProps, rangeProps, thumbProps } = sliderMultithumbPattern(
    values,
    (e) => setValues(e.value),
    { min: 0, max: 100, step: 5, labels: ['최소가격', '최대가격'] },
  )

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.24</span>
          SliderRange — neighbor clamp (multi-thumb)
        </h1>
        <p className="text-sm text-neutral-500">
          APG /slider-multithumb/ — thumb[i] ∈ [values[i-1], values[i+1]]. 인접 thumb 가
          서로의 min/max 가 되어 절대 교차 ❌.
        </p>
      </header>

      <div {...rootProps} className="py-4">
        <div {...trackProps} className="relative h-2 w-full rounded bg-neutral-200">
          <div {...rangeProps} className="absolute top-0 h-full rounded bg-blue-500" />
          {values.map((_, i) => (
            <div
              key={i}
              {...thumbProps(i)}
              style={{ left: `${((values[i]! - 0) / 100) * 100}%`, position: 'absolute', top: '50%' }}
              className="h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-600 bg-white focus:ring-2 focus:ring-blue-300"
            />
          ))}
        </div>
        <p className="mt-3 text-sm">범위: <strong>{values[0]} – {values[1]}</strong></p>
      </div>
    </div>
  )
}

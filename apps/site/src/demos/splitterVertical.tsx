import { useState } from 'react'
import { windowsplitterAxis, windowsplitterPattern } from '@p/aria-kernel/patterns'
import { axisKeys } from '@p/aria-kernel'

export const meta = {
  title: 'Splitter · Vertical',
  apg: 'windowsplitter',
  kind: 'single-value' as const,
  blurb: 'A vertically resizable split panel controlled by a single percentage value.',
  keys: () => axisKeys(windowsplitterAxis()),
}

export default function SplitterVerticalDemo() {
  const [value, setValue] = useState(40)
  const { rootProps, handleProps } = windowsplitterPattern(value, (e) => setValue(e.value), {
    orientation: 'vertical',
    min: 10,
    max: 90,
    step: 5,
  })

  return (
    <div
      {...rootProps}
      className="flex h-64 w-full flex-col overflow-hidden rounded-md border border-stone-200 bg-white text-sm"
    >
      <div style={{ flexBasis: `${value}%` }} className="bg-stone-50 p-3 text-stone-700">
        Top ({value}%)
      </div>
      <button
        {...handleProps}
        className="h-1.5 cursor-row-resize bg-stone-300 hover:bg-stone-500"
      />
      <div style={{ flexBasis: `${100 - value}%` }} className="flex-1 bg-white p-3 text-stone-700">
        Bottom ({100 - value}%)
      </div>
    </div>
  )
}

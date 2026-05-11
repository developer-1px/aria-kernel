import { useState } from 'react'
import { splitterAxis, splitterPattern } from '@p/aria-kernel/patterns'
import { axisKeys } from '@p/aria-kernel'

export const meta = {
  title: 'Splitter',
  apg: 'windowsplitter',
  kind: 'single-value' as const,
  blurb: 'A resizable split panel controlled by a single percentage value.',
  keys: () => axisKeys(splitterAxis({ orientation: 'horizontal' })),
}

export default function SplitterDemo() {
  const [value, setValue] = useState(40)
  const { rootProps, handleProps } = splitterPattern(value, (e) => setValue(e.value), {
    orientation: 'horizontal',
    min: 10,
    max: 90,
    step: 5,
  })

  return (
    <div
      {...rootProps}
      className="flex h-32 w-full overflow-hidden rounded-md border border-stone-200 bg-white text-sm"
    >
      <div style={{ flexBasis: `${value}%` }} className="bg-stone-50 p-3 text-stone-700">
        Left ({value}%)
      </div>
      <button
        {...handleProps}
        className="w-1.5 cursor-col-resize bg-stone-300 hover:bg-stone-500"
      />
      <div style={{ flexBasis: `${100 - value}%` }} className="flex-1 bg-white p-3 text-stone-700">
        Right ({100 - value}%)
      </div>
    </div>
  )
}

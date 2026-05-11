import { useReducer } from 'react'
import { axisKeys, fromList, reduceWithRadio } from '@p/aria-kernel'
import { radioGroupAxis, useRadioGroupPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Radio Group · activeDescendant',
  apg: 'radio',
  kind: 'collection' as const,
  blurb: 'DOM focus stays on the radiogroup; aria-activedescendant points to the active radio.',
  keys: () => axisKeys(radioGroupAxis()),
}

const SIZES = [{ label: 'Small' }, { label: 'Medium', checked: true }, { label: 'Large' }]

export default function RadioGroupActiveDescendantDemo() {
  const [data, dispatch] = useReducer(reduceWithRadio, SIZES, fromList)
  const { rootProps, radioProps, items } = useRadioGroupPattern(data, dispatch, {
    focusMode: 'activeDescendant',
    label: 'Size',
  })

  return (
    <div
      {...rootProps}
      className="flex flex-col gap-2 rounded-md border border-stone-200 bg-white p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
    >
      {items.map((item) => (
        <div
          key={item.id}
          {...radioProps(item.id)}
          className="flex items-center gap-2 rounded px-1 py-0.5 text-sm data-[active]:bg-stone-100"
        >
          <span aria-hidden className="h-4 w-4 rounded-full border-2 border-stone-400 grid place-items-center">
            {item.selected && <span className="h-2 w-2 rounded-full bg-stone-900" />}
          </span>
          {item.label}
        </div>
      ))}
    </div>
  )
}

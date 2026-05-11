import { useReducer } from 'react'
import { axisKeys, fromList, reduceWithMultiSelect } from '@p/aria-kernel'
import { listboxAxis, useListbox } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Listbox · Multi',
  apg: 'listbox',
  kind: 'collection' as const,
  blurb: 'A selectable list that can keep multiple options active at the same time.',
  keys: () => axisKeys(listboxAxis({ multiSelectable: true })),
}

const FRUITS = [
  { label: 'Apple' },
  { label: 'Banana' },
  { label: 'Cherry' },
  { label: 'Durian' },
  { label: 'Elderberry' },
]

export default function ListboxMultiDemo() {
  const [data, dispatch] = useReducer(reduceWithMultiSelect, FRUITS, fromList)
  const { rootProps, optionProps, items } = useListbox(data, dispatch, {
    multiSelectable: true,
  })

  return (
    <ul
      {...rootProps}
      aria-label="Fruits (multi-select)"
      className="w-56 rounded-md border border-stone-200 bg-white p-1 text-sm"
    >
      {items.map((item) => (
        <li
          key={item.id}
          {...optionProps(item.id)}
          className="cursor-pointer rounded px-2 py-1 [&:not([aria-selected=true])]:hover:bg-stone-200 aria-selected:bg-stone-900 aria-selected:text-white"
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}

import { useReducer } from 'react'
import { axisKeys, fromList, reduceWithDefaults } from '@p/aria-kernel'
import { listboxAxis, useListboxPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Listbox',
  apg: 'listbox',
  kind: 'collection' as const,
  blurb: 'A selectable list where one option represents the current value.',
  keys: () => axisKeys(listboxAxis()),
}

const FRUITS = [{ label: 'Apple' }, { label: 'Banana' }, { label: 'Cherry' }, { label: 'Durian' }]

export default function ListboxDemo() {
  const [data, dispatch] = useReducer(reduceWithDefaults, FRUITS, fromList)
  const { rootProps, optionProps, items } = useListboxPattern(data, dispatch)

  return (
    <ul
      {...rootProps}
      aria-label="Fruits"
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

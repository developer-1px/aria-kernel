import { useReducer } from 'react'
import { axisKeys, fromTree, reduceWithDefaults } from '@p/aria-kernel'
import { listboxAxis, useListbox } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Listbox · Grouped',
  apg: 'listbox',
  kind: 'collection' as const,
  blurb: 'Single-select listbox with grouped options — analogous to <select> with <optgroup>.',
  keys: () => axisKeys(listboxAxis()),
}

interface Node { id: string; label: string; children?: Node[] }

const TREE: Node[] = [
  { id: 'g-fruits', label: 'Fruits', children: [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' },
  ]},
  { id: 'g-veggies', label: 'Vegetables', children: [
    { id: 'carrot', label: 'Carrot' },
    { id: 'broccoli', label: 'Broccoli' },
  ]},
  { id: 'g-grains', label: 'Grains', children: [
    { id: 'rice', label: 'Rice' },
    { id: 'wheat', label: 'Wheat' },
  ]},
]

const IDP = 'lb'

export default function ListboxGroupedDemo() {
  const [data, dispatch] = useReducer(reduceWithDefaults, TREE, fromTree)
  const { rootProps, optionProps, groupProps, groups } = useListbox(data, dispatch, {
    label: 'Foods',
    groups: true,
    idPrefix: IDP,
  })

  return (
    <ul
      {...rootProps}
      className="w-56 rounded-md border border-stone-200 bg-white p-1 text-sm"
    >
      {groups.map((group) => (
        <li key={group.id} {...groupProps(group.id)} className="mb-1 last:mb-0">
          <span
            id={`${IDP}-glbl-${group.id}`}
            className="block px-2 py-1 text-xs font-medium uppercase tracking-wide text-stone-500"
          >
            {group.label}
          </span>
          <ul className="m-0 list-none p-0">
            {group.options.map((option) => (
              <li
                key={option.id}
                {...optionProps(option.id)}
                className="cursor-pointer rounded px-2 py-1 [&:not([aria-selected=true])]:hover:bg-stone-200 aria-selected:bg-stone-900 aria-selected:text-white"
              >
                {option.label}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

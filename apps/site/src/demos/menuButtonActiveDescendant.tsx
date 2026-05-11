import { useReducer } from 'react'
import { fromList, reduceWithDefaults } from '@p/aria-kernel'
import { useMenuButtonPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Menu Button · activeDescendant',
  apg: 'menu-button',
  kind: 'collection' as const,
  blurb: 'DOM focus stays on the trigger; aria-activedescendant marks the active menuitem.',
  keys: () => ['ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Home', 'End', 'Escape'],
}

const ITEMS = [
  { id: 'new', label: 'New' },
  { id: 'open', label: 'Open' },
  { id: 'save', label: 'Save' },
  { id: 'export', label: 'Export' },
]

export default function MenuButtonActiveDescendantDemo() {
  const [data, dispatch] = useReducer(reduceWithDefaults, ITEMS, fromList)
  const { triggerProps, menuProps, itemProps, items, open } = useMenuButtonPattern(data, dispatch, {
    focusMode: 'activeDescendant',
  })

  return (
    <div className="relative">
      <button
        {...triggerProps}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
      >
        File ▾
      </button>
      {open && (
        <ul
          {...menuProps}
          className="absolute left-0 top-full z-10 mt-1 w-40 rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
        >
          {items.map((item) => (
            <li
              key={item.id}
              {...itemProps(item.id)}
              className="cursor-pointer rounded px-2 py-1 data-[active]:bg-stone-900 data-[active]:text-white"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

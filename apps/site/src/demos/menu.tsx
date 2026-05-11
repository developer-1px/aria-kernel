import { useReducer } from 'react'
import { axisKeys, fromList, reduceSingleSelect } from '@p/aria-kernel'
import { menuAxis, useMenuPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Menu',
  apg: 'menu',
  kind: 'collection' as const,
  blurb: 'A command menu for choosing actions from a focused list.',
  keys: () => axisKeys(menuAxis({ hasSubmenu: false })),
}

const ITEMS = [{ label: 'New file' }, { label: 'Open…' }, { label: 'Save' }, { label: 'Close' }]

export default function MenuDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, ITEMS, fromList)
  const { rootProps, menuitemProps, buttonProps, items, open } = useMenuPattern(data, dispatch)

  return (
    <div className="relative inline-block">
      <button
        {...buttonProps}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
      >
        File ▾
      </button>
      {open && (
        <ul
          {...rootProps}
          className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-stone-200 bg-white p-1 shadow-lg text-sm"
        >
          {items.map((item) => (
            <li
              key={item.id}
              {...menuitemProps(item.id)}
              className="cursor-pointer rounded px-2 py-1 hover:bg-stone-200 aria-disabled:opacity-50"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

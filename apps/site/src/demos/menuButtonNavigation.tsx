import { useReducer } from 'react'
import { fromList, reduceSingleSelect } from '@p/aria-kernel'
import { useMenuButtonPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Menu Button · Navigation',
  apg: 'menu-button',
  kind: 'collection' as const,
  blurb: 'Menu items rendered as <a> links — variant="navigation".',
  keys: () => ['ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Home', 'End', 'Escape'],
}

const LINKS = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'docs', label: 'Documentation', href: '#docs' },
  { id: 'blog', label: 'Blog', href: '#blog' },
  { id: 'about', label: 'About', href: '#about' },
]

export default function MenuButtonNavigationDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, LINKS, fromList)
  const { triggerProps, menuProps, itemProps, items, open } = useMenuButtonPattern(data, dispatch, {
    label: 'Navigation menu',
  })

  return (
    <div className="relative">
      <button
        {...triggerProps}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
      >
        Navigate ▾
      </button>
      {open && (
        <ul
          {...menuProps}
          className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
        >
          {items.map((item) => {
            const ent = data.entities[item.id] ?? {}
            return (
              <li key={item.id}>
                <a
                  href={ent.href as string}
                  {...itemProps(item.id)}
                  className="block cursor-pointer rounded px-2 py-1 hover:bg-stone-200 focus:bg-stone-900 focus:text-white focus:outline-none"
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

import { useReducer } from 'react'
import { axisKeys, fromTree, reduceSingleSelect } from '@p/aria-kernel'
import { menuButtonAxis, useMenuButtonPattern, type MenuLevel } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Menu Button',
  apg: 'menu-button',
  kind: 'collection' as const,
  blurb: 'Trigger button → menu with N-level nested submenus, menuitemcheckbox / menuitemradio (APG full).',
  keys: () => axisKeys(menuButtonAxis()),
}

const TREE = [
  { id: 'cut', label: 'Cut' },
  { id: 'copy', label: 'Copy' },
  { id: 'paste', label: 'Paste' },
  {
    id: 'recent',
    label: 'Recent',
    children: [
      { id: 'doc1', label: 'doc1.txt' },
      { id: 'doc2', label: 'doc2.txt' },
      {
        id: 'archive',
        label: 'Archive',
        children: [
          { id: 'a1', label: 'old1.txt' },
          { id: 'a2', label: 'old2.txt' },
        ],
      },
    ],
  },
  { id: 'wrap', label: 'Word Wrap', kind: 'menuitemcheckbox', checked: false },
  { id: 'spell', label: 'Spell Check', kind: 'menuitemcheckbox', checked: true },
  { id: 'theme-light', label: 'Light theme', kind: 'menuitemradio', checked: true },
  { id: 'theme-dark', label: 'Dark theme', kind: 'menuitemradio', checked: false },
]

function MenuLevelView({
  level,
  getSubmenu,
}: {
  level: MenuLevel
  getSubmenu: (id: string) => MenuLevel | null
}) {
  return (
    <ul
      {...level.menuProps}
      className="absolute left-full top-0 z-10 ml-1 w-44 rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
    >
      {level.items.map((item) => {
        const sub = item.submenuOpen ? getSubmenu(item.id) : null
        return (
          <li
            key={item.id}
            {...level.itemProps(item.id)}
            className="relative cursor-pointer rounded px-2 py-1 hover:bg-stone-200 data-[active]:bg-stone-100 focus:bg-stone-900 focus:text-white focus:outline-none aria-disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              {item.kind !== 'menuitem' && (
                <span aria-hidden className="inline-block w-3 text-stone-500">
                  {item.checked === true ? '✓' : item.checked === 'mixed' ? '–' : ''}
                </span>
              )}
              <span className="flex-1">{item.label}</span>
              {item.hasSubmenu && <span aria-hidden className="text-stone-400">▸</span>}
            </span>
            {sub && <MenuLevelView level={sub} getSubmenu={getSubmenu} />}
          </li>
        )
      })}
    </ul>
  )
}

export default function MenuButtonDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, TREE, fromTree)
  const { triggerProps, rootLevel, getSubmenu, open } = useMenuButtonPattern(data, dispatch)

  return (
    <div className="relative inline-block">
      <button
        {...triggerProps}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-50"
      >
        Actions ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1">
          <div className="relative w-44">
            <ul
              {...rootLevel.menuProps}
              className="rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
            >
              {rootLevel.items.map((item) => {
                const sub = item.submenuOpen ? getSubmenu(item.id) : null
                return (
                  <li
                    key={item.id}
                    {...rootLevel.itemProps(item.id)}
                    className="relative cursor-pointer rounded px-2 py-1 hover:bg-stone-200 data-[active]:bg-stone-100 focus:bg-stone-900 focus:text-white focus:outline-none aria-disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      {item.kind !== 'menuitem' && (
                        <span aria-hidden className="inline-block w-3 text-stone-500">
                          {item.checked === true ? '✓' : item.checked === 'mixed' ? '–' : ''}
                        </span>
                      )}
                      <span className="flex-1">{item.label}</span>
                      {item.hasSubmenu && <span aria-hidden className="text-stone-400">▸</span>}
                    </span>
                    {sub && <MenuLevelView level={sub} getSubmenu={getSubmenu} />}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

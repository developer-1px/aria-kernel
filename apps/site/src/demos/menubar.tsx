import { useReducer } from 'react'
import { axisKeys, fromTree, reduceSingleSelect } from '@p/aria-kernel'
import { menubarAxis, useMenubarPattern, type MenuLevel } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Menubar',
  apg: 'menubar',
  kind: 'collection' as const,
  blurb: 'Application menu row — N-level nested submenus, APG menubar full spec.',
  keys: () => axisKeys(menubarAxis()),
}

const TREE = [
  {
    id: 'file',
    label: 'File',
    children: [
      { id: 'new', label: 'New' },
      { id: 'open', label: 'Open…' },
      { id: 'save', label: 'Save' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    children: [
      { id: 'undo', label: 'Undo' },
      { id: 'redo', label: 'Redo' },
      {
        id: 'find',
        label: 'Find',
        children: [
          {
            id: 'find-in-file',
            label: 'In file',
            children: [
              { id: 'find-current', label: 'Current selection' },
              { id: 'find-all', label: 'All matches' },
            ],
          },
          { id: 'find-in-project', label: 'In project' },
        ],
      },
    ],
  },
  {
    id: 'view',
    label: 'View',
    children: [
      { id: 'zoom-in', label: 'Zoom in' },
      { id: 'zoom-out', label: 'Zoom out' },
    ],
  },
  { id: 'help', label: 'Help' },
]

function SubmenuView({
  level,
  getSubmenu,
}: {
  level: MenuLevel
  getSubmenu: (id: string) => MenuLevel | null
}) {
  return (
    <ul
      {...level.menuProps}
      className="absolute left-full top-0 z-10 ml-1 min-w-[10rem] rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
    >
      {level.items.map((item) => {
        const sub = item.submenuOpen ? getSubmenu(item.id) : null
        return (
          <li
            key={item.id}
            {...level.itemProps(item.id)}
            className="relative flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-stone-200 focus:bg-stone-900 focus:text-white focus:outline-none"
          >
            <span className="flex-1">{item.label}</span>
            {item.hasSubmenu && <span aria-hidden>▸</span>}
            {sub && <SubmenuView level={sub} getSubmenu={getSubmenu} />}
          </li>
        )
      })}
    </ul>
  )
}

export default function MenubarDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, TREE, fromTree)
  const { rootProps, menubarItemProps, topItems, getSubmenu } = useMenubarPattern(data, dispatch, {
    label: 'Application',
  })

  return (
    <div className="relative inline-block">
      <div {...rootProps} className="inline-flex rounded-md border border-stone-200 bg-white text-sm">
        {topItems.map((item) => (
          <button
            key={item.id}
            {...menubarItemProps(item.id)}
            className="px-3 py-1.5 [&:not([aria-expanded=true])]:hover:bg-stone-200 aria-expanded:bg-stone-900 aria-expanded:text-white first:rounded-l-md last:rounded-r-md"
          >
            {item.label}
          </button>
        ))}
      </div>
      {topItems.map((top) => {
        const sub = top.submenuOpen ? getSubmenu(top.id) : null
        if (!sub) return null
        return (
          <ul
            key={top.id}
            {...sub.menuProps}
            className="absolute left-0 top-full z-10 mt-1 min-w-[10rem] rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
          >
            {sub.items.map((item) => {
              const grand = item.submenuOpen ? getSubmenu(item.id) : null
              return (
                <li
                  key={item.id}
                  {...sub.itemProps(item.id)}
                  className="relative flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-stone-200 focus:bg-stone-900 focus:text-white focus:outline-none"
                >
                  <span className="flex-1">{item.label}</span>
                  {item.hasSubmenu && <span aria-hidden>▸</span>}
                  {grand && <SubmenuView level={grand} getSubmenu={getSubmenu} />}
                </li>
              )
            })}
          </ul>
        )
      })}
    </div>
  )
}

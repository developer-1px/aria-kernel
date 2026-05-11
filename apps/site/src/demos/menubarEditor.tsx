import { useReducer } from 'react'
import { axisKeys, fromTree, reduceSingleSelect } from '@p/aria-kernel'
import { menubarAxis, useMenubarPattern, type MenuLevel } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Menubar · Editor',
  apg: 'menubar',
  kind: 'collection' as const,
  blurb: 'Format menu with menuitemcheckbox + menuitemradio (single-group exclusivity).',
  keys: () => axisKeys(menubarAxis()),
}

const TREE = [
  { id: 'format', label: 'Format', children: [
    { id: 'bold', label: 'Bold', kind: 'menuitemcheckbox', checked: true },
    { id: 'italic', label: 'Italic', kind: 'menuitemcheckbox', checked: false },
    { id: 'underline', label: 'Underline', kind: 'menuitemcheckbox', checked: false },
    { id: 'align-left', label: 'Align left', kind: 'menuitemradio', checked: true },
    { id: 'align-center', label: 'Align center', kind: 'menuitemradio', checked: false },
    { id: 'align-right', label: 'Align right', kind: 'menuitemradio', checked: false },
  ] },
  { id: 'view', label: 'View', children: [
    { id: 'gridlines', label: 'Gridlines', kind: 'menuitemcheckbox', checked: false },
    { id: 'rulers', label: 'Rulers', kind: 'menuitemcheckbox', checked: true },
    { id: 'zoom', label: 'Zoom', children: [
      { id: 'zoom-in', label: 'Zoom in' },
      { id: 'zoom-out', label: 'Zoom out' },
    ] },
  ] },
]

function MenuLevelView({ level, getSubmenu }: { level: MenuLevel; getSubmenu: (id: string) => MenuLevel | null }) {
  return (
    <ul
      {...level.menuProps}
      className="absolute left-0 top-full z-10 mt-1 min-w-[12rem] rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
    >
      {level.items.map((item) => {
        const sub = item.submenuOpen ? getSubmenu(item.id) : null
        const mark =
          item.kind === 'menuitemradio' ? (item.checked ? '●' : '○')
            : item.kind === 'menuitemcheckbox' ? (item.checked ? '✓' : '')
            : ''
        return (
          <li
            key={item.id}
            {...level.itemProps(item.id)}
            className="relative flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-stone-200 focus:bg-stone-900 focus:text-white focus:outline-none"
          >
            <span aria-hidden className="w-3 text-stone-500">{mark}</span>
            <span className="flex-1">{item.label}</span>
            {item.hasSubmenu && <span aria-hidden>▸</span>}
            {sub && <MenuLevelView level={sub} getSubmenu={getSubmenu} />}
          </li>
        )
      })}
    </ul>
  )
}

export default function MenubarEditorDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, TREE as Parameters<typeof fromTree>[0], fromTree)
  const { rootProps, menubarItemProps, topItems, getSubmenu } = useMenubarPattern(data, dispatch, {
    label: 'Editor',
  })

  return (
    <div className="relative">
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
        return sub ? <MenuLevelView key={top.id} level={sub} getSubmenu={getSubmenu} /> : null
      })}
    </div>
  )
}

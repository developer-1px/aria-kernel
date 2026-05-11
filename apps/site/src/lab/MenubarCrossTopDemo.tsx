import { useReducer } from 'react'
import { fromTree, reduceSingleSelect, type UiEvent } from '@p/aria-kernel'
import { useMenubarPattern } from '@p/aria-kernel/patterns'

interface Node { id: string; label: string; children?: Node[] }

const MENU: Node[] = [
  { id: 'file', label: 'File', children: [
    { id: 'new', label: 'New' },
    { id: 'open', label: 'Open' },
  ]},
  { id: 'edit', label: 'Edit', children: [
    { id: 'cut', label: 'Cut' },
    { id: 'copy', label: 'Copy' },
  ]},
  { id: 'view', label: 'View', children: [
    { id: 'zoom', label: 'Zoom In' },
  ]},
]

export function MenubarCrossTopDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, MENU, fromTree)
  const { rootProps, menubarItemProps, topItems, getSubmenu, openPath } =
    useMenubarPattern(data, (e: UiEvent) => dispatch(e), { label: 'Main', autoFocus: true })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.22</span>
          Menubar — Right/Left cross-top + Down submenu
        </h1>
        <p className="text-sm text-neutral-500">
          APG /menubar/ — Right/Left = top 사이 이동, Down = submenu open + first child.
          submenu 안 Left = close 후 인접 top 으로 wrap.
        </p>
      </header>

      <ul {...rootProps} className="flex gap-1 rounded border border-neutral-200 bg-white p-1">
        {topItems.map((it) => {
          const sub = getSubmenu(it.id)
          return (
            <li key={it.id} className="relative">
              <button {...menubarItemProps(it.id)} className="rounded px-3 py-1 text-sm hover:bg-neutral-100 data-[active]:bg-neutral-100">
                {it.label}
              </button>
              {sub && openPath[0] === it.id && (
                <ul {...sub.menuProps} className="absolute left-0 top-full mt-1 min-w-[8rem] rounded border border-neutral-200 bg-white p-1 shadow-lg">
                  {sub.items.map((s) => (
                    <li key={s.id} {...sub.itemProps(s.id)} className="rounded px-3 py-1 text-sm hover:bg-neutral-100 data-[active]:bg-neutral-100">
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-neutral-400">←/→ top 이동 · ↓ submenu 열기 · Escape close</p>
    </div>
  )
}

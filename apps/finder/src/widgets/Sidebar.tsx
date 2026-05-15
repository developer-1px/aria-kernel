import { useId } from 'react'
import { useListboxPattern } from '@interactive-os/aria-kernel/patterns'
import { useSidebarNav } from './useSidebarNav'

export function Sidebar() {
  const { data, onEvent, groups } = useSidebarNav()
  const { rootProps, optionProps } = useListboxPattern(data, onEvent, {
    selectionFollowsFocus: false,
    label: '사이드바',
  })
  const headerId = useId()

  return (
    <ul {...rootProps} className="m-0 flex list-none flex-col overflow-y-auto p-3">
      {groups.map((g) => {
        const labelId = `${headerId}-${g.key}`
        return (
          <li key={g.key} role="presentation">
            <span
              id={labelId}
              className="block px-2 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              {g.label}
            </span>
            <ul role="group" aria-labelledby={labelId} className="m-0 flex list-none flex-col p-0">
              {g.items.map((view) => (
                <li
                  key={view.id}
                  {...optionProps(view.id)}
                  className={
                    'cursor-pointer rounded px-2 py-1 text-sm ' +
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ' +
                    (view.selected
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100')
                  }
                >
                  {view.label}
                </li>
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

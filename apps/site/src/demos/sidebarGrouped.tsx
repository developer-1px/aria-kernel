import { Fragment, type KeyboardEvent } from 'react'
import { axisKeys } from '@interactive-os/aria-kernel'
import { listboxAxis, useListboxPattern, useListboxReducer } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Sidebar (custom)',
  apg: 'listbox',
  kind: 'custom' as const,
  blurb:
    'A grouped sidebar for mailbox-style navigation, with quick jumps for frequent destinations.',
  // listbox pattern axis + demo 가 직접 추가하는 Cmd+1…9 (custom kind 의 정직한 표기).
  keys: () => [...axisKeys(listboxAxis()), 'Cmd+1…9'],
}

const ITEMS = [
  { id: 'inbox', label: 'Inbox', group: 'Recently' },
  { id: 'starred', label: 'Starred', group: 'Recently' },
  { id: 'sent', label: 'Sent', group: 'Recently' },
  { id: 'work', label: 'Work', group: 'Folders' },
  { id: 'personal', label: 'Personal', group: 'Folders' },
  { id: 'urgent', label: 'Urgent', group: 'Tags' },
  { id: 'todo', label: 'TODO', group: 'Tags' },
]

const GROUPS = Array.from(new Set(ITEMS.map((i) => i.group)))

export default function SidebarGroupedDemo() {
  const [data, dispatch] = useListboxReducer(ITEMS)
  const { rootProps, optionProps, items } = useListboxPattern(data, dispatch)

  // Cmd/Ctrl + 1..9 → activate items[N-1]. 다른 키는 roving delegate 로 통과.
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1
      const target = items[idx]
      if (target) {
        e.preventDefault()
        dispatch({ type: 'activate', id: target.id })
        return
      }
    }
    ;(rootProps as { onKeyDown?: (e: KeyboardEvent) => void }).onKeyDown?.(e)
  }

  return (
    <ul
      {...rootProps}
      aria-label="Mailboxes"
      onKeyDown={onKeyDown}
      className="w-64 rounded-md border border-stone-200 bg-white p-1 text-sm"
    >
      {GROUPS.map((g) => {
        // fromList preserves order — items[N] ↔ ITEMS[N]. group은 ITEMS index 로 조회.
        const groupItems = items
          .map((it, i) => ({ it, i, group: ITEMS[i].group }))
          .filter((x) => x.group === g)
        if (!groupItems.length) return null
        return (
          <Fragment key={g}>
            <li
              role="presentation"
              className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400"
            >
              {g}
            </li>
            {groupItems.map(({ it, i }) => (
              <li
                key={it.id}
                {...optionProps(it.id)}
                className="flex cursor-pointer items-center justify-between rounded px-2 py-1 [&:not([aria-selected=true])]:hover:bg-stone-200 aria-selected:bg-stone-900 aria-selected:text-white"
              >
                <span>{it.label}</span>
                {i < 9 && (
                  <kbd className="rounded border border-stone-300 bg-stone-50 px-1 text-[10px] font-mono text-stone-500">
                    ⌘{i + 1}
                  </kbd>
                )}
              </li>
            ))}
          </Fragment>
        )
      })}
    </ul>
  )
}

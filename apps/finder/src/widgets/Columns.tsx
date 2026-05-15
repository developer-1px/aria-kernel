import {
  ROOT,
  getChildren,
  getLabel,
  isDisabled,
  getExpanded,
  useRovingTabIndex,
  composeAxes,
  navigate,
  expand,
  activate,
  typeahead,
  type NormalizedData,
  type UiEvent,
} from '@interactive-os/aria-kernel'

const axis = composeAxes(navigate('vertical'), expand, activate, typeahead)

/** chainFrom — 루트→리프 column 경로. expanded set을 따라 한 칸씩 펼침. */
const chainFrom = (d: NormalizedData, exp: Set<string>, cur: string = ROOT): string[] => {
  const open = getChildren(d, cur).find((k) => exp.has(k) && getChildren(d, k).length > 0)
  return open ? [cur, ...chainFrom(d, exp, open)] : [cur]
}

/** Finder columns view — presentational. data·onEvent 를 부모에서 받아 Miller column 으로 렌더. */
export function Columns({ data, onEvent }: { data: NormalizedData; onEvent: (e: UiEvent) => void }) {
  const expanded = getExpanded(data)
  const { focusId, bindFocus, delegate } = useRovingTabIndex(axis, data, onEvent)

  return (
    <section
      aria-label="컬럼"
      {...delegate}
      className="flex h-full flex-row overflow-x-auto"
    >
      {chainFrom(data, expanded).map((parent) => {
        const kids = getChildren(data, parent)
        const label = parent === ROOT ? 'root' : getLabel(data, parent)
        return (
          <nav
            key={parent}
            aria-label={label}
            className="w-56 flex-none overflow-y-auto border-r border-neutral-200 bg-white"
          >
            <ul role="listbox" className="m-0 list-none p-1">
              {kids.map((id, i) => {
                const hasKids = getChildren(data, id).length > 0
                const isOpen = expanded.has(id)
                const disabled = isDisabled(data, id)
                const d = data.entities[id] ?? {}
                const selected = Boolean(d.selected)
                return (
                  <li
                    key={id}
                    role="option"
                    data-id={id}
                    ref={bindFocus(id)}
                    aria-posinset={i + 1}
                    aria-setsize={kids.length}
                    aria-selected={selected || undefined}
                    aria-haspopup={hasKids ? 'menu' : undefined}
                    aria-expanded={hasKids ? isOpen : undefined}
                    aria-disabled={disabled || undefined}
                    tabIndex={focusId === id ? 0 : -1}
                    className={
                      'flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm ' +
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ' +
                      (selected
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100')
                    }
                  >
                    <span className="truncate">{getLabel(data, id)}</span>
                    {hasKids && <span aria-hidden className="text-xs text-neutral-400">›</span>}
                  </li>
                )
              })}
            </ul>
          </nav>
        )
      })}
    </section>
  )
}

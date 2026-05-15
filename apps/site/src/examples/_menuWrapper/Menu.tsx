import { ROOT, getChildren, getExpanded, type NormalizedData, type UiEvent } from '@interactive-os/aria-kernel'
import { useMenuPattern, type PatternProps } from '@interactive-os/aria-kernel/patterns'
import { useRef, useState } from 'react'
import { defaultLabel, emptySlot, renderSlot, type Slot } from '../../catalog/slots'

export interface MenuSlots<TItem extends object = Record<string, unknown>> {
  icon?: Slot<TItem>
  label?: Slot<TItem>
  shortcut?: Slot<TItem>
}

export interface MenuProps<TItem extends object = Record<string, unknown>> extends PatternProps {
  slots?: MenuSlots<TItem>
}

/**
 * Menu wrapper — trigger + popup + nested submenus + separator.
 *
 * 데이터 트리:
 *   ROOT (label = trigger 라벨)
 *     ├─ leaf item (data.label, data.icon, data.shortcut)
 *     ├─ separator (data.kind === 'separator', data.disabled = true)
 *     ├─ parent item (children 보유 → aria-haspopup="menu", ArrowRight/Enter/Space 로 sub open)
 *     │    ├─ sub leaf
 *     │    └─ sub parent (children 보유 → 다중 nesting 가능)
 *     ⋮
 *
 * 키 입력은 모두 useMenuPattern 내부 axis 합성으로 박제 (인라인 onKeyDown 0).
 *   escape · expand(parent ArrowRight/Enter/Space) · navigate('vertical') · activate · typeahead
 *
 * EXPANDED meta set 으로 어느 parent 가 열려있는지 추적 — 재귀 MenuList 가 EXPANDED 검사.
 */
export function Menu<TItem extends object = Record<string, unknown>>({
  data,
  onEvent,
  slots = {},
  'aria-label': ariaLabel,
}: MenuProps<TItem>) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closeMenu = () => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
    // 모든 EXPANDED 정리는 host reducer 가 다음 open 시 초기화 — 여기선 close 만 책임
  }

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
      >
        {ariaLabel}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1">
          <MenuList
            data={data}
            containerId={ROOT}
            onEvent={onEvent}
            slots={slots}
            onClose={closeMenu}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

interface MenuListProps<TItem extends object> {
  data: NormalizedData
  containerId: string
  onEvent: (event: UiEvent) => void
  slots: MenuSlots<TItem>
  onClose: () => void
  autoFocus?: boolean
}

function MenuList<TItem extends object>({
  data,
  containerId,
  onEvent,
  slots,
  onClose,
  autoFocus,
}: MenuListProps<TItem>) {
  const { rootProps, menuitemProps, items } = useMenuPattern(
    data,
    (event) => {
      // gesture/intent split — activate 의 의미를 leaf/parent 별로 분해.
      // axis 는 키 ↔ UiEvent 만 박제, 의도 변환은 여기서.
      if (event.type === 'activate') {
        const kids = getChildren(data, event.id)
        if (kids.length > 0) {
          // parent 클릭 → submenu open + 첫 자식 focus (ArrowRight/Enter 와 동일 의도)
          onEvent({ type: 'expand', id: event.id, open: true })
          const first = kids.find((c) => !data.entities[c]?.disabled)
          if (first) onEvent({ type: 'navigate', id: first })
          return
        }
        // leaf 클릭 → activate emit + close popup
        onEvent(event)
        onClose()
        return
      }
      onEvent(event)
    },
    { autoFocus, containerId, onEscape: onClose },
  )
  const expanded = getExpanded(data)
  const hasSlots = Object.keys(slots).length > 0

  return (
    <ul
      {...rootProps}
      className="w-56 rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
    >
      {items.map((item) => {
        const itemData = (data.entities[item.id] ?? {}) as TItem & { kind?: string }

        if (itemData.kind === 'separator') {
          return (
            <li
              key={item.id}
              role="separator"
              aria-orientation="horizontal"
              className="my-1 border-t border-stone-200"
            />
          )
        }

        const subIds = getChildren(data, item.id)
        const hasSub = subIds.length > 0
        const isOpen = expanded.has(item.id)

        return (
          <li key={item.id} className="relative">
            <span
              {...menuitemProps(item.id)}
              className="flex cursor-pointer items-center rounded px-2 py-1 hover:bg-stone-200 aria-disabled:opacity-50 data-[has-sub]:pr-2"
            >
              {hasSlots ? (
                <span className="grid w-full grid-cols-[1.5rem_1fr_auto_0.75rem] items-center gap-2">
                  <span data-slot="icon" className="text-stone-400">
                    {renderSlot(slots.icon, emptySlot, item, itemData)}
                  </span>
                  <span data-slot="label" className="truncate">
                    {renderSlot(slots.label, defaultLabel, item, itemData)}
                  </span>
                  <span data-slot="shortcut" className="font-mono text-[10px] text-stone-400">
                    {renderSlot(slots.shortcut, emptySlot, item, itemData)}
                  </span>
                  <span aria-hidden className="text-[10px] text-stone-400">
                    {hasSub ? '▶' : ''}
                  </span>
                </span>
              ) : (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {hasSub && <span aria-hidden className="ml-2 text-[10px] text-stone-400">▶</span>}
                </>
              )}
            </span>

            {hasSub && isOpen && (
              <div className="absolute left-full top-0 ml-1">
                <MenuList
                  data={data}
                  containerId={item.id}
                  onEvent={onEvent}
                  slots={slots}
                  onClose={onClose}
                  autoFocus
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

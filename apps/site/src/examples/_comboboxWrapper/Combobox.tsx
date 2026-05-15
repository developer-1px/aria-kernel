import { useControlState, type UiEvent } from '@interactive-os/aria-kernel'
import { useComboboxPattern, type ControlProps, type PatternProps } from '@interactive-os/aria-kernel/patterns'
import { defaultLabel, renderSlot, type Slot } from '../../catalog/slots'

export interface ComboboxSlots<TItem extends object = Record<string, unknown>> {
  label?: Slot<TItem>
}

export interface ComboboxProps<TItem extends object = Record<string, unknown>>
  extends PatternProps, ControlProps<string> {
  slots?: ComboboxSlots<TItem>
  placeholder?: string
}

export function Combobox<TItem extends object = Record<string, unknown>>({
  data: rawData,
  value,
  onEvent,
  slots = {},
  'aria-label': ariaLabel,
  placeholder = 'Search…',
}: ComboboxProps<TItem>) {
  const [data, dispatch] = useControlState(rawData)

  const relay = (e: UiEvent) => {
    dispatch(e)
    onEvent(e)
  }

  const { comboboxProps, listboxProps, optionProps, items, expanded } =
    useComboboxPattern(data, relay, { label: ariaLabel, value })

  return (
    <div className="relative w-64">
      <input
        {...comboboxProps}
        placeholder={placeholder}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {expanded && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-stone-200 bg-white shadow-lg">
          {items.length === 0 ? (
            <p className="px-3 py-2 text-xs text-stone-500">No matches</p>
          ) : (
            <ul {...listboxProps} className="max-h-48 overflow-auto p-1 text-sm">
              {items.map((item) => {
                const itemData = (data.entities[item.id] ?? {}) as TItem
                return (
                  <li
                    key={item.id}
                    {...optionProps(item.id)}
                    className="cursor-pointer rounded px-2 py-1 [&:not([aria-selected=true])]:hover:bg-stone-200 [&:not([aria-selected=true])]:data-[active]:bg-stone-100 aria-selected:bg-blue-600 aria-selected:text-white"
                  >
                    {renderSlot(slots.label, defaultLabel, item, itemData)}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

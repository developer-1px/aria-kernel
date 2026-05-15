import { axisKeys } from '@interactive-os/aria-kernel'
import { comboboxAxis, useComboboxPattern, useComboboxReducer } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Combobox · Autocomplete None',
  apg: 'combobox',
  kind: 'collection' as const,
  blurb: 'No autocomplete — popup opens only on Alt+Down or typing, free input allowed.',
  keys: () => axisKeys(comboboxAxis()),
}

const COUNTRIES = ['Argentina', 'Australia', 'Brazil', 'Canada', 'Denmark', 'France', 'Germany', 'Japan']
  .map((label) => ({ label }))

export default function ComboboxAutocompleteNoneDemo() {
  const [data, dispatch] = useComboboxReducer(COUNTRIES)
  const { comboboxProps, listboxProps, optionProps, items, expanded } = useComboboxPattern(data, dispatch, {
    label: 'Country',
    autocomplete: 'none',
    filter: () => true,
  })

  return (
    <div className="relative w-64">
      <input
        {...comboboxProps}
        placeholder="Alt+Down to open…"
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm"
      />
      {expanded && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-stone-200 bg-white shadow-lg">
          <ul {...listboxProps} className="max-h-48 overflow-auto p-1 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                {...optionProps(item.id)}
                className="cursor-pointer rounded px-2 py-1 [&:not([aria-selected=true])]:hover:bg-stone-200 [&:not([aria-selected=true])]:data-[active]:bg-stone-100 aria-selected:bg-stone-900 aria-selected:text-white"
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

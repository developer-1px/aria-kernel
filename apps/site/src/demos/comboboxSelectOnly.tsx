import { axisKeys } from '@interactive-os/aria-kernel'
import { comboboxSelectAxis, useComboboxSelectPattern, useComboboxSelectReducer } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Combobox · Select-Only',
  apg: 'combobox',
  kind: 'collection' as const,
  blurb: 'Button-like combobox without text input — functionally similar to <select>.',
  keys: () => axisKeys(comboboxSelectAxis()),
}

const COUNTRIES = ['Argentina', 'Australia', 'Brazil', 'Canada', 'Denmark', 'France', 'Germany', 'Japan']
  .map((label) => ({ label }))

export default function ComboboxSelectOnlyDemo() {
  const [data, dispatch] = useComboboxSelectReducer(COUNTRIES)
  const { comboboxProps, listboxProps, optionProps, items, expanded } = useComboboxSelectPattern(data, dispatch, {
    label: 'Country',
  })

  return (
    <div className="relative w-64">
      <div
        {...comboboxProps}
        className="flex w-full cursor-pointer items-center justify-between rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
      >
        <span className={comboboxProps['data-value' as keyof typeof comboboxProps] ? '' : 'text-stone-400'}>
          {comboboxProps.children || 'Select a country…'}
        </span>
        <span aria-hidden className="text-stone-500">▾</span>
      </div>
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

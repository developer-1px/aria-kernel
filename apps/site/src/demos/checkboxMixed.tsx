import { axisKeys, toggle } from '@interactive-os/aria-kernel'
import { useCheckboxGroupPattern, useCheckboxGroupReducer } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Checkbox · Mixed (Group)',
  apg: 'checkbox',
  kind: 'collection' as const,
  blurb: 'Parent checkbox derives mixed-state from children; clicking it sets all on/off.',
  keys: () => axisKeys(toggle),
}

const ITEMS = [
  { id: 'lettuce', label: 'Lettuce', checked: true },
  { id: 'tomato', label: 'Tomato' },
  { id: 'onion', label: 'Onion' },
  { id: 'cheese', label: 'Cheese' },
]

export default function CheckboxMixedDemo() {
  const [data, dispatch] = useCheckboxGroupReducer(ITEMS)
  const { groupProps, parentProps, childProps, parentChecked, items } =
    useCheckboxGroupPattern(data, dispatch, {
      label: 'Sandwich toppings',
      parentLabel: 'All toppings',
    })

  return (
    <fieldset {...groupProps} className="rounded-md border border-stone-200 p-3 text-sm">
      <legend className="px-1 text-xs font-medium text-stone-500">Sandwich toppings</legend>
      <label className="mb-2 flex items-center gap-2 font-medium">
        <button
          {...parentProps}
          className="grid h-5 w-5 place-items-center rounded border border-stone-300 bg-white aria-checked:border-stone-900 aria-checked:bg-stone-900 aria-checked:text-white"
        >
          {parentChecked === true ? '✓' : parentChecked === 'mixed' ? '–' : ''}
        </button>
        <span>All toppings</span>
      </label>
      <div className="ml-7 flex flex-col gap-1">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2">
            <button
              {...childProps(item.id)}
              className="grid h-5 w-5 place-items-center rounded border border-stone-300 bg-white aria-checked:border-stone-900 aria-checked:bg-stone-900 aria-checked:text-white"
            >
              {item.selected ? '✓' : ''}
            </button>
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

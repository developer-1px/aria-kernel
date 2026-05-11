import { useReducer } from 'react'
import { axisKeys, fromList, reduceSingleSelect } from '@p/aria-kernel'
import { accordionAxis, useAccordionPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Accordion',
  apg: 'accordion',
  kind: 'collection' as const,
  blurb: 'A stack of expandable sections that can open independently.',
  keys: () => axisKeys(accordionAxis()),
}

const ITEMS = [
  { id: 'a', label: 'What is @p/aria-kernel?' },
  { id: 'b', label: 'Why ARIA-first?' },
  { id: 'c', label: 'Bring my own styles?' },
]

export default function AccordionDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, ITEMS, fromList)
  const { rootProps, headingProps, buttonProps, regionProps, items } =
    useAccordionPattern(data, dispatch)

  return (
    <div {...rootProps} className="divide-y divide-stone-200 rounded-md border border-stone-200 bg-white">
      {items.map((item) => (
        <div key={item.id}>
          <h3 {...headingProps(item.id)} className="m-0">
            <button
              {...buttonProps(item.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-stone-50"
            >
              {item.label}
              <span className="text-stone-400">{item.expanded ? '−' : '+'}</span>
            </button>
          </h3>
          <div {...regionProps(item.id)} className="px-3 py-2 text-sm text-stone-600 bg-stone-50">
            Body for <strong>{item.label}</strong>.
          </div>
        </div>
      ))}
    </div>
  )
}

import { useReducer } from 'react'
import { axisKeys, fromList, reduceWithDefaults } from '@p/aria-kernel'
import { accordionAxis, useAccordionPattern } from '@p/aria-kernel/patterns'

const ITEMS = [
  { id: 'a', label: 'What is @p/aria-kernel?' },
  { id: 'b', label: 'Why ARIA-first?' },
  { id: 'c', label: 'Bring my own styles?' },
]

export const meta = {
  title: 'Accordion · Single',
  apg: 'accordion',
  kind: 'collection' as const,
  blurb: 'An accordion where opening one section closes the others.',
  keys: () => axisKeys(accordionAxis()),
}

export default function AccordionSingleDemo() {
  const [data, dispatch] = useReducer(reduceWithDefaults, ITEMS, fromList)
  const { rootProps, headingProps, buttonProps, regionProps, items } =
    useAccordionPattern(data, dispatch, { mode: 'single' })

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

import { useAccordionPattern, type BaseItem, type PatternProps } from '@interactive-os/aria-kernel/patterns'
import { defaultLabel, emptySlot, renderSlot, type Slot } from '../../catalog/slots'

type AccordionItem = BaseItem & { expanded: boolean }

export interface AccordionSlots<TItem extends object = Record<string, unknown>> {
  label?: Slot<TItem, AccordionItem>
  panel?: Slot<TItem, AccordionItem>
}

export interface AccordionProps<TItem extends object = Record<string, unknown>>
  extends PatternProps {
  slots?: AccordionSlots<TItem>
  mode?: 'multiple' | 'single'
}

export function Accordion<TItem extends object = Record<string, unknown>>({
  data,
  onEvent,
  slots = {},
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  mode = 'multiple',
}: AccordionProps<TItem>) {
  const { rootProps, headingProps, buttonProps, regionProps, items } =
    useAccordionPattern(data, onEvent, { mode })

  return (
    <div
      {...rootProps}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="divide-y divide-stone-200 rounded-md border border-stone-200 bg-white"
    >
      {items.map((item) => {
        const itemData = (data.entities[item.id] ?? {}) as TItem
        return (
          <div key={item.id}>
            <h3 {...headingProps(item.id)} className="m-0">
              <button
                {...buttonProps(item.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-stone-50"
              >
                {renderSlot(slots.label, defaultLabel, item, itemData)}
                <span aria-hidden className="text-stone-400">{item.expanded ? '▾' : '▸'}</span>
              </button>
            </h3>
            <div {...regionProps(item.id)} className="px-3 py-2 text-sm text-stone-600 bg-stone-50">
              {renderSlot(slots.panel, emptySlot, item, itemData)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

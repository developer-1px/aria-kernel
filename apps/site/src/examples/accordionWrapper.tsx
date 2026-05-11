/* eslint-disable react-refresh/only-export-components */
import { useReducer } from 'react'
import { fromList, reduceWithDefaults } from '@p/aria-kernel'
import type { BaseItem } from '@p/aria-kernel/patterns'
import { Accordion, type AccordionSlots, accordionWrapperKeys } from './_accordionWrapper'
import type { SlotProps } from '../catalog/slots'

type AccordionItem = BaseItem & { expanded: boolean }

interface FaqItem extends Record<string, unknown> {
  label: string
  body: string
}

const initialBase = fromList([
  { id: 'what',   label: 'What is @p/aria-kernel?',  body: 'ARIA behavior infrastructure — axes, roving, gesture, patterns.' },
  { id: 'why',    label: 'Why ARIA-first?',       body: 'W3C/WHATWG specs are the canonical naming source.' },
  { id: 'styles', label: 'Bring my own styles?',  body: 'Tailwind utilities directly. No design tokens, no CSS-in-JS.' },
])
const initialData = { ...initialBase, meta: { ...initialBase.meta, expanded: ['what'] } }

const slots: AccordionSlots<FaqItem> = {
  panel: ({ data }: SlotProps<FaqItem, AccordionItem>) => <p>{data.body}</p>,
}

export const meta = {
  title: 'Accordion Wrapper',
  apg: 'accordion',
  kind: 'collection' as const,
  blurb: 'A reusable FAQ accordion fed by the same item collection shape as the other examples.',
  keys: accordionWrapperKeys,
}

export default function AccordionWrapperDemo() {
  const [data, onEvent] = useReducer(reduceWithDefaults, undefined, () => initialData)
  return <Accordion aria-label="FAQ" data={data} onEvent={onEvent} slots={slots as AccordionSlots} />
}

/* eslint-disable react-refresh/only-export-components */
import { useReducer } from 'react'
import { fromList, reduceSingleSelect } from '@interactive-os/aria-kernel'
import { Tabs, type TabsSlots, tabsWrapperKeys } from './_tabsWrapper'
import type { SlotProps } from '../catalog/slots'

interface TabItem extends Record<string, unknown> {
  label: string
  body: string
}

const initialData = fromList([
  { id: 'overview', label: 'Overview', body: 'Headless behavior infra for ARIA.', selected: true },
  { id: 'behavior', label: 'Behavior', body: 'axes · roving · gesture composed.' },
  { id: 'patterns', label: 'Patterns', body: 'APG recipes one signature.' },
])

const slots: TabsSlots<TabItem> = {
  panel: ({ data }: SlotProps<TabItem>) => <p>{data.body}</p>,
}

export const meta = {
  title: 'Tabs Wrapper',
  apg: 'tabs',
  kind: 'collection' as const,
  blurb: 'A reusable tab view fed by the same item collection shape as the other examples.',
  keys: tabsWrapperKeys,
}

export default function TabsWrapperDemo() {
  const [data, onEvent] = useReducer(reduceSingleSelect, undefined, () => initialData)
  return <Tabs aria-label="Documentation" data={data} onEvent={onEvent} slots={slots as TabsSlots} />
}

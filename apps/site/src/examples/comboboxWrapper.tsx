/* eslint-disable react-refresh/only-export-components */
import { useComboboxReducer } from '@interactive-os/aria-kernel/patterns'
import { Combobox, comboboxWrapperKeys } from './_comboboxWrapper'

const COUNTRIES = ['Argentina', 'Australia', 'Brazil', 'Canada', 'Denmark',
  'France', 'Germany', 'Japan', 'Korea', 'Mexico',
  'Netherlands', 'Norway', 'Spain', 'Sweden', 'Switzerland'].map((label) => ({
    id: label.toLowerCase(), label,
  }))

export const meta = {
  title: 'Combobox Wrapper',
  apg: 'combobox',
  kind: 'collection' as const,
  blurb: 'A reusable searchable picker that owns its input, filtering, and popup behavior.',
  keys: comboboxWrapperKeys,
}

export default function ComboboxWrapperDemo() {
  const [data, dispatch] = useComboboxReducer(COUNTRIES)
  return <Combobox aria-label="Country" data={data} onEvent={dispatch} placeholder="Search country…" />
}

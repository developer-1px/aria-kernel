/* eslint-disable react-refresh/only-export-components */
import { useReducer } from 'react'
import { fromList, reduceWithDefaults } from '@p/aria-kernel'
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
  const [data, dispatch] = useReducer(reduceWithDefaults, COUNTRIES, fromList)
  return <Combobox aria-label="Country" data={data} onEvent={dispatch} placeholder="Search country…" />
}

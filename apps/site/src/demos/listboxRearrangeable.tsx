import { useState } from 'react'
import { fromList, getFocus, type UiEvent } from '@p/aria-kernel'
import { listboxAxis, useListboxPattern } from '@p/aria-kernel/patterns'
import { axisKeys } from '@p/aria-kernel'

export const meta = {
  title: 'Listbox · Rearrangeable',
  apg: 'listbox',
  kind: 'collection' as const,
  blurb: 'Single-select listbox paired with a toolbar — Move Up/Down, Remove, Add.',
  keys: () => axisKeys(listboxAxis()),
}

const POOL = ['Apple', 'Banana', 'Cherry', 'Durian', 'Elderberry', 'Fig', 'Grape', 'Honeydew']

export default function ListboxRearrangeableDemo() {
  const [order, setOrder] = useState<string[]>(['Apple', 'Banana', 'Cherry'])
  const [focus, setFocusId] = useState<string | null>('Apple')
  const remaining = POOL.filter((p) => !order.includes(p))

  const data = fromList(order.map((label) => ({ label, id: label, selected: label === focus })))
  data.meta = { ...(data.meta ?? {}), focus: focus ?? undefined }

  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate') setFocusId(e.id ?? null)
    if (e.type === 'select' && e.ids.length === 1) setFocusId(e.ids[0]!)
  }

  const { rootProps, optionProps, items } = useListboxPattern(data, onEvent, {
    label: 'Picked',
    rearrangeable: true,
  })
  const focusedId = getFocus(data) ?? focus

  const move = (delta: number) => {
    if (!focusedId) return
    const idx = order.indexOf(focusedId)
    const next = idx + delta
    if (idx < 0 || next < 0 || next >= order.length) return
    const copy = [...order]
    ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
    setOrder(copy)
  }
  const remove = () => {
    if (!focusedId) return
    const idx = order.indexOf(focusedId)
    const copy = order.filter((x) => x !== focusedId)
    setOrder(copy)
    setFocusId(copy[Math.max(0, idx - 1)] ?? null)
  }
  const add = (label: string) => {
    setOrder((o) => [...o, label])
    setFocusId(label)
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-2">
        <ul
          {...rootProps}
          className="w-56 rounded-md border border-stone-200 bg-white p-1 text-sm data-[rearrangeable]:border-stone-300"
        >
          {items.map((option) => (
            <li
              key={option.id}
              {...optionProps(option.id)}
              className="cursor-pointer rounded px-2 py-1 [&:not([aria-selected=true])]:hover:bg-stone-200 aria-selected:bg-stone-900 aria-selected:text-white"
            >
              {option.label}
            </li>
          ))}
        </ul>
        <div role="toolbar" aria-label="Rearrange" className="flex gap-1">
          <button type="button" onClick={() => move(-1)} className="rounded border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50">↑ Up</button>
          <button type="button" onClick={() => move(1)} className="rounded border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50">↓ Down</button>
          <button type="button" onClick={remove} className="rounded border border-stone-300 px-2 py-1 text-xs hover:bg-stone-50">✕ Remove</button>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-stone-500">Available</span>
        <ul className="w-40 rounded-md border border-stone-200 bg-white p-1 text-sm">
          {remaining.map((label) => (
            <li key={label} className="flex items-center justify-between rounded px-2 py-1">
              <span>{label}</span>
              <button type="button" onClick={() => add(label)} className="text-xs text-stone-500 hover:text-stone-900">+ Add</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

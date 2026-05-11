import { useState } from 'react'
import { axisKeys, type UiEvent } from '@p/aria-kernel'
import { toolbarAxis, useToolbarPattern, useToolbarReducer } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Toolbar',
  apg: 'toolbar',
  kind: 'collection' as const,
  blurb: 'A compact command row that keeps related actions reachable in one place.',
  keys: () => axisKeys(toolbarAxis()),
}

const ITEMS = [
  { id: 'bold', label: 'Bold' },
  { id: 'italic', label: 'Italic' },
  { id: 'underline', label: 'Underline' },
  { id: 'sep', separator: true },
  { id: 'link', label: 'Link' },
]

export default function ToolbarDemo() {
  const [activated, setActivated] = useState<string | null>(null)
  const [data, dispatch] = useToolbarReducer(ITEMS)
  const handleEvent = (e: UiEvent) => {
    if (e.type === 'activate') setActivated(e.id)
    dispatch(e)
  }
  const { rootProps, toolbarItemProps, items } = useToolbarPattern(data, handleEvent, { label: 'Formatting' })

  return (
    <div className="space-y-2">
      <div
        {...rootProps}
        className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white p-1 text-sm"
      >
        {items.map((item) => item.separator ? (
          <span key={item.id} aria-hidden className="px-1 text-stone-300">|</span>
        ) : (
          <button
            key={item.id}
            {...toolbarItemProps(item.id)}
            className="rounded px-2 py-1 hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            {item.label}
          </button>
        ))}
      </div>
      <p data-testid="toolbar-activated" className="text-xs text-stone-500">
        last activated: {activated ?? '—'}
      </p>
    </div>
  )
}

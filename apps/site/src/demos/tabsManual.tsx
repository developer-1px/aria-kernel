import { useReducer } from 'react'
import { axisKeys, fromList, reduceWithDefaults } from '@p/aria-kernel'
import { tabsAxis, useTabsPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Tabs · Manual Activation',
  apg: 'tabs',
  kind: 'collection' as const,
  blurb: 'Arrow keys move focus only; Space or Enter activates the focused tab.',
  keys: () => axisKeys(tabsAxis()),
}

const TABS = [{ label: 'Nils' }, { label: 'Agnes', selected: true }, { label: 'Magnus' }]

export default function TabsManualDemo() {
  const [data, dispatch] = useReducer(reduceWithDefaults, TABS, fromList)
  const { rootProps, tabProps, panelProps, items } = useTabsPattern(data, dispatch, {
    activationMode: 'manual',
  })

  return (
    <div className="space-y-3">
      <div {...rootProps} className="flex gap-1 border-b border-stone-200">
        {items.map((item) => (
          <button
            key={item.id}
            {...tabProps(item.id)}
            className="px-3 py-1.5 text-sm text-stone-600 border-b-2 border-transparent aria-selected:border-stone-900 aria-selected:text-stone-900 hover:text-stone-900"
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          {...panelProps(item.id)}
          className="rounded-md bg-stone-50 p-3 text-sm text-stone-700"
        >
          Bio of <strong>{item.label}</strong> — press Space or Enter to activate the focused tab.
        </div>
      ))}
    </div>
  )
}

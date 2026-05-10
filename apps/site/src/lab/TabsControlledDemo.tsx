import { useMemo, useState } from 'react'
import { fromList, type UiEvent } from '@p/aria-kernel'
import { useTabsPattern } from '@p/aria-kernel/patterns'

const TABS = ['Sheet1', 'Sheet2', 'Sheet3']

export function TabsControlledDemo() {
  const [active, setActive] = useState<string>(TABS[0])
  const data = useMemo(() => fromList(TABS.map((id) => ({ id, label: id }))), [])

  const { rootProps, tabProps } = useTabsPattern(data, (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) setActive(e.id)
    else if (e.type === 'activate' && e.id) setActive(e.id)
    else if (e.type === 'select' && e.ids[0]) setActive(e.ids[0])
  }, { label: 'Sheet tabs', activationMode: 'automatic', active })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Tabs — controlled active</h1>
        <p className="text-sm text-neutral-500">
          <code>active</code> prop 으로 외부 SSOT 와 동기화. consumer 는
          <code> data.entities[id].selected </code> 손으로 안 박음.
        </p>
      </header>

      <div {...rootProps} className="flex gap-1 border-b border-neutral-200">
        {TABS.map((id) => (
          <button
            key={id}
            {...tabProps(id)}
            className={
              'px-4 py-2 text-sm border-b-2 -mb-px ' +
              (id === active
                ? 'border-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900')
            }
          >
            {id}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded border border-neutral-200 p-4 text-sm">
        <strong>Active:</strong> {active}
      </div>

      <details className="mt-8 text-sm">
        <summary className="cursor-pointer font-semibold">소비자 코드</summary>
        <pre className="mt-2 overflow-auto rounded bg-neutral-900 p-3 text-xs text-neutral-100">
{`const [active, setActive] = useState(TABS[0])
const data = useMemo(() => fromList(TABS.map(id => ({id, label: id}))), [])

useTabsPattern(data, onEvent, { active, label: '...' })
// data.entities 손으로 박을 일 0.`}
        </pre>
      </details>
    </div>
  )
}

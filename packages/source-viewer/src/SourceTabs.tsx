import { useState } from 'react'
import { fromList } from '@p/aria-kernel'
import { useTabsPattern } from '@p/aria-kernel/patterns'
import { useLocalData } from '@p/aria-kernel/local'
import { CopyButton } from './CopyButton'
import { HighlightedCode } from './HighlightedCode'
import { buildAppTabs, type AppTab } from './buildAppTabs'

export function SourceTabs(
  props:
    | { tabs: AppTab[]; filenamePrefix?: string; sources?: undefined; initialRoot?: undefined }
    | { sources: Record<string, string>; initialRoot: string; filenamePrefix?: string; tabs?: undefined },
) {
  const dynamic = props.sources !== undefined
  const [rootFile, setRootFile] = useState<string>(dynamic ? props.initialRoot : '')
  const [history, setHistory] = useState<string[]>([])

  const tabs: AppTab[] = dynamic ? buildAppTabs(props.sources!, rootFile) : props.tabs!

  const promoteRoot = (filename: string) => {
    if (!dynamic || filename === rootFile) return
    setHistory((h) => [...h, rootFile])
    setRootFile(filename)
  }
  const goBack = () => {
    setHistory((h) => {
      if (h.length === 0) return h
      setRootFile(h[h.length - 1])
      return h.slice(0, -1)
    })
  }

  return (
    <TabsView
      key={dynamic ? rootFile : 'static'}
      tabs={tabs}
      filenamePrefix={props.filenamePrefix}
      onDoubleClickTab={dynamic ? promoteRoot : undefined}
      backLabel={history.length > 0 ? history[history.length - 1] : null}
      onBack={goBack}
    />
  )
}

function TabsView({
  tabs,
  filenamePrefix,
  onDoubleClickTab,
  backLabel,
  onBack,
}: {
  tabs: AppTab[]
  filenamePrefix?: string
  onDoubleClickTab?: (filename: string) => void
  backLabel: string | null
  onBack: () => void
}) {
  const [data, onEvent] = useLocalData(() =>
    fromList(tabs.map((t, i) => ({ id: t.key, label: t.label, selected: i === 0 }))),
  )
  const { rootProps, tabProps, panelProps, items } = useTabsPattern(data, onEvent)
  const activeId = items.find((i) => i.selected)?.id ?? items[0]?.id
  const active = tabs.find((t) => t.key === activeId) ?? tabs[0]

  return (
    <>
      <div className="flex items-center justify-between border-b border-stone-800 px-4 py-2">
        <div {...rootProps} className="flex items-center gap-1 overflow-x-auto">
          {backLabel !== null && (
            <button
              onClick={onBack}
              title={`Back to ${backLabel}`}
              className="rounded px-2 py-0.5 text-[11px] font-mono text-stone-400 hover:text-stone-100"
            >
              ←
            </button>
          )}
          {items.map((item) => {
            const tab = tabs.find((t) => t.key === item.id)!
            return (
              <button
                key={item.id}
                {...tabProps(item.id)}
                onDoubleClick={
                  onDoubleClickTab ? () => onDoubleClickTab(tab.filename) : undefined
                }
                className="rounded px-2 py-0.5 text-[11px] font-mono text-stone-400 hover:text-stone-200 aria-selected:bg-stone-800 aria-selected:text-stone-100"
              >
                {item.label}
              </button>
            )
          })}
          <code className="ml-2 whitespace-nowrap text-xs font-mono text-stone-500">
            {(filenamePrefix ?? '') + active.filename}
          </code>
        </div>
        <CopyButton text={active.source} />
      </div>
      <div {...panelProps(active.key)} className="flex flex-1 flex-col md:overflow-hidden">
        <HighlightedCode
          source={active.source}
          filename={active.filename}
          highlightSymbols={active.symbols}
        />
      </div>
    </>
  )
}

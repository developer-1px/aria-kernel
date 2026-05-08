import { createFileRoute } from '@tanstack/react-router'
import { Outliner, outlineCrud, outlinerSpec } from '@apps/outliner'
import { SourceTabs } from '@p/source-viewer'
import { KeymapPanel } from '../debug/KeymapPanel'
import { JsonInspector } from '../debug/JsonInspector'

const SOURCES = import.meta.glob<string>(
  '../../../outliner/src/**/*.{ts,tsx}',
  { eager: true, query: '?raw', import: 'default' },
)

function OutlinerScreen() {
  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-[1fr_1fr_1fr] md:overflow-hidden">
      <div className="bg-stone-50 md:overflow-auto">
        <Outliner />
      </div>
      <aside className="flex flex-col bg-neutral-50 border-l border-neutral-200 md:overflow-hidden">
        <div className="overflow-auto">
          <KeymapPanel
            chords={outlinerSpec.inputs.map(({ chord, command, label }) => ({
              chord,
              command,
              description: label,
            }))}
            title="Keymap (SSOT — outlinerSpec.inputs)"
          />
          <JsonInspector source={outlineCrud} title="Live JSON (zod-crud snapshot)" />
        </div>
      </aside>
      <div className="flex flex-col bg-stone-950 border-t md:border-t-0 md:border-l border-stone-200 md:overflow-hidden">
        <SourceTabs sources={SOURCES} initialRoot="Outliner.tsx" />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/apps/outliner/$')({
  component: OutlinerScreen,
  staticData: {
    palette: {
      label: 'Outliner',
      to: '/apps/outliner/$',
      sub: 'Keyboard-only Workflowy clone — zod-crud × @p/aria-kernel example',
    },
  },
})

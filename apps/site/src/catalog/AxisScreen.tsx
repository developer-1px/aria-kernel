import { useState } from 'react'
import { CatalogRow } from './CatalogRow'
import type { AxisEntry } from './registry.axes'
import { slugForAxis, PKG_SOURCES } from './registry.axes'
import { buildAppTabs } from '@interactive-os/source-viewer'

/**
 * 한 axis 의 화면 — 좌측에 그 axis 를 쓰는 pattern 목록(탭 전환), 우측에 선택된 pattern 의 raw 소스.
 * recipe = SSOT (`packages/aria-kernel/src/patterns/<name>.ts` ?raw 그대로).
 */
export function AxisScreen({
  entry,
  index,
  total,
}: {
  entry: AxisEntry
  index: number
  total: number
}) {
  const [selected, setSelected] = useState(entry.patterns[0]?.name)
  const slug = slugForAxis(entry.axis)
  const current = entry.patterns.find((p) => p.name === selected) ?? entry.patterns[0]

  return (
    <CatalogRow
      slug={slug}
      index={index}
      total={total}
      badge={{
        label: 'Axis',
        className: 'bg-stone-200 text-stone-900 ring-stone-300',
      }}
      title={entry.axis}
      titleMono
      blurb={`${entry.patterns.length} pattern${entry.patterns.length === 1 ? '' : 's'} use this axis`}
      preview={
        <nav
          aria-label={`${entry.axis} consumers`}
          className="flex h-full flex-col gap-0.5 overflow-auto border-r border-stone-200 bg-stone-50 p-2"
        >
          <h3 className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Patterns
          </h3>
          {entry.patterns.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setSelected(p.name)}
              className={`rounded px-2 py-1 text-left text-sm font-mono ${
                p.name === current?.name
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-700 hover:bg-stone-200'
              }`}
            >
              {p.name}.ts
            </button>
          ))}
        </nav>
      }
      tabs={current ? buildAppTabs(PKG_SOURCES, current.filename) : []}
      filenamePrefix=""
    />
  )
}

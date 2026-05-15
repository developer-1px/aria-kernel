import { CatalogRow, PreviewCenter } from './CatalogRow'
import { labelFor } from '@interactive-os/source-viewer'
import type { WrapperEntry } from './registry.wrappers'

export function WrapperScreen({
  entry,
  index,
  total,
}: {
  entry: WrapperEntry
  index: number
  total: number
}) {
  const { Component, title, apg, blurb, source, filename, slug } = entry
  return (
    <CatalogRow
      slug={slug}
      index={index}
      total={total}
      badge={{
        label: 'Wrapper',
        className: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
      }}
      title={title}
      blurb={blurb}
      apg={apg}
      keys={entry.keys?.()}
      preview={
        <PreviewCenter>
          <Component />
        </PreviewCenter>
      }
      tabs={[{ key: filename, label: labelFor(filename), filename, source, symbols: [] }]}
      filenamePrefix="examples/"
    />
  )
}

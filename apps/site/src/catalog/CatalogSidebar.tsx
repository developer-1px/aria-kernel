import { useState } from 'react'
import type { NormalizedData } from '@p/aria-kernel'
import { Nav } from '../examples/_navigationListWrapper'
import type { SlotProps } from './slots'

export type CatalogGroup = {
  label: string
  items: { slug: string; title: string }[]
}

interface CatalogItem extends Record<string, unknown> {
  label: string
  href: string
  current: boolean
  slug: string
}

const buildData = (groups: CatalogGroup[], activeSlug: string): NormalizedData => {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}
  const root: string[] = []

  for (const g of groups) {
    if (!g.items.length) continue
    const groupId = `group:${g.label}`
    entities[groupId] = { label: `${g.label} · ${g.items.length}` }
    relationships[groupId] = g.items.map((it) => it.slug)
    root.push(groupId)
    for (const it of g.items) {
      entities[it.slug] = {
        label: it.title,
        href: `#${it.slug}`,
        current: activeSlug === it.slug,
        slug: it.slug,
      } satisfies CatalogItem
    }
  }

  return { entities, relationships, meta: { root } }
}

export function CatalogSidebar({
  ariaLabel,
  buttonLabel,
  groups,
  activeSlug,
}: {
  ariaLabel: string
  buttonLabel: string
  groups: CatalogGroup[]
  activeSlug: string
}) {
  const [open, setOpen] = useState(false)
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const data = buildData(groups, activeSlug)

  const panel = (
    <>
      <a
        href="#intro"
        onClick={(e) => {
          e.preventDefault()
          window.history.pushState(null, '', '#intro')
          window.dispatchEvent(new HashChangeEvent('hashchange'))
          setOpen(false)
        }}
        className="mb-3 block rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
      >
        ← Intro
      </a>
      <Nav
        aria-label={ariaLabel}
        data={data}
        onEvent={(e) => {
          if (e.type !== 'activate') return
          const ent = data.entities[e.id] as CatalogItem | undefined
          if (!ent) return
          window.history.pushState(null, '', `#${ent.slug}`)
          window.dispatchEvent(new HashChangeEvent('hashchange'))
          setOpen(false)
        }}
        slots={{
          label: ({ data: it }: SlotProps<CatalogItem>) => (
            <span className="flex flex-1 items-center justify-between">
              <span>{it.label}</span>
              <code className="text-[10px] font-mono text-stone-400 [a[aria-current=page]_&]:text-stone-300">
                #{it.slug}
              </code>
            </span>
          ),
        }}
      />
    </>
  )

  return (
    <>
      <aside className="hidden md:flex md:w-72 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-stone-200 md:bg-white md:p-3">
        {panel}
      </aside>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="catalog-sidebar-panel"
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow hover:bg-stone-50 md:hidden"
      >
        {open ? 'Close' : `${buttonLabel} (${total})`}
      </button>
      {open && (
        <div
          id="catalog-sidebar-panel"
          className="fixed left-4 top-14 z-50 max-h-[80vh] w-72 overflow-auto rounded-lg border border-stone-200 bg-white p-3 shadow-xl md:hidden"
        >
          {panel}
        </div>
      )}
    </>
  )
}

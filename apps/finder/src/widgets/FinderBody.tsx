// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import type { ComponentPropsWithoutRef } from 'react'
import { type NormalizedData, type UiEvent } from '@interactive-os/aria-kernel'
import { useFeature } from '@interactive-os/resource'
import { useListboxPattern, useToolbarPattern } from '@interactive-os/aria-kernel/patterns'
import { Link } from '@tanstack/react-router'
import { finderFeature } from '../features/feature'
import { PreviewPane } from './Preview'
import { Columns } from './Columns'
import { extToPreviewKind, type ViewMode } from '../entities/types'

/** Finder 본문 — sidebar + columns + preview. ds 의존성 0건. */
export function FinderBody() {
  const [view, dispatch] = useFeature(finderFeature)

  const onColumns = (e: UiEvent) => {
    if (e.type === 'activate' || e.type === 'navigate') dispatch({ type: 'activateCol', id: e.id })
    else if (e.type === 'expand') dispatch({ type: 'expandCol', id: e.id, open: e.open })
  }
  const onRecent = (e: UiEvent) => {
    if (e.type === 'activate') dispatch({ type: 'activateRec', id: e.id })
  }
  const onFav = (e: UiEvent) => {
    if (e.type === 'activate') dispatch({ type: 'pinFav', id: e.id })
  }
  const onView = (e: UiEvent) => {
    if (e.type === 'activate') dispatch({ type: 'setMode', mode: e.id as ViewMode })
  }

  const previewIsMd = view.preview.kind === 'text' && 'node' in view.preview &&
    extToPreviewKind(view.preview.node.ext) === 'markdown'

  return (
    <main
      aria-label={`Finder — ${view.titlebar.path}`}
      data-view={view.titlebar.mode}
      className="grid h-svh w-full grid-cols-[14rem_1fr_22rem] bg-neutral-50"
    >
      <aside className="flex flex-col overflow-hidden border-r border-neutral-200 bg-white">
        <header className="flex items-center border-b border-neutral-200 px-2 py-2">
          <button type="button" aria-label="사이드바 접기" className="rounded p-1 text-neutral-500 hover:bg-neutral-100">≡</button>
        </header>
        <nav aria-label="사이드바" className="flex flex-col gap-4 overflow-y-auto p-2">
          <SidebarSection title="최근 항목" data={view.sidebar.recent} onEvent={onRecent} />
          <SidebarSection title="즐겨찾기" data={view.sidebar.fav} onEvent={onFav} />
          <SidebarSection title="태그" data={view.sidebar.tags} onEvent={onRecent} />
        </nav>
      </aside>

      <section className="flex flex-col overflow-hidden">
        <header className="flex items-center justify-end border-b border-neutral-200 bg-white px-3 py-2">
          <ViewToolbar data={view.toolbar} onEvent={onView} />
        </header>
        <div className="flex-1 overflow-hidden">
          <Columns data={view.columns} onEvent={onColumns} />
        </div>
      </section>

      <section className="flex flex-col overflow-hidden border-l border-neutral-200 bg-white">
        <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2">
          <input
            type="search"
            aria-label="검색"
            placeholder="검색"
            value={view.titlebar.query}
            onChange={(e) => dispatch({ type: 'setQuery', q: e.currentTarget.value })}
            className="flex-1 rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900"
          />
          {previewIsMd && 'node' in view.preview && (
            <Link
              to="/apps/markdown/$"
              params={{ _splat: view.preview.node.path.replace(/^\//, '') }}
              aria-label="전체 화면으로 열기"
              className="text-xs text-blue-600 underline"
            >전체 화면 ↗</Link>
          )}
        </header>
        <div className="flex-1 overflow-auto p-3">
          <PreviewPane vm={view.preview as never} />
        </div>
      </section>
    </main>
  )
}

function SidebarSection({
  title, data, onEvent,
}: { title: string; data: NormalizedData; onEvent: (e: UiEvent) => void }) {
  const headingId = `sb-${title.replace(/\s+/g, '-')}`
  const { rootProps, optionProps, items } = useListboxPattern(data, onEvent)
  if (items.length === 0) return null
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{title}</h3>
      <ul
        {...(rootProps as ComponentPropsWithoutRef<'ul'>)}
        aria-labelledby={headingId}
        className="m-0 list-none p-0"
      >
        {items.map((it) => {
          const d = data.entities[it.id] ?? {}
          return (
            <li
              key={it.id}
              {...(optionProps(it.id) as ComponentPropsWithoutRef<'li'>)}
              aria-posinset={it.posinset}
              aria-setsize={it.setsize}
              aria-selected={it.selected || undefined}
              aria-disabled={it.disabled || undefined}
              className={
                'cursor-pointer rounded px-2 py-1 text-sm ' +
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ' +
                (it.selected
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-700 hover:bg-neutral-100')
              }
            >
              {String(d.label ?? it.label)}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ViewToolbar({ data, onEvent }: { data: NormalizedData; onEvent: (e: UiEvent) => void }) {
  const { rootProps, toolbarItemProps, items } = useToolbarPattern(data, onEvent)
  return (
    <div
      {...(rootProps as ComponentPropsWithoutRef<'div'>)}
      aria-label="뷰 모드"
      className="inline-flex items-center rounded border border-neutral-200 bg-neutral-50 p-0.5"
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          {...(toolbarItemProps(it.id) as ComponentPropsWithoutRef<'button'>)}
          className={
            'px-2 py-1 text-xs ' +
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ' +
            (it.selected ? 'rounded bg-white text-neutral-900 shadow-sm' : 'text-neutral-500')
          }
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
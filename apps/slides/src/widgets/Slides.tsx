import { useEffect, useState } from 'react'
import { useZodCrudResource } from '@p/resource/zod-crud'
import { useTreePattern } from '@p/aria-kernel/patterns'
import type { NormalizedData, UiEvent } from '@p/aria-kernel'
import { dispatchSlideEvent, slideText, slideTreeCommands, slideTreeEventFromKeyboard, updateSlideText } from '@p/slides'
import { crud, deckResource, normalizeDeck } from '../resource'

export function Slides() {
  const [data, dispatchBase] = useZodCrudResource(deckResource, crud, normalizeDeck, {
    kind: 'tree',
    labelField: 'title',
    selection: 'multi',
  })
  const activeId = data.meta?.focus ?? data.meta?.root?.[0] ?? null
  const active = activeId ? slideText(crud.snapshot(), activeId) : null
  const dispatch = (event: UiEvent) => dispatchSlideEvent(event, { data, crud, fallback: dispatchBase })

  return (
    <main className="grid h-svh grid-cols-[20rem_1fr] bg-neutral-100 text-neutral-900">
      <aside className="flex min-w-0 flex-col border-r border-neutral-200 bg-white">
        <header className="border-b border-neutral-200 px-4 py-3">
          <h1 className="text-sm font-semibold">Deck outline</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Enter · Tab · Shift+Tab · Space · Cmd+C/X/V/Z
          </p>
        </header>
        <SlideTree data={data} onEvent={dispatch} />
      </aside>
      <section className="grid min-w-0 grid-rows-[auto_1fr]">
        <Toolbar activeId={activeId} onEvent={dispatch} />
        <SlideCanvas
          key={activeId ?? 'empty'}
          slideId={activeId}
          title={active?.title ?? ''}
          body={active?.body ?? ''}
        />
      </section>
    </main>
  )
}

function SlideTree({ data, onEvent }: { data: NormalizedData; onEvent: (event: UiEvent) => void }) {
  const tree = useTreePattern(data, onEvent, {
    label: 'Slides',
    multiSelectable: true,
    editable: true,
    commands: slideTreeCommands,
    insideEditable: 'native',
  })
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const id = (event.target as Element).closest<HTMLElement>('[data-id]')?.dataset.id
    const keyEvent = id ? slideTreeEventFromKeyboard(data, id, event.nativeEvent) : null
    if (keyEvent) {
      event.preventDefault()
      onEvent(keyEvent)
      return
    }
    tree.rootProps.onKeyDown?.(event)
  }
  return (
    <ol {...tree.rootProps} onKeyDown={onKeyDown} className="m-0 flex-1 overflow-auto p-2 outline-none">
      {tree.items.map((item) => (
        <li
          key={item.id}
          {...tree.itemProps(item.id)}
          className="flex cursor-default items-center gap-2 rounded px-2 py-1 text-sm outline-none focus:bg-blue-50 data-[selected]:bg-blue-100"
          style={{ paddingLeft: `${(item.level - 1) * 1.25 + 0.5}rem` }}
        >
          <span aria-hidden className="w-4 text-neutral-400">
            {item.hasChildren ? (item.expanded ? '▾' : '▸') : '·'}
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label || 'Untitled slide'}</span>
        </li>
      ))}
    </ol>
  )
}

function Toolbar({ activeId, onEvent }: { activeId: string | null; onEvent: (event: UiEvent) => void }) {
  const disabled = !activeId
  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2">
      <button className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40" disabled={disabled} onClick={() => activeId && onEvent({ type: 'insertAfter', siblingId: activeId })}>
        Add
      </button>
      <button className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40" disabled={disabled} onClick={() => activeId && onEvent({ type: 'appendChild', parentId: activeId })}>
        Child
      </button>
      <button className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40" disabled={disabled} onClick={() => activeId && onEvent({ type: 'remove', id: activeId })}>
        Delete
      </button>
      <button className="rounded border border-neutral-200 px-2 py-1 text-xs" onClick={() => onEvent({ type: 'undo' })}>
        Undo
      </button>
      <button className="rounded border border-neutral-200 px-2 py-1 text-xs" onClick={() => onEvent({ type: 'redo' })}>
        Redo
      </button>
    </div>
  )
}

function SlideCanvas({ slideId, title, body }: { slideId: string | null; title: string; body: string }) {
  const [draft, setDraft] = useState({ title, body })
  useEffect(() => setDraft({ title, body }), [slideId, title, body])
  const commit = () => {
    if (!slideId) return
    updateSlideText(crud, slideId, draft)
  }
  return (
    <div className="grid min-h-0 place-items-center overflow-auto p-8">
      <article className="grid aspect-video w-[min(100%,calc((100svh-8rem)*16/9))] grid-rows-[auto_1fr] overflow-hidden rounded border border-neutral-200 bg-white p-12 shadow-2xl">
        <input
          aria-label="Slide title"
          disabled={!slideId}
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          onBlur={commit}
          className="w-full border-0 bg-transparent text-4xl font-semibold leading-tight outline-none disabled:text-neutral-300"
          placeholder="Slide title"
        />
        <textarea
          aria-label="Slide body"
          disabled={!slideId}
          value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
          onBlur={commit}
          className="mt-8 h-full resize-none border-0 bg-transparent text-xl leading-relaxed outline-none disabled:text-neutral-300"
          placeholder="Body"
        />
      </article>
    </div>
  )
}

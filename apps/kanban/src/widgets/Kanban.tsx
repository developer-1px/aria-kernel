// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import { useEffect, useMemo, useRef, useState } from 'react'
import { useListboxPattern } from '@p/aria-kernel/patterns'
import { KEYS, type UiEvent } from '@p/aria-kernel'
import { useZodCrudResource } from '@p/aria-kernel/adapters/zod-crud'
import { boardResource } from '../features/boardResource'
import { normalizeBoard } from '../features/normalizeBoard'
import { crud } from '../features/boardCrud'

export function Kanban() {
  const [data, onEventRaw] = useZodCrudResource(boardResource, crud, normalizeBoard, { kind: 'list' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const { columnIds, rootId, cardParentArray } = useMemo(() => normalizeBoard(crud.snapshot()), [data])

  /**
   * Kanban paste 의미 = sibling insert. card target → cards-array + index 매핑.
   * (P2: 도메인-특화, ARIA 어휘 아님이라 widget 잔존이 정당.)
   */
  const onEvent = (e: UiEvent) => {
    if (e.type === 'paste' && e.targetId && cardParentArray[e.targetId]) {
      const arrId = cardParentArray[e.targetId]
      const idx = (data.relationships[Object.keys(data.relationships).find(
        (k) => data.relationships[k]?.includes(e.targetId!),
      ) ?? ''] ?? []).indexOf(e.targetId)
      onEventRaw({ type: 'paste', targetId: arrId, mode: 'child', index: idx + 1 })
      return
    }
    onEventRaw(e)
  }

  /** 좌/우 arrow — 인접 컬럼 같은 index card 로 focus 이동. */
  const moveAcrossColumn = (cardId: string, dir: -1 | 1) => {
    const colIdx = columnIds.findIndex((cid) => (data.relationships[cid] ?? []).includes(cardId))
    if (colIdx < 0) return
    const cardIdx = (data.relationships[columnIds[colIdx]] ?? []).indexOf(cardId)
    const target = columnIds[colIdx + dir]
    if (!target) return
    const targetCards = data.relationships[target] ?? []
    const targetCard = targetCards[Math.min(cardIdx, targetCards.length - 1)]
    if (targetCard) {
      const el = document.querySelector(`[data-id="${targetCard}"]`) as HTMLElement | null
      el?.focus()
      // 컬럼 간 이동은 listbox sff 가 안 닿음 — focus/select event 로 meta 동기화.
      onEvent({ type: 'navigate', id: targetCard })
      onEvent({ type: 'select', ids: [targetCard] })
    }
  }

  return (
    <main className="flex h-screen gap-4 overflow-x-auto bg-neutral-50 p-6">
      <header className="absolute right-6 top-6 text-xs text-neutral-400">
        Tab · ↑↓ · ←→ · Enter (edit) · Esc (cancel) · Backspace · Cmd+X→Tab→Cmd+V · Cmd+Z
      </header>
      {columnIds.map((colId) => (
        <Column
          key={colId}
          id={colId}
          data={data}
          onEvent={onEvent}
          editingId={editingId}
          onStartEdit={(id) => setEditingId(id)}
          onCommitEdit={(id, title, andInsertAfter) => {
            onEvent({ type: 'update', id, value: { title } })
            setEditingId(null)
            // 새 sibling 은 빈 title 로 생성됨 → AutoEditOnInsert 가 자동으로 edit 진입.
            if (andInsertAfter) onEvent({ type: 'insertAfter', siblingId: id })
          }}
          onCancelEdit={(idIfEmptyToRemove) => {
            setEditingId(null)
            // 빈 title 새 카드를 cancel 하면 카드 자체를 제거 (Workflowy 흐름).
            if (idIfEmptyToRemove) onEvent({ type: 'remove', id: idIfEmptyToRemove })
          }}
          onMoveAcrossColumn={moveAcrossColumn}
        />
      ))}
      <button
        onClick={() => onEvent({ type: 'appendChild', parentId: rootId })}
        className="h-10 shrink-0 self-start rounded border border-dashed border-neutral-300 px-3 text-xs text-neutral-500 hover:bg-white"
      >
        + Column
      </button>
      <AutoEditOnInsert focus={data.meta?.focus} onEnter={(id) => setEditingId(id)} editingId={editingId} data={data} />
    </main>
  )
}

/**
 * 새 card 가 생기면(focus 가 빈 title 의 card 로 가면) 자동으로 edit mode 진입.
 * Workflowy 식 "Enter 로 commit + 새 카드 즉시 편집" 흐름.
 */
function AutoEditOnInsert({
  focus, editingId, data, onEnter,
}: {
  focus: string | undefined
  editingId: string | null
  data: import('@p/aria-kernel').NormalizedData
  onEnter: (id: string) => void
}) {
  const last = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!focus || focus === last.current || editingId) return
    last.current = focus
    const label = data.entities[focus]?.label
    if (label === '') onEnter(focus)
  }, [focus, editingId, data, onEnter])
  return null
}

function Column({
  id, data, onEvent, editingId, onStartEdit, onCommitEdit, onCancelEdit, onMoveAcrossColumn,
}: {
  id: string
  data: import('@p/aria-kernel').NormalizedData
  onEvent: (e: UiEvent) => void
  editingId: string | null
  onStartEdit: (id: string) => void
  onCommitEdit: (id: string, title: string, andInsertAfter: boolean) => void
  onCancelEdit: (idIfEmptyToRemove: string | null) => void
  onMoveAcrossColumn: (id: string, dir: -1 | 1) => void
}) {
  const lb = useListboxPattern(data, onEvent, {
    containerId: id,
    label: data.entities[id]?.label,
    insideEditable: 'native',
  })
  const title = data.entities[id]?.label ?? ''

  const onListKey = (e: React.KeyboardEvent) => {
    const focusedCard = (e.target as HTMLElement).closest('[role="option"]')?.getAttribute('data-id')
    if (!focusedCard) {
      lb.rootProps.onKeyDown?.(e as unknown as KeyboardEvent & { preventDefault(): void })
      return
    }
    if (e.key === KEYS.Enter) {
      e.preventDefault()
      onStartEdit(focusedCard)
      return
    }
    if (e.key === KEYS.Backspace) {
      e.preventDefault()
      onEvent({ type: 'remove', id: focusedCard })
      return
    }
    if (e.key === KEYS.ArrowLeft) {
      e.preventDefault()
      onMoveAcrossColumn(focusedCard, -1)
      return
    }
    if (e.key === KEYS.ArrowRight) {
      e.preventDefault()
      onMoveAcrossColumn(focusedCard, 1)
      return
    }
    lb.rootProps.onKeyDown?.(e as unknown as KeyboardEvent & { preventDefault(): void })
  }

  return (
    <section className="flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-white p-3 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">{title}</h2>
        <button
          onClick={() => onEvent({ type: 'appendChild', parentId: id })}
          className="text-xs text-neutral-400 hover:text-neutral-700"
          aria-label={`Add card to ${title}`}
        >
          +
        </button>
      </div>
      <ul {...lb.rootProps} onKeyDown={onListKey} className="flex flex-col gap-1.5 outline-none">
        {lb.items.length === 0 && (
          <li className="rounded border border-dashed border-neutral-200 p-2 text-xs text-neutral-300">
            empty
          </li>
        )}
        {lb.items.map((it) => (
          <li
            key={it.id}
            {...lb.optionProps(it.id)}
            className="cursor-default rounded border border-neutral-200 bg-white p-2 text-sm text-neutral-800 outline-none focus:border-blue-400 focus:bg-blue-50 data-[selected]:bg-blue-100"
            onDoubleClick={() => onStartEdit(it.id)}
          >
            {editingId === it.id ? (
              <CardEditor
                initial={it.label || ''}
                onCommit={(title, andInsertAfter) => onCommitEdit(it.id, title, andInsertAfter)}
                onCancel={() => onCancelEdit(it.label === '' ? it.id : null)}
              />
            ) : (
              it.label || <em className="text-neutral-300">empty</em>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function CardEditor({
  initial, onCommit, onCancel,
}: {
  initial: string
  onCommit: (title: string, andInsertAfter: boolean) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === KEYS.Enter) {
          e.preventDefault()
          e.stopPropagation()
          onCommit(value, !e.shiftKey) // Enter = commit + new sibling, Shift+Enter = commit only
        } else if (e.key === KEYS.Escape) {
          e.preventDefault()
          e.stopPropagation()
          onCancel()
        }
      }}
      onBlur={() => onCommit(value, false)}
      className="w-full bg-transparent outline-none"
    />
  )
}
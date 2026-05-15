import type { NormalizedData, UiEvent } from '@interactive-os/aria-kernel'
import { matches } from '@interactive-os/keyboard'
import type { TreeCommandDescriptor } from '@interactive-os/aria-kernel/patterns'
import type { JsonCrud, JsonValue, OperationResult } from 'zod-crud'
import { normalizeDeck, propNode } from './normalize'
import type { DeckDoc } from './schema'
import { parentOf, previousSibling, selectedEventIds, siblingBatch } from './structure'

type SlideCrud = Pick<
  JsonCrud<DeckDoc>,
  | 'snapshot'
  | 'read'
  | 'copy'
  | 'copyMany'
  | 'cut'
  | 'cutMany'
  | 'delete'
  | 'deleteMany'
  | 'appendChild'
  | 'insertBefore'
  | 'insertAfter'
  | 'update'
>

export type SlideEventContext = {
  data: NormalizedData
  crud: SlideCrud
  fallback: (event: UiEvent) => void
}

type SlideEventHandler = (event: UiEvent, context: SlideEventContext) => boolean

export const slideTreeCommands: readonly TreeCommandDescriptor[] = [
  { chord: 'Enter', command: 'insertAfter', effect: { op: 'insertAfter', source: 'self', fallback: { op: 'appendChild', source: 'self' } } },
  { chord: 'Shift+Enter', command: 'appendChild', effect: { op: 'appendChild', source: 'self' } },
  { chord: 'Backspace', command: 'remove', effect: { op: 'remove' } },
  { chord: 'Delete', command: 'remove', effect: { op: 'remove' } },
  { chord: 'Tab', command: 'indent', effect: { op: 'move', source: 'self', target: 'prevSibling', mode: 'child' } },
  { chord: 'Shift+Tab', command: 'outdent', effect: { op: 'move', source: 'self', target: 'parent', mode: 'sibling-after' } },
  { chord: 'mod+z', command: 'undo', effect: { op: 'undo' } },
  { chord: 'mod+shift+z', command: 'redo', effect: { op: 'redo' } },
  { chord: 'mod+y', command: 'redo', effect: { op: 'redo' } },
  { chord: 'mod+shift+v', command: 'paste-child', effect: { op: 'paste', source: 'self', mode: 'child' } },
]

export function slideTreeEventFromKeyboard(
  data: NormalizedData,
  id: string,
  event: KeyboardEvent,
): UiEvent | null {
  const isOutdent = matches(event, 'Shift+Tab')
  const isIndent = !isOutdent && matches(event, 'Tab')
  if (!isIndent && !isOutdent) return null

  const targetId = isOutdent ? parentOf(data, id) : previousSibling(data, id)
  if (!targetId) return null

  return {
    type: 'move',
    id,
    targetId,
    mode: isOutdent ? 'sibling-after' : 'child',
  }
}

const slideEventHandlers: Partial<Record<UiEvent['type'], SlideEventHandler>> = {
  copy: (event, context) => {
    if (event.type !== 'copy') return false
    copySlides(context.crud, selectedEventIds(context.data, event.id), event.event)
    return true
  },
  cut: (event, context) => {
    if (event.type !== 'cut') return false
    cutSlides(context.crud, selectedEventIds(context.data, event.id), event.event)
    return true
  },
  remove: (event, context) => {
    if (event.type !== 'remove') return false
    removeSlides(context.crud, selectedEventIds(context.data, event.id))
    return true
  },
  move: (event, context) => {
    if (event.type !== 'move') return false
    const ids = selectedEventIds(context.data, event.id)
    return ids.length > 1
      ? moveSlides(context.crud, ids, event.targetId, event.mode, context.data)
      : false
  },
}

export function dispatchSlideEvent(event: UiEvent, context: SlideEventContext) {
  if (slideEventHandlers[event.type]?.(event, context)) return
  context.fallback(event)
}

export function updateSlideText(crud: SlideCrud, slideId: string, next: { title: string; body: string }) {
  const doc = crud.snapshot()
  const titleNode = propNode(doc, slideId, 'title')
  const bodyNode = propNode(doc, slideId, 'body')
  if (titleNode && titleNode.value !== next.title) crud.update(titleNode.id, next.title)
  if (bodyNode && bodyNode.value !== next.body) crud.update(bodyNode.id, next.body)
}

function copySlides(crud: SlideCrud, ids: string[], event?: ClipboardEvent) {
  const batch = ids.length > 1 ? ids : ids.slice(0, 1)
  if (batch.length === 0) return
  const values = batch.length > 1 ? crud.copyMany(batch) : [crud.copy(batch[0]!)]
  writeClipboard(values, event)
}

function cutSlides(crud: SlideCrud, ids: string[], event?: ClipboardEvent) {
  const batch = siblingBatch(normalizeDeck(crud.snapshot()), ids)
  if (batch.length === 0) return
  const values = batch.map((id) => crud.read(id) as JsonValue)
  if (batch.length > 1) crud.cutMany(batch)
  else crud.cut(batch[0]!)
  writeClipboard(values, event)
}

function removeSlides(crud: SlideCrud, ids: string[]) {
  const batch = siblingBatch(normalizeDeck(crud.snapshot()), ids)
  if (batch.length === 0) return
  if (batch.length > 1) crud.deleteMany(batch)
  else crud.delete(batch[0]!)
}

function moveSlides(
  crud: SlideCrud,
  ids: string[],
  targetId: string,
  mode: 'child' | 'sibling-after' | 'sibling-before',
  data: NormalizedData,
): boolean {
  const batch = siblingBatch(data, ids).filter((id) => id !== targetId)
  if (batch.length === 0) return false
  let target = targetId
  for (const id of batch) {
    const value = crud.read(id) as JsonValue
    let result: OperationResult
    if (mode === 'child') result = crud.appendChild(targetId, value)
    else if (mode === 'sibling-before') result = crud.insertBefore(target, value)
    else result = crud.insertAfter(target, value)
    if (!result.ok) return false
    crud.delete(id)
    if (result.focusNodeId) target = result.focusNodeId
  }
  return true
}

function writeClipboard(values: JsonValue[], event?: ClipboardEvent) {
  const clipboard = event?.clipboardData
  if (!clipboard) return
  const payload = values.length === 1 ? values[0] : values
  const titles = values.map((value) => {
    if (typeof value === 'object' && value && 'title' in value) return String(value.title)
    return ''
  })
  clipboard.setData('application/x-p-headless+json', JSON.stringify(payload))
  clipboard.setData('text/plain', titles.join('\n'))
  event.preventDefault()
}

import { parseChord } from './shortcutChord'

export type ChordScope = 'root' | 'item'
export type ChordKind = 'key' | 'mouse'

export type ChordModifiers = {
  mod?: true
  shift?: true
  alt?: true
  ctrl?: true
  meta?: true
}

export type ParsedChordExtended = {
  scope: ChordScope
  kind: ChordKind
  eventType: string
  modifiers: ChordModifiers
}

const MOUSE_EVENT_TYPES = new Set([
  'click',
  'dblclick',
  'contextmenu',
  'pointerdown',
  'pointerup',
  'mousedown',
  'mouseup',
  'wheel',
  'dragstart',
  'dragend',
  'drop',
])

const SCOPES: ReadonlySet<ChordScope> = new Set<ChordScope>(['root', 'item'])

export const parseChordExtended = (
  chord: string,
  opts: { isMac?: boolean } = {},
): ParsedChordExtended => {
  let scope: ChordScope = 'root'
  let body = chord
  const colon = chord.indexOf(':')
  if (colon !== -1) {
    const head = chord.slice(0, colon).toLowerCase()
    if (SCOPES.has(head as ChordScope)) {
      scope = head as ChordScope
      body = chord.slice(colon + 1)
    }
  }

  const lastPlus = body.lastIndexOf('+')
  const rawType = lastPlus === -1 ? body : body.slice(lastPlus + 1) || '+'
  const modPart = lastPlus === -1 ? '' : body.slice(0, lastPlus)
  const lower = rawType.toLowerCase()
  const isMouse = MOUSE_EVENT_TYPES.has(lower)

  const parsed = parseChord(
    [...modPart.split('+').filter(Boolean), isMouse ? 'Click' : rawType].join('+'),
    opts,
  )
  const modifiers: ChordModifiers = {}
  if (parsed.ctrl) modifiers.ctrl = true
  if (parsed.alt) modifiers.alt = true
  if (parsed.meta) modifiers.meta = true
  if (parsed.shift) modifiers.shift = true

  return {
    scope,
    kind: isMouse ? 'mouse' : 'key',
    eventType: isMouse ? lower : parsed.key,
    modifiers,
  }
}

export const matchEventToChord = (
  event: KeyboardEvent | MouseEvent | PointerEvent,
  chord: string,
  opts?: { isMac?: boolean },
): boolean => {
  const parsed = parseChordExtended(chord, opts)
  const modifiers = parsed.modifiers
  if (Boolean(event.ctrlKey) !== Boolean(modifiers.ctrl)) return false
  if (Boolean(event.altKey) !== Boolean(modifiers.alt)) return false
  if (Boolean(event.metaKey) !== Boolean(modifiers.meta)) return false
  if (Boolean(event.shiftKey) !== Boolean(modifiers.shift)) return false

  if (parsed.kind === 'mouse') return event.type === parsed.eventType
  return (event as KeyboardEvent).key === parsed.eventType
}

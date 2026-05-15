import { matches, parseShortcut } from '@interactive-os/keyboard'

export type Chord = string

export type ParsedChord = {
  key: string
  ctrl?: true
  alt?: true
  meta?: true
  shift?: true
}

const cache = new Map<string, ParsedChord>()

const concreteMod = (opts: { isMac?: boolean } = {}): 'Control' | 'Meta' => {
  if (typeof opts.isMac === 'boolean') return opts.isMac ? 'Meta' : 'Control'
  if (typeof navigator === 'undefined') return 'Control'
  return /Mac|iPod|iPhone|iPad/i.test(navigator.platform) ? 'Meta' : 'Control'
}

const toKeyboardShortcut = (chord: Chord, opts: { isMac?: boolean } = {}): string => {
  const lastPlus = chord.lastIndexOf('+')
  const rawKey = lastPlus === -1 ? chord : chord.slice(lastPlus + 1) || '+'
  const modPart = lastPlus === -1 ? '' : chord.slice(0, lastPlus)
  const modifiers = modPart
    .split('+')
    .filter(Boolean)
    .map((part) => {
      const token = part.toLowerCase()
      if (token === 'mod' || token === '$mod') return concreteMod(opts)
      if (token === 'ctrl' || token === 'control') return 'Control'
      if (token === 'alt' || token === 'option') return 'Alt'
      if (token === 'meta' || token === 'cmd' || token === 'command') return 'Meta'
      if (token === 'shift') return 'Shift'
      if (token === 'altgraph') return 'AltGraph'
      return part
    })
  const key = rawKey === 'Space' ? 'Space' : rawKey === '+' ? 'Plus' : rawKey
  return [...modifiers, key].join('+')
}

export const parseChord = (chord: Chord, opts: { isMac?: boolean } = {}): ParsedChord => {
  const cacheKey = typeof opts.isMac === 'boolean' ? `${opts.isMac}:${chord}` : chord
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const [shortcut] = parseShortcut(toKeyboardShortcut(chord, opts))
  if (!shortcut) throw new Error(`Invalid chord: "${chord}"`)

  const result: ParsedChord = { key: shortcut.key }
  if (shortcut.control) result.ctrl = true
  if (shortcut.alt) result.alt = true
  if (shortcut.meta) result.meta = true
  if (shortcut.shift) result.shift = true
  cache.set(cacheKey, result)
  return result
}

export const matchChord = (
  event: KeyboardEvent,
  chord: Chord,
  opts?: { isMac?: boolean },
): boolean => matches(event, toKeyboardShortcut(chord, opts))

export const matchAnyChord = (
  event: KeyboardEvent,
  chords: readonly Chord[],
  opts?: { isMac?: boolean },
): boolean => chords.some((chord) => matchChord(event, chord, opts))

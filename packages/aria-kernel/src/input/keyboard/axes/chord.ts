/**
 * Chord — tinykeys de facto string syntax.
 *
 *   "Escape" · "Shift+Tab" · "Meta+c" · "ArrowDown" · "Space" · "$mod+s"
 *
 * 형식: `[Modifier+]*Key`. Modifier ∈ {Shift, Control, Alt, Meta} (case-insensitive).
 * Key = KeyboardEvent.key 값 그대로 (대소문자 보존). `Space` alias = `" "`.
 * `$mod` magic = Mac → Meta, 그 외 → Control.
 *
 * 100% JSON serializable. devtools/문서/grep 가독.
 */

export type Chord = string

export type ParsedChord = {
  key: string
  ctrl?: true
  alt?: true
  meta?: true
  shift?: true
}

const SPACE = ' '

const detectMac = (): boolean => {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

const cache = new Map<string, ParsedChord>()

/**
 * parseChord — tinykeys string → ParsedChord. modifier 순서 무관, case-insensitive.
 *
 * `$mod` magic: Mac=Meta, 그 외=Control. opts.isMac 으로 override 가능 (test/SSR).
 *
 * 결과 캐시 (`Map<string, ParsedChord>`). opts 미지정 시 두 번째 호출부터 O(1).
 */
export const parseChord = (s: Chord, opts: { isMac?: boolean } = {}): ParsedChord => {
  if (!opts.isMac && cache.has(s)) return cache.get(s)!
  const result = parseChordImpl(s, opts)
  if (!opts.isMac) cache.set(s, result)
  return result
}

const parseChordImpl = (s: Chord, opts: { isMac?: boolean } = {}): ParsedChord => {
  const isMac = opts.isMac ?? detectMac()
  // 마지막 '+' 이후를 key 로 (그 자체가 key 인 '+' 케이스도 포함).
  const lastPlus = s.lastIndexOf('+')
  const key = lastPlus === -1 ? s : s.slice(lastPlus + 1) || '+'
  const modPart = lastPlus === -1 ? '' : s.slice(0, lastPlus + (key === '+' ? 0 : 0))
  const mods = new Set(
    modPart
      .split('+')
      .filter((p) => p.length > 0)
      .map((p) => p.toLowerCase()),
  )
  // $mod / mod 처리 — 둘 다 platform-aware modifier alias (Mac=meta, 기타=ctrl)
  if (mods.has('$mod') || mods.has('mod')) {
    mods.delete('$mod')
    mods.delete('mod')
    mods.add(isMac ? 'meta' : 'ctrl')
  }
  // ctrl/control 정규화
  if (mods.has('control')) {
    mods.delete('control')
    mods.add('ctrl')
  }

  const result: ParsedChord = { key: key === 'Space' ? SPACE : key }
  if (mods.has('ctrl'))  result.ctrl  = true
  if (mods.has('alt'))   result.alt   = true
  if (mods.has('meta'))  result.meta  = true
  if (mods.has('shift')) result.shift = true
  return result
}

/** matchChord — KeyboardEvent vs Chord. modifier flag 가 정확히 일치해야 함. */
export const matchChord = (e: KeyboardEvent, chord: Chord, opts?: { isMac?: boolean }): boolean => {
  const c = parseChord(chord, opts)
  return e.key === c.key
    && Boolean(e.ctrlKey)  === Boolean(c.ctrl)
    && Boolean(e.altKey)   === Boolean(c.alt)
    && Boolean(e.metaKey)  === Boolean(c.meta)
    && Boolean(e.shiftKey) === Boolean(c.shift)
}

/** matchAnyChord — KeyboardEvent 가 chord string 배열 중 하나라도 매치되는지. patterns 의 chord registry 매처. */
export const matchAnyChord = (e: KeyboardEvent, chords: readonly Chord[], opts?: { isMac?: boolean }): boolean =>
  chords.some((c) => matchChord(e, c, opts))

/* ------------------------------------------------------------------ *
 * Extended chord — key + mouse + scope prefix.                        *
 *                                                                     *
 *   'mod+shift+v'   · key                                             *
 *   'click'         · mouse (root scope, default)                     *
 *   'shift+click'   · mouse + modifier                                *
 *   'item:click'    · mouse with item scope                           *
 *   'root:keydown'  · explicit root scope (default 생략 가능)         *
 *                                                                     *
 * scope prefix: `'<scope>:'` 가 첫 토큰이면 scope, 나머지를 chord 로. *
 * mouse eventType: click·dblclick·contextmenu·pointerdown·pointerup·  *
 *   wheel·dragstart·drop. 그 외는 key 로 간주.                        *
 * ------------------------------------------------------------------ */

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
  eventType: string  // key: KeyboardEvent.key value, mouse: event type name
  modifiers: ChordModifiers
}

const MOUSE_EVENT_TYPES = new Set([
  'click', 'dblclick', 'contextmenu',
  'pointerdown', 'pointerup',
  'mousedown', 'mouseup',
  'wheel',
  'dragstart', 'dragend', 'drop',
])

const SCOPES: ReadonlySet<ChordScope> = new Set<ChordScope>(['root', 'item'])

/**
 * parseChordExtended — chord-string → ParsedChordExtended.
 *
 * scope prefix 우선 분리(`'item:click'` → scope=item, body='click'),
 * body 의 마지막 '+' 뒤를 eventType 으로, 앞을 modifier 토큰으로 파싱.
 * eventType 이 MOUSE_EVENT_TYPES 에 속하면 kind='mouse', 아니면 'key'.
 */
export const parseChordExtended = (s: string, opts: { isMac?: boolean } = {}): ParsedChordExtended => {
  const isMac = opts.isMac ?? detectMac()

  // scope prefix
  let scope: ChordScope = 'root'
  let body = s
  const colon = s.indexOf(':')
  if (colon !== -1) {
    const head = s.slice(0, colon).toLowerCase()
    if (SCOPES.has(head as ChordScope)) {
      scope = head as ChordScope
      body = s.slice(colon + 1)
    }
  }

  // split modifiers + eventType
  const lastPlus = body.lastIndexOf('+')
  const rawType = lastPlus === -1 ? body : body.slice(lastPlus + 1) || '+'
  const modPart = lastPlus === -1 ? '' : body.slice(0, lastPlus)
  const tokens = modPart
    .split('+')
    .filter((p) => p.length > 0)
    .map((p) => p.toLowerCase())

  const modifiers: ChordModifiers = {}
  for (const t of tokens) {
    if (t === 'mod' || t === '$mod') {
      if (isMac) modifiers.meta = true
      else modifiers.ctrl = true
    } else if (t === 'control' || t === 'ctrl') modifiers.ctrl = true
    else if (t === 'shift') modifiers.shift = true
    else if (t === 'alt' || t === 'option') modifiers.alt = true
    else if (t === 'meta' || t === 'cmd' || t === 'command') modifiers.meta = true
  }

  const lower = rawType.toLowerCase()
  const isMouse = MOUSE_EVENT_TYPES.has(lower)
  const eventType = isMouse ? lower : (rawType === 'Space' ? SPACE : rawType)

  return { scope, kind: isMouse ? 'mouse' : 'key', eventType, modifiers }
}

/**
 * matchEventToChord — KeyboardEvent 또는 MouseEvent/PointerEvent 가 chord-string 과 매치되는지.
 *
 * scope 검사는 호출자 책임(scope 는 parsed 결과로만 노출). modifier flag 정확 일치.
 * 마우스 이벤트는 type 비교, 키 이벤트는 key 비교.
 */
export const matchEventToChord = (
  event: KeyboardEvent | MouseEvent | PointerEvent,
  chord: string,
  opts?: { isMac?: boolean },
): boolean => {
  const p = parseChordExtended(chord, opts)
  const m = p.modifiers
  const ctrlOk  = Boolean(event.ctrlKey)  === Boolean(m.ctrl)
  const altOk   = Boolean(event.altKey)   === Boolean(m.alt)
  const metaOk  = Boolean(event.metaKey)  === Boolean(m.meta)
  const shiftOk = Boolean(event.shiftKey) === Boolean(m.shift)
  if (!ctrlOk || !altOk || !metaOk || !shiftOk) return false

  if (p.kind === 'mouse') return event.type === p.eventType
  // key
  return (event as KeyboardEvent).key === p.eventType
}

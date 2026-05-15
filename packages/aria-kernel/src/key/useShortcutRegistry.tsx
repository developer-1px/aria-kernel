/**
 * useShortcutRegistry — page-level shortcut registry on top of `onShortcut`.
 *
 * `axis.meta.keys` 가 패턴 단의 키 enum 이라면, 이건 page 단 enum.
 * 모든 등록된 binding 은 cheatsheet 로 enumerate 가능하며 (`?` UI),
 * 같은 normalized chord × scope 충돌은 register 시점에 throw.
 *
 * Shortcut matching and normalization come from `@interactive-os/keyboard`.
 *
 * @example
 * function Page() {
 *   const reg = useShortcutRegistry()
 *   reg.useRegister({ chord: 'mod+s', scope: 'page', label: 'Save', when: () => dirty, run: save })
 *   reg.useRegister({ chord: 'mod+k', scope: 'page', label: 'Command palette', run: openPalette })
 *   const groups = reg.useCheatsheet()
 * }
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { parseShortcut, stringifyShortcut } from '@interactive-os/keyboard'

import { onShortcut } from './useShortcut'

export type Scope = string

export interface ShortcutEntry {
  /** `@interactive-os/keyboard` shortcut string. `Mod+s`, `Shift+/`, `Escape` 등 */
  chord: string
  /** group key for cheatsheet (e.g. 'page', 'dialog-modal', 'table') */
  scope: Scope
  /** human label for cheatsheet `?` UI */
  label: string
  /** dynamic enable predicate. false 면 cheatsheet 에서 제외 + run skip */
  when?: () => boolean
  /** match 시 호출 */
  run: (e: KeyboardEvent) => void
}

export interface CheatsheetBinding {
  chord: string
  label: string
  scope: Scope
}

export interface CheatsheetGroup {
  scope: Scope
  bindings: readonly CheatsheetBinding[]
}

interface RegistryStore {
  entries: Map<string, ShortcutEntry>
  listeners: Set<() => void>
  subscribe: (l: () => void) => () => void
  notify: () => void
}

const createStore = (): RegistryStore => {
  const listeners = new Set<() => void>()
  return {
    entries: new Map(),
    listeners,
    subscribe(l) { listeners.add(l); return () => { listeners.delete(l) } },
    notify() { listeners.forEach((l) => l()) },
  }
}

const normalizeChord = (spec: string): string => {
  return parseShortcut(spec)
    .map((shortcut) => stringifyShortcut({
      key: shortcut.key,
      ctrlKey: shortcut.control,
      altKey: shortcut.alt,
      metaKey: shortcut.meta,
      shiftKey: shortcut.shift,
      modifierState: shortcut.altGraph ? { AltGraph: true } : undefined,
    }))
    .join(' ')
}

const RegistryCtx = createContext<RegistryStore | null>(null)

/**
 * ShortcutRegistryProvider — page 루트에 한 번 mount.
 * 없으면 useShortcutRegistry() 가 stand-alone(컴포넌트 로컬 store) 모드.
 */
export function ShortcutRegistryProvider({ children }: { children: ReactNode }) {
  const store = useMemo(createStore, [])
  return <RegistryCtx.Provider value={store}>{children}</RegistryCtx.Provider>
}

let __idSeq = 0
const nextId = () => `shortcut-${++__idSeq}`

export interface ShortcutRegistry {
  /**
   * useRegister — chord 를 register. component unmount 시 자동 해제.
   * 같은 scope × normalized chord conflict 시 throw.
   * 반드시 컴포넌트 render top-level 에서 호출 (rule of hooks).
   */
  useRegister: (entry: ShortcutEntry) => void
  /** snapshot grouped by scope, filtered by `when()`. store 변경 시 re-render */
  useCheatsheet: () => readonly CheatsheetGroup[]
}

/**
 * useShortcutRegistry — page-level shortcut registry hook.
 *
 * Provider 가 있으면 그 store 를, 없으면 컴포넌트 로컬 store.
 */
export function useShortcutRegistry(): ShortcutRegistry {
  const ctx = useContext(RegistryCtx)
  const localRef = useRef<RegistryStore | null>(null)
  if (!ctx && !localRef.current) localRef.current = createStore()
  const store = ctx ?? localRef.current!

  return useMemo<ShortcutRegistry>(() => ({
    useRegister: (entry) => useRegisterEntry(store, entry),
    useCheatsheet: () => useCheatsheetSnapshot(store),
  }), [store])
}

function useRegisterEntry(store: RegistryStore, entry: ShortcutEntry): void {
  const idRef = useRef<string | null>(null)
  if (!idRef.current) idRef.current = nextId()
  const id = idRef.current

  const entryRef = useRef(entry)
  entryRef.current = entry

  const normalized = normalizeChord(entry.chord)

  useEffect(() => {
    for (const [eid, e] of store.entries) {
      if (eid === id) continue
      if (e.scope === entry.scope && normalizeChord(e.chord) === normalized) {
        throw new Error(
          `[useShortcutRegistry] conflict: chord "${entry.chord}" already registered in scope "${entry.scope}" (label="${e.label}")`,
        )
      }
    }
    // live wrapper — always reads latest entry (when/label/run) via ref
    const live: ShortcutEntry = {
      get chord() { return entryRef.current.chord },
      get scope() { return entryRef.current.scope },
      get label() { return entryRef.current.label },
      get when() { return entryRef.current.when },
      get run() { return entryRef.current.run },
    } as ShortcutEntry
    store.entries.set(id, live)
    store.notify()
    const off = onShortcut(entry.chord, (e) => {
      const cur = entryRef.current
      if (cur.when && !cur.when()) return
      cur.run(e)
    })
    return () => {
      off()
      store.entries.delete(id)
      store.notify()
    }
  }, [store, id, entry.chord, entry.scope, normalized])
}

function useCheatsheetSnapshot(store: RegistryStore): readonly CheatsheetGroup[] {
  const [, setTick] = useState(0)
  useEffect(() => {
    // initial sync — register effects in sibling components may have notified before
    // this subscribe attached. Force one re-read.
    setTick((t) => t + 1)
    return store.subscribe(() => setTick((t) => t + 1))
  }, [store])
  return buildCheatsheet(store)
}

function buildCheatsheet(store: RegistryStore): readonly CheatsheetGroup[] {
  const byScope = new Map<Scope, CheatsheetBinding[]>()
  for (const e of store.entries.values()) {
    if (e.when && !e.when()) continue
    const arr = byScope.get(e.scope) ?? []
    arr.push({ chord: e.chord, label: e.label, scope: e.scope })
    byScope.set(e.scope, arr)
  }
  return [...byScope.entries()].map(([scope, bindings]) => ({ scope, bindings }))
}

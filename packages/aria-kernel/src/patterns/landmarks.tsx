/**
 * useLandmarks + <Landmark> — ARIA landmark registry.
 * https://www.w3.org/TR/wai-aria-1.2/#landmark_roles
 *
 *   <LandmarksProvider>
 *     <Landmark role="navigation" label="Primary">…</Landmark>
 *     <Landmark role="main" label="Editor">…</Landmark>
 *   </LandmarksProvider>
 *
 *   const landmarks = useLandmarks()
 *   // [{ role, label, ref }, …] — Cmd+F6 cycler consumes this snapshot.
 *
 * W3C landmark role vocabulary only:
 *   banner | complementary | contentinfo | form | main | navigation | region | search
 *
 * Registration order = DOM order (effects run parent→child for sibling subtrees;
 * we sort by document position on read to be robust to mount order).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

export type LandmarkRole =
  | 'banner'
  | 'complementary'
  | 'contentinfo'
  | 'form'
  | 'main'
  | 'navigation'
  | 'region'
  | 'search'

export interface LandmarkEntry {
  id: string
  role: LandmarkRole
  label: string
  ref: RefObject<HTMLElement | null>
}

interface LandmarkRegistry {
  registerRef: { current: (entry: LandmarkEntry) => () => void }
  snapshot: ReadonlyArray<LandmarkEntry>
}

const LandmarksContext = createContext<LandmarkRegistry | null>(null)

export function LandmarksProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ReadonlyArray<LandmarkEntry>>([])

  const registerRef = useRef((entry: LandmarkEntry) => {
    setEntries((prev) => [...prev, entry])
    return () => {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    }
  })

  const value = useMemo<LandmarkRegistry>(
    () => ({ registerRef, snapshot: entries }),
    [entries],
  )

  return <LandmarksContext.Provider value={value}>{children}</LandmarksContext.Provider>
}

/** Snapshot of registered landmarks, ordered by DOM position. */
export function useLandmarks(): ReadonlyArray<LandmarkEntry> {
  const ctx = useContext(LandmarksContext)
  const snapshot = ctx?.snapshot
  return useMemo(() => {
    if (!snapshot) return []
    const list = snapshot.slice()
    list.sort((a, b) => {
      const ae = a.ref.current
      const be = b.ref.current
      if (!ae || !be) return 0
      const pos = ae.compareDocumentPosition(be)
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
    return list
  }, [snapshot])
}

export interface LandmarkProps {
  role: LandmarkRole
  label: string
  id?: string
  children?: ReactNode
}

let landmarkUid = 0
const nextId = () => `landmark-${++landmarkUid}`

/**
 * Wrapper that emits a landmark element with role + aria-label and
 * registers itself into the surrounding `<LandmarksProvider>`.
 */
export function Landmark({ role, label, id, children }: LandmarkProps) {
  const ctx = useContext(LandmarksContext)
  const ref = useRef<HTMLElement | null>(null)
  const idRef = useRef<string>(id ?? nextId())

  useEffect(() => {
    if (!ctx) return
    const unregister = ctx.registerRef.current({
      id: idRef.current,
      role,
      label,
      ref,
    })
    return unregister
    // ctx ref is stable; only re-register when role/label change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, label])

  // Explicit role attribute — consumers wrap their own native tag if they want
  // implicit-role semantics. Kernel stays role-vocabulary pure.
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      id={idRef.current}
      role={role}
      aria-label={label}
      tabIndex={-1}
    >
      {children}
    </div>
  )
}

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'

/**
 * CSS scroll-snap 컨테이너 + scroll → URL hash 동기화.
 * URL → scroll 은 브라우저 native anchor 동작에만 위임 (JS scrollIntoView 없음).
 * scroll → URL 은 IntersectionObserver 로 가장 잘 보이는 [id] 섹션을
 * `history.replaceState` 갱신. 첫 자식은 hash 비움.
 */
export function SnapPage({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollToHash(ref)
  return (
    <div
      ref={ref}
      className={`md:h-screen md:snap-y md:snap-mandatory md:overflow-y-scroll overscroll-contain ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

function useScrollToHash(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const sections = Array.from(root.querySelectorAll<HTMLElement>(':scope > [id]'))
    const firstId = (root.firstElementChild as HTMLElement | null)?.id || sections[0]?.id || ''
    if (sections.length === 0) return

    const sync = () => {
      const rootRect = root.getBoundingClientRect()
      const center = rootRect.top + rootRect.height / 2
      let bestId = ''
      let bestDist = Infinity
      for (const s of sections) {
        const r = s.getBoundingClientRect()
        const sectionCenter = r.top + r.height / 2
        const dist = Math.abs(sectionCenter - center)
        if (dist < bestDist) {
          bestDist = dist
          bestId = s.id
        }
      }
      const nextHash = bestId === firstId ? '' : bestId
      if (nextHash === activeHash) return
      const url = nextHash
        ? `${window.location.pathname}${window.location.search}#${nextHash}`
        : `${window.location.pathname}${window.location.search}`
      window.history.replaceState(null, '', url)
      writeActive(nextHash)
    }

    root.addEventListener('scrollend', sync)
    return () => root.removeEventListener('scrollend', sync)
  }, [ref])
}

let activeHash = typeof window === 'undefined' ? '' : window.location.hash.slice(1)
const listeners = new Set<() => void>()

function writeActive(next: string) {
  if (next === activeHash) return
  activeHash = next
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => writeActive(window.location.hash.slice(1)))
}

export function useActiveHash() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => activeHash,
    () => '',
  )
}

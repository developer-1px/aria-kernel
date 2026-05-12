import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { matchChord } from '../../input/keyboard/axes/chord'

/**
 * useSpatialNavigation — children 자유 JSX 컴포넌트(Toolbar/Menubar/DataGrid/Treegrid 등)의
 * APG roving tabindex. **시각 좌표 기반** 이동 — `getBoundingClientRect()` 로 다음 element 결정.
 *
 * W3C `spatnav` (Spatial Navigation, https://drafts.csswg.org/css-nav-1/) 정렬:
 * Arrow 방향의 90° cone 내 후보 중 centroid 거리 최소 element 선택. row-reverse·grid-areas·
 * RTL·transform·portal 등 DOM 순서 ≠ 시각 순서인 케이스에서도 "보이는 대로" 이동.
 *
 * 데이터 모델이 있는 컬렉션은 useRovingTabIndex(logical) — 관계 그래프 기반 — 를 쓴다.
 */

const TABBABLE =
  'button:not([disabled]):not([tabindex="-2"]),[tabindex]:not([tabindex="-1"]):not([tabindex="-2"]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])'

export interface UseSpatialNavigationOptions {
  /** Arrow 활성 축 — `'horizontal'`(기본) | `'vertical'` | `'both'`. */
  orientation?: 'horizontal' | 'vertical' | 'both'
  /** Home/End 키 처리 (기본 `true`). */
  homeEnd?: boolean
  /** 명시적 item 셀렉터. tabindex=-1 도 포함해서 발견 가능 (Treegrid/Listbox 류). */
  itemSelector?: string
}

type Dir = 'left' | 'right' | 'up' | 'down'

/** 두 rect 중심 사이 거리. dir 방향 cone(90°) 안에 있을 때만 유효. */
function distanceInDirection(from: DOMRect, to: DOMRect, dir: Dir): number {
  const fx = (from.left + from.right) / 2
  const fy = (from.top + from.bottom) / 2
  const tx = (to.left + to.right) / 2
  const ty = (to.top + to.bottom) / 2
  const dx = tx - fx
  const dy = ty - fy
  // 90° cone: 주축 변위가 부축 변위보다 크고 부호가 맞아야 함
  const inCone =
    (dir === 'right' && dx > 0 && Math.abs(dx) >= Math.abs(dy)) ||
    (dir === 'left'  && dx < 0 && Math.abs(dx) >= Math.abs(dy)) ||
    (dir === 'down'  && dy > 0 && Math.abs(dy) >= Math.abs(dx)) ||
    (dir === 'up'    && dy < 0 && Math.abs(dy) >= Math.abs(dx))
  if (!inCone) return Infinity
  return Math.hypot(dx, dy)
}

function pickInDirection(items: HTMLElement[], current: HTMLElement, dir: Dir): HTMLElement | null {
  const cur = current.getBoundingClientRect()
  let best: HTMLElement | null = null
  let bestDist = Infinity
  for (const el of items) {
    if (el === current) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue // hidden / collapsed
    const d = distanceInDirection(cur, r, dir)
    if (d < bestDist) { bestDist = d; best = el }
  }
  return best
}

const KEY_TO_DIR: Record<string, Dir | undefined> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
}

const ALLOWED_DIRS: Record<NonNullable<UseSpatialNavigationOptions['orientation']>, Set<Dir>> = {
  horizontal: new Set(['left', 'right']),
  vertical:   new Set(['up', 'down']),
  both:       new Set(['left', 'right', 'up', 'down']),
}

const DIR_TO_KEY: Record<Dir, string> = {
  left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
}

/**
 * useSpatialNavigation 이 흡수하는 키 — SSOT.
 * orientation 별 허용 방향 (ALLOWED_DIRS) + homeEnd 옵션을 그대로 derive.
 */
export const spatialNavigationKeys = (
  opts: { orientation?: UseSpatialNavigationOptions['orientation']; homeEnd?: boolean } = {},
): readonly string[] => {
  const orientation = opts.orientation ?? 'horizontal'
  const homeEnd = opts.homeEnd ?? true
  const arrows = [...ALLOWED_DIRS[orientation]].map((d) => DIR_TO_KEY[d])
  return homeEnd ? [...arrows, 'Home', 'End'] : arrows
}

/**
 * useSpatialNavigation — W3C CSS Spatial Navigation 기반 roving tabindex.
 * **시각 좌표 기반** 이동 — `getBoundingClientRect()` 로 다음 element 결정.
 *
 * 데이터 그래프가 없는 자유 JSX 배치(Toolbar/Menubar/DataGrid/Treegrid 등) 에서 사용.
 * 관계 그래프가 있는 컬렉션은 {@link useRovingTabIndex} (APG canonical) 을 쓴다.
 *
 * @param externalRef - container ref. 생략 시 내부 ref 반환
 * @param options - {@link UseSpatialNavigationOptions} — orientation/homeEnd/itemSelector
 *
 * @example
 * const { ref, onKeyDown } = useSpatialNavigation<HTMLDivElement>(null, { orientation: 'horizontal' })
 * return <div ref={ref} role="toolbar" onKeyDown={onKeyDown}>...</div>
 */
export function useSpatialNavigation<T extends HTMLElement = HTMLDivElement>(
  externalRef?: RefObject<T | null> | null,
  { orientation = 'horizontal', homeEnd = true, itemSelector }: UseSpatialNavigationOptions = {},
) {
  const ownRef = useRef<T>(null)
  const effectiveRef = externalRef ?? ownRef
  const selector = itemSelector ?? TABBABLE

  useEffect(() => {
    const root = effectiveRef.current
    if (!root) return
    const snap = () => Array.from(root.querySelectorAll<HTMLElement>(selector))
    const items = snap()
    if (items.length > 0 && !items.some((el) => el.tabIndex === 0)) items[0].tabIndex = 0
    items.forEach((el) => { if (el.tabIndex !== 0) el.tabIndex = -1 })
    const handler = (ev: FocusEvent) => {
      const list = snap()
      const t = ev.target as HTMLElement
      if (!list.includes(t)) return
      list.forEach((el) => { el.tabIndex = el === t ? 0 : -1 })
    }
    root.addEventListener('focusin', handler)
    return () => root.removeEventListener('focusin', handler)
  }, [effectiveRef])

  const onKeyDown = (e: KeyboardEvent<T>) => {
    const root = effectiveRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>(selector))
    if (items.length === 0) return
    const allowed = ALLOWED_DIRS[orientation]
    let target: HTMLElement | null = null
    const dir = KEY_TO_DIR[e.key]
    if (dir && allowed.has(dir)) {
      const current = (document.activeElement as HTMLElement | null) ?? items[0]
      target = pickInDirection(items, current, dir)
    } else if (homeEnd && matchChord(e as unknown as globalThis.KeyboardEvent, 'Home')) {
      target = items[0] ?? null
    } else if (homeEnd && matchChord(e as unknown as globalThis.KeyboardEvent, 'End')) {
      target = items[items.length - 1] ?? null
    }
    if (target) { e.preventDefault(); target.focus() }
  }

  return { onKeyDown, ref: effectiveRef }
}

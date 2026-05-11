/**
 * Palette SSOT — 각 route 의 `staticData.palette` 를 router 에서 수집.
 * SidebarNav · Landing · 기타 검색 UI 는 모두 이 함수를 거친다.
 *
 * 정렬은 **사용자 도달 거리 순** — 직접 소비하는 surface 가 먼저, 내부 building
 * block 이 다음, demo (Apps) 가 마지막.
 */
import type { useRouter } from '@tanstack/react-router'

export interface PaletteEntry {
  id: string
  label: string
  to: string
  params?: Record<string, string>
  category?: string
  sub?: string
}

type RouterLike = ReturnType<typeof useRouter>

/** 그룹 순서 — 사용자 도달 거리 (가까운 → 먼, Apps 는 demo 라 맨 끝). */
export const PALETTE_GROUP_ORDER = [
  'Recipes',         // 사용자가 직접 쓰는 ARIA recipe (patterns · wrappers · lab)
  'Vocabulary',      // kernel 소비 시 마주치는 어휘 (data · uievents)
  'Building blocks', // 내부 메커니즘 (axes · roving · gesture · key)
  'Meta',            // 옵션/메타 (spec · coverage · resource · docs)
  'Apps',            // demo 제품 — 시연용, 맨 아래
] as const

export type PaletteGroup = (typeof PALETTE_GROUP_ORDER)[number] | string

/** path → 그룹. route 가 explicit `category` 주면 우선. */
export const paletteCategory = (e: PaletteEntry): PaletteGroup => {
  if (e.category) return e.category
  const segs = e.to.split('/').filter((s) => s && s !== '$')
  if (segs[0] === 'apps') {
    if (segs.length <= 2) return 'Apps'
    const app = segs[1]
    return app.charAt(0).toUpperCase() + app.slice(1)
  }
  const top = segs[0]
  if (top === 'patterns' || top === 'wrappers' || top === 'lab') return 'Recipes'
  if (top === 'data' || top === 'uievents') return 'Vocabulary'
  if (top === 'axes' || top === 'roving' || top === 'gesture' || top === 'key') return 'Building blocks'
  if (top === 'spec' || top === 'coverage' || top === 'resource' || top === 'docs') return 'Meta'
  return 'Meta'
}

/** route 안 항목 정렬 우선순위 — 카테고리 안에서의 label 순서. */
const ITEM_ORDER: Record<string, readonly string[]> = {
  Recipes: ['Patterns', 'Wrappers', 'Lab'],
  Vocabulary: ['Data', 'UiEvents'],
  'Building blocks': ['Axes', 'Roving', 'Gesture', 'Key'],
  Meta: ['Spec', 'Coverage', 'Resource', 'Docs'],
}

const itemRank = (group: string, label: string) => {
  const order = ITEM_ORDER[group]
  if (!order) return Number.MAX_SAFE_INTEGER
  const i = order.findIndex((o) => label.startsWith(o))
  return i === -1 ? Number.MAX_SAFE_INTEGER : i
}

const groupRank = (g: string) => {
  const i = (PALETTE_GROUP_ORDER as readonly string[]).indexOf(g)
  return i === -1 ? PALETTE_GROUP_ORDER.length : i
}

export function collectPalette(router: RouterLike): PaletteEntry[] {
  const out: PaletteEntry[] = []
  for (const [id, r] of Object.entries(router.routesById ?? {})) {
    const p = (r as { options?: { staticData?: { palette?: Omit<PaletteEntry, 'id'> } } })
      .options?.staticData?.palette
    if (p) out.push({ id, ...p })
  }
  return out.sort((a, b) => {
    const ga = groupRank(paletteCategory(a))
    const gb = groupRank(paletteCategory(b))
    if (ga !== gb) return ga - gb
    const ra = itemRank(paletteCategory(a), a.label)
    const rb = itemRank(paletteCategory(b), b.label)
    if (ra !== rb) return ra - rb
    return a.label.localeCompare(b.label)
  })
}

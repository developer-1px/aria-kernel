/**
 * resolveNavigate — `{type:'navigate', dir}` intent 를 next focus id 로 해석.
 *
 * PRD #38 phase 3: axis 본체가 id 산수를 캡슐화하던 KeyHandler 를 제거하고,
 * 방향 의도 (`dir`) 만 emit. reducer 가 data + 현재 focus + dir 로 next id 계산.
 */
import type { NavigateDir, NormalizedData } from '../intent/events'
import { ROOT, getChildren } from '../intent/events'
import { siblingsOf, parentOf } from '../input/keyboard/axes/index'
import { visibleEnabled } from '../input/keyboard/axes/_visibleFlat'
import { gridCoord } from '../input/keyboard/axes/gridNavigate'

const enabledOf = (d: NormalizedData, ids: readonly string[]): string[] =>
  ids.filter((id) => !d.entities[id]?.disabled)

const mod = (n: number, m: number) => ((n % m) + m) % m

/**
 * focus + dir → next id. resolve 못하면 null (no-op).
 * `from` 인자가 주어지면 그 id 를 기준으로, 없으면 `meta.focus` 사용.
 */
export const resolveNavigate = (d: NormalizedData, dir: NavigateDir, from?: string): string | null => {
  const focus = from ?? d.meta?.focus
  if (!focus) return null

  // sibling-based (vertical/horizontal 단일 부모 단)
  if (dir === 'next' || dir === 'prev' || dir === 'start' || dir === 'end') {
    const sibs = enabledOf(d, siblingsOf(d, focus))
    if (!sibs.length) return null
    const i = Math.max(0, sibs.indexOf(focus))
    if (dir === 'next')  return sibs[mod(i + 1, sibs.length)]
    if (dir === 'prev')  return sibs[mod(i - 1, sibs.length)]
    if (dir === 'start') return sibs[0]
    if (dir === 'end')   return sibs[sibs.length - 1]
  }

  // visible-flat (tree collapse 반영)
  if (dir === 'visibleNext' || dir === 'visiblePrev') {
    const flat = visibleEnabled(d)
    if (!flat.length) return null
    const i = flat.indexOf(focus)
    if (i < 0) return null
    if (dir === 'visibleNext') return flat[Math.min(flat.length - 1, i + 1)] ?? null
    if (dir === 'visiblePrev') return flat[Math.max(0, i - 1)] ?? null
  }

  if (dir === 'firstChild') {
    const kids = enabledOf(d, d.relationships[focus] ?? [])
    return kids[0] ?? null
  }

  if (dir === 'toParent') {
    const p = parentOf(d, focus)
    return p && p !== ROOT ? p : null
  }

  // grid 2D 좌표 (phase 3b)
  if (dir === 'gridLeft' || dir === 'gridRight' || dir === 'gridUp' || dir === 'gridDown'
      || dir === 'rowStart' || dir === 'rowEnd' || dir === 'gridStart' || dir === 'gridEnd') {
    const c = gridCoord(d, focus)
    if (!c) return null
    if (dir === 'gridLeft')   return c.colIdx > 0 ? c.cellsInRow[c.colIdx - 1] : null
    if (dir === 'gridRight')  return c.colIdx < c.cellsInRow.length - 1 ? c.cellsInRow[c.colIdx + 1] : null
    if (dir === 'gridUp' || dir === 'gridDown') {
      const tRow = c.rowIdx + (dir === 'gridDown' ? 1 : -1)
      if (tRow < 0 || tRow >= c.rows.length) return null
      const cells = getChildren(d, c.rows[tRow])
      return cells.length ? cells[Math.min(c.colIdx, cells.length - 1)] : null
    }
    if (dir === 'rowStart') return c.cellsInRow[0] ?? null
    if (dir === 'rowEnd')   return c.cellsInRow[c.cellsInRow.length - 1] ?? null
    if (dir === 'gridStart') {
      const first = getChildren(d, c.rows[0])
      return first[0] ?? null
    }
    if (dir === 'gridEnd') {
      const last = getChildren(d, c.rows[c.rows.length - 1])
      return last[last.length - 1] ?? null
    }
  }

  // pageNext/pagePrev 는 step 파라미터 필요 — phase 3c.
  return null
}

/**
 * resolveNavigate — `{type:'navigate', dir}` intent 를 next focus id 로 해석.
 *
 * PRD #38 phase 3: axis 본체가 id 산수를 캡슐화하던 KeyHandler 를 제거하고,
 * 방향 의도 (`dir`) 만 emit. reducer 가 data + 현재 focus + dir 로 next id 계산.
 */
import type { NavigateDir, NormalizedData } from '../intent/events'
import { ROOT, getChildren } from '../intent/events'
import { enabledSiblings, parentOf } from '../axes/index'
import { visibleEnabled } from '../axes/_visibleFlat'
import { moveGrid, moveLinear } from '@interactive-os/keyboard-navigation'

/**
 * focus + dir → next id. resolve 못하면 null (no-op).
 * `from` 인자가 주어지면 그 id 를 기준으로, 없으면 `meta.focus` 사용.
 */
export const resolveNavigate = (d: NormalizedData, dir: NavigateDir, from?: string): string | null => {
  const focus = from ?? d.meta?.focus
  if (!focus) return null

  // sibling-based (vertical/horizontal 단일 부모 단)
  if (dir === 'next' || dir === 'prev' || dir === 'start' || dir === 'end') {
    const sibs = enabledSiblings(d, focus)
    if (!sibs.length) return null
    if (dir === 'next')  return moveLinear(sibs, focus, 'next', { wrap: true })
    if (dir === 'prev')  return moveLinear(sibs, focus, 'previous', { wrap: true })
    if (dir === 'start') return moveLinear(sibs, focus, 'first')
    if (dir === 'end')   return moveLinear(sibs, focus, 'last')
  }

  // visible-flat (tree collapse 반영)
  if (dir === 'visibleNext' || dir === 'visiblePrev') {
    const flat = visibleEnabled(d)
    if (!flat.length) return null
    const i = flat.indexOf(focus)
    if (i < 0) return null
    return moveLinear(flat, focus, dir === 'visibleNext' ? 'next' : 'previous') ?? focus
  }

  if (dir === 'firstChild') {
    const kids = getChildren(d, focus).filter((id) => !d.entities[id]?.disabled)
    return kids[0] ?? null
  }

  if (dir === 'toParent') {
    const p = parentOf(d, focus)
    return p && p !== ROOT ? p : null
  }

  // grid 2D 좌표 (phase 3b)
  if (dir === 'gridLeft' || dir === 'gridRight' || dir === 'gridUp' || dir === 'gridDown'
      || dir === 'rowStart' || dir === 'rowEnd' || dir === 'gridStart' || dir === 'gridEnd') {
    const rowId = parentOf(d, focus)
    const gridId = rowId ? parentOf(d, rowId) : undefined
    if (!gridId) return null
    const rows = getChildren(d, gridId).map((id) => getChildren(d, id))
    const actions = {
      gridLeft: 'left',
      gridRight: 'right',
      gridUp: 'up',
      gridDown: 'down',
      rowStart: 'rowStart',
      rowEnd: 'rowEnd',
      gridStart: 'gridStart',
      gridEnd: 'gridEnd',
    } as const
    const action = actions[dir]
    return moveGrid(rows, focus, action)
  }

  // pageNext/pagePrev 는 step 파라미터 필요 — phase 3c.
  return null
}

import { fromKeyMap, tagAxis, type Axis, type KeyHandler } from './axis'
import { parseTrigger } from '../trigger'
import { parentOf } from './index'
import { getChildren, getSelectAnchor, type NormalizedData, type UiEvent } from '../types'
import { INTENT_CHORDS } from './intentChords'
import { gridCoord } from './gridNavigate'

/**
 * gridMultiSelect — APG `/grid/` Selection 키 매핑. focus 이동은 gridNavigate.
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * KeyMap form — 모든 chord 가 fromKeyMap 의 entry. 좌표 산수는 KeyHandler 캡슐화.
 *
 * 키 매핑:
 *   Ctrl+Space   : 현재 cell 의 column 전체 선택
 *   Shift+Space  : 현재 cell 의 row 전체 선택
 *   Ctrl/Meta+A  : 모든 cell 선택
 *   Ctrl/Meta+클릭: 단일 cell toggle
 *   Shift+Arrow  : anchor → 다음 cell 사각형 영역 select{ids,to:true} (범위 밖은 deselect)
 */

const selectColumn: KeyHandler = (d, id) => {
  const c = gridCoord(d, id)
  if (!c) return null
  const ids: string[] = []
  c.rows.forEach((rid) => {
    const cells = getChildren(d, rid)
    if (cells[c.colIdx]) ids.push(cells[c.colIdx])
  })
  return [{ type: 'select', ids, to: true }]
}

const selectRow: KeyHandler = (d, id) => {
  const rowId = parentOf(d, id)
  if (!rowId) return null
  return [{ type: 'select', ids: getChildren(d, rowId), to: true }]
}

const selectAllCells: KeyHandler = (d, id) => {
  const c = gridCoord(d, id)
  if (!c) return null
  const all: string[] = []
  c.rows.forEach((rid) => getChildren(d, rid).forEach((cid) => all.push(cid)))
  return [{ type: 'select', ids: all, to: true }]
}

const rangeArrow = (dRow: number, dCol: number): KeyHandler => (d, id) => {
  const c = gridCoord(d, id)
  if (!c) return null
  const nextRowIdx = Math.max(0, Math.min(c.rows.length - 1, c.rowIdx + dRow))
  const tentativeColIdx = Math.max(0, Math.min(c.cellsInRow.length - 1, c.colIdx + dCol))
  if (nextRowIdx === c.rowIdx && tentativeColIdx === c.colIdx) return null

  const nextCells = getChildren(d, c.rows[nextRowIdx])
  if (!nextCells.length) return null
  const nextColInTargetRow = Math.min(tentativeColIdx, nextCells.length - 1)
  const nextCellId = nextCells[nextColInTargetRow]
  return rangeRect(d, id, c, nextRowIdx, nextColInTargetRow, nextCellId)
}

const rangeRect = (
  d: NormalizedData,
  currentId: string,
  c: { rows: string[]; rowIdx: number; colIdx: number },
  nextRow: number,
  nextCol: number,
  nextCellId: string,
): UiEvent[] => {
  const findCoords = (cellId: string): { row: number; col: number } | null => {
    for (let r = 0; r < c.rows.length; r++) {
      const cells = getChildren(d, c.rows[r])
      const ci = cells.indexOf(cellId)
      if (ci >= 0) return { row: r, col: ci }
    }
    return null
  }
  const anchorId = getSelectAnchor(d) ?? currentId
  const anchor = findCoords(anchorId) ?? { row: c.rowIdx, col: c.colIdx }
  const r1 = Math.min(anchor.row, nextRow), r2 = Math.max(anchor.row, nextRow)
  const c1 = Math.min(anchor.col, nextCol), c2 = Math.max(anchor.col, nextCol)

  const inRange: string[] = []
  const outRange: string[] = []
  for (let r = 0; r < c.rows.length; r++) {
    const cells = getChildren(d, c.rows[r])
    for (let cc = 0; cc < cells.length; cc++) {
      const cid = cells[cc]
      const inside = r >= r1 && r <= r2 && cc >= c1 && cc <= c2
      if (inside) inRange.push(cid)
      else outRange.push(cid)
    }
  }
  const events: UiEvent[] = [{ type: 'navigate', id: nextCellId }]
  if (outRange.length) events.push({ type: 'select', ids: outRange, to: false })
  events.push({ type: 'select', ids: inRange, to: true })
  return events
}

const gridMultiSelectKeys: Axis = fromKeyMap([
  [INTENT_CHORDS.gridMultiSelect.selectColumn, selectColumn],
  [INTENT_CHORDS.gridMultiSelect.selectRow, selectRow],
  [INTENT_CHORDS.gridMultiSelect.selectAll, selectAllCells],
  [INTENT_CHORDS.gridMultiSelect.rangeLeft, rangeArrow(0, -1)],
  [INTENT_CHORDS.gridMultiSelect.rangeRight, rangeArrow(0, +1)],
  [INTENT_CHORDS.gridMultiSelect.rangeUp, rangeArrow(-1, 0)],
  [INTENT_CHORDS.gridMultiSelect.rangeDown, rangeArrow(+1, 0)],
  [INTENT_CHORDS.gridMultiSelect.toggle, (_d, id) => [{ type: 'select', ids: [id] }]],
])

export const gridMultiSelect: Axis = tagAxis((d, id, t) => {
  const p = parseTrigger(t)
  if (p.kind === 'click') {
    if (p.ctrl || p.meta) return [{ type: 'select', ids: [id] }]
    return null
  }
  return gridMultiSelectKeys(d, id, t)
}, [...gridMultiSelectKeys.chords, 'Meta+Click', 'Control+Click'])

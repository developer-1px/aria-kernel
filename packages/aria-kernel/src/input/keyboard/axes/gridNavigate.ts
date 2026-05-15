import { fromKeyMap, type Axis } from './axis'
import { parentOf } from './index'
import { getChildren, type NormalizedData } from '../../../intent/events'
import { INTENT_CHORDS } from './intentChords'
import { findGridLocation } from '@interactive-os/keyboard-navigation'

/**
 * gridNavigate — APG `/grid/` 2D 셀 단위 navigation. focus 는 cell 에 있다.
 * Selection rect (Shift+Arrow / Ctrl+Space col / Shift+Space row) 은 gridMultiSelect.
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * Intent-form (PRD #38 phase 3b): chord → `{type:'navigate', dir}` 만 emit.
 * 2D 좌표 산수는 reducer (`resolveNavigate`) 가 담당.
 *
 * data 모델:
 *   container (= ROOT 또는 containerId)
 *     ├─ row entity → cell entity (focus 는 cell)
 */

interface Coord {
  cellsInRow: string[]
  colIdx: number
  rows: string[]
  rowIdx: number
}

export const gridRows = (d: NormalizedData, gridId: string): string[][] =>
  getChildren(d, gridId).map((rowId) => getChildren(d, rowId))

export const gridCoord = (d: NormalizedData, id: string): Coord | null => {
  const rowId = parentOf(d, id)
  if (!rowId) return null
  const cellsInRow = getChildren(d, rowId)
  const gridId = parentOf(d, rowId)
  if (!gridId) return null
  const rows = getChildren(d, gridId)
  const location = findGridLocation(gridRows(d, gridId), id)
  if (!location) return null
  return {
    cellsInRow,
    colIdx: location.columnIndex,
    rows,
    rowIdx: location.rowIndex,
  }
}

export const gridNavigate: Axis = fromKeyMap([
  [INTENT_CHORDS.gridNavigate.left,      { type: 'navigate', dir: 'gridLeft' }],
  [INTENT_CHORDS.gridNavigate.right,     { type: 'navigate', dir: 'gridRight' }],
  [INTENT_CHORDS.gridNavigate.up,        { type: 'navigate', dir: 'gridUp' }],
  [INTENT_CHORDS.gridNavigate.down,      { type: 'navigate', dir: 'gridDown' }],
  [INTENT_CHORDS.gridNavigate.rowStart,  { type: 'navigate', dir: 'rowStart' }],
  [INTENT_CHORDS.gridNavigate.rowEnd,    { type: 'navigate', dir: 'rowEnd' }],
  [INTENT_CHORDS.gridNavigate.gridStart, { type: 'navigate', dir: 'gridStart' }],
  [INTENT_CHORDS.gridNavigate.gridEnd,   { type: 'navigate', dir: 'gridEnd' }],
])

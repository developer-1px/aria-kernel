import { useCallback } from 'react'
import {
  ROOT,
  getChildren,
  getCollectionChildren,
  getLabel,
  isDisabled,
  type NormalizedData,
  type UiEvent,
} from '../types'
import { activate, composeAxes, gridNavigate, gridMultiSelect, matchAnyChord } from '../axes'

/**
 * grid edit-mode chord registry — declarative SSOT.
 * F2: APG 권고 — Enter cell edit mode.
 * Enter: spreadsheet de facto (Google Sheets / Excel) — commit on Enter 동작은 cell edit
 * mode 내부에서 처리되므로 cell read mode 에서 Enter 는 edit-mode 진입 의도.
 */
const GRID_EDIT_CHORDS = ['F2', 'Enter'] as const

/** gridEditKeys — chord registry 도출. */
export const gridEditKeys = (): readonly string[] => [...GRID_EDIT_CHORDS]
import { useRovingTabIndex } from '../roving/useRovingTabIndex'
import type { InsideEditableMode } from '../key/insideEditable'
import { usePatternClipboard, type ClipboardOnMiddleware } from './usePatternClipboard'
import type { BuiltinChordDescriptor, ItemProps, RootProps } from './types'

/** Options for {@link useGridPattern}. */
export interface GridOptions {
  /** Container entity for nested grids; defaults to ROOT. */
  containerId?: string
  /** aria-readonly. */
  readOnly?: boolean
  /** aria-rowcount — total rows when some are hidden/virtualized. */
  rowCount?: number
  /** aria-colcount — total cols when some are hidden/virtualized. */
  colCount?: number
  /** aria-multiselectable — Ctrl+Space (col), Shift+Space (row), Ctrl+A (all) 활성화. */
  multiSelectable?: boolean
  /**
   * APG 분기. `'cell'` 단일 selection · `'row'` 행 단위 selection · `'rect'`
   * spreadsheet 식 2D 범위 (Shift+Arrow). `'row'` 와 `'rect'` 는 multiSelectable 를
   * 자동 켠다. default `'cell'`.
   */
  selectionMode?: 'cell' | 'row' | 'rect'
  /**
   * column header click 시 `{type: 'activate', id: <headerId>}` emit — 소비자
   * reducer 가 `entity.sort` 를 ascending/descending/none 사이에서 회전.
   */
  sortable?: boolean
  /**
   * F2 시 `{type: 'editStart', id: <cellId>}` emit (APG-faithful edit intent — 분리되어
   * click `activate` 와 구분됨). 셀 자체에 `aria-readonly` 가 부여된다. default false.
   */
  editable?: boolean
  autoFocus?: boolean
  /** aria-label — ARIA: grid requires accessible name. */
  label?: string
  labelledBy?: string
  /**
   * input/contenteditable 안에서 clipboard/단축키 라우팅 모드.
   * 'forward' (default) — emit 하되 native 동작 보존.
   */
  insideEditable?: InsideEditableMode
  /**
   * 사용자 chord 미들웨어. default 와 충돌 시 userFn(event, originalFn) 으로 wrap.
   */
  on?: ClipboardOnMiddleware
  /**
   * Skip built-in chord descriptors (mod+z, Backspace, Delete, mod+shift+v, F2).
   * Use when the consumer owns key handling globally (e.g. via aria-kernel/key useShortcut)
   * so the grid root doesn't intercept Backspace/Delete inside per-cell edit inputs.
   */
  disableBuiltinChords?: boolean
}

/**
 * grid 가 디폴트로 흡수하는 chord 목록 — descriptor SSOT.
 */
export const gridBuiltinChords: readonly BuiltinChordDescriptor[] = [
  { chord: 'mod+z',       uiEvent: 'undo',   description: 'Undo last operation' },
  { chord: 'mod+shift+z', uiEvent: 'redo',   description: 'Redo' },
  { chord: 'mod+y',       uiEvent: 'redo',   description: 'Redo (Windows fallback)' },
  { chord: 'Backspace',   uiEvent: 'remove', description: 'Remove focused cell',   scope: 'item' },
  { chord: 'Delete',      uiEvent: 'remove', description: 'Remove focused cell',   scope: 'item' },
  { chord: 'mod+shift+v', uiEvent: 'paste',  description: 'Paste as child of focused cell', scope: 'item' },
  // grid-specific edit-mode (F2 enters cell edit, opts.editable=true 일 때 active)
  { chord: GRID_EDIT_CHORDS[0], uiEvent: 'editStart', description: 'Enter cell edit mode (F2)', scope: 'item' },
  // clipboard React events
  { chord: 'clipboard:copy',  uiEvent: 'copy',  description: 'Copy focused cell (React onCopy)',   scope: 'item' },
  { chord: 'clipboard:cut',   uiEvent: 'cut',   description: 'Cut focused cell (React onCut)',     scope: 'item' },
  { chord: 'clipboard:paste', uiEvent: 'paste', description: 'Paste onto focused cell (React onPaste)', scope: 'item' },
]

/** Cell view fed to consumer for rendering. */
export interface GridCell {
  id: string
  rowId: string
  rowIndex: number
  colIndex: number
  label: string
  selected: boolean
  disabled: boolean
}

/** Grid 가 등록하는 axis — SSOT. */
export const gridAxis = (opts: { multiSelectable?: boolean } = {}) =>
  opts.multiSelectable
    ? composeAxes(gridMultiSelect, gridNavigate, activate)
    : composeAxes(gridNavigate, activate)
const baseAxis = gridAxis()
const multiAxis = gridAxis({ multiSelectable: true })

/**
 * grid — APG `/grid/` recipe (data grid keyboard model, cell-focus).
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * data 모델: container → rows → cells. focus 단위 = cell.
 * treegrid 와의 차이: treegrid 는 row 단위 focus + tree 확장, grid 는 cell 단위 2D nav.
 *
 * **emit 분리 (lab/grid-edit-start 가 invariant 로 굳힘):**
 * - click → `activate` 만 (focus/select intent)
 * - F2 → `editStart` 만 (APG edit-mode chord)
 * - Enter → `editStart` + `activate` 둘 다 (Enter 는 chord match 이자 activate axis 트리거)
 *
 * 소비자는 `editStart` 를 edit intent 로 받고, Enter 시 함께 오는 `activate` 는 무시.
 */
export function useGridPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: GridOptions = {},
): {
  rootProps: RootProps
  rowProps: (id: string) => ItemProps
  columnHeaderProps: (id: string) => ItemProps
  rowHeaderProps: (id: string) => ItemProps
  cellProps: (id: string) => ItemProps
  rows: { id: string; cells: GridCell[] }[]
} {
  const {
    autoFocus, containerId = ROOT, readOnly, rowCount, colCount,
    selectionMode = 'cell', sortable, editable,
    label, labelledBy, insideEditable = 'forward',
  } = opts
  // 'row'/'rect' implies multi-selectable.
  const multiSelectable = opts.multiSelectable ?? selectionMode !== 'cell'
  // ROOT 자식 중 cell 을 가진 entity 만 row 로 인정. column header 처럼 자식 없는
  // top-level entity (gridSortable 데모 등) 는 row 로 보지 않아야 gridCoord 가 깨지지 않는다.
  const rowIds = getCollectionChildren(data, containerId).filter((id) => getChildren(data, id).length > 0)
  // grid 의 focus 단위는 cell. useRovingTabIndex 의 default 계산을 cell 차원에서 하도록
  // 첫 row id 를 focus-container 로 전달 (containerId 자체는 ROOT/grid id 그대로 의미).
  const focusContainerId = rowIds[0] ?? containerId

  const { focusId, bindFocus, delegate } = useRovingTabIndex(
    multiSelectable ? multiAxis : baseAxis,
    data,
    onEvent ?? (() => {}),
    { autoFocus, containerId: focusContainerId },
  )
  const rows = rowIds.map((rowId, rowIndex) => {
    const cellIds = getChildren(data, rowId)
    const cells: GridCell[] = cellIds.map((cellId, colIndex) => ({
      id: cellId,
      rowId,
      rowIndex,
      colIndex,
      label: getLabel(data, cellId),
      selected: Boolean(data.entities[cellId]?.selected),
      disabled: isDisabled(data, cellId),
    }))
    return { id: rowId, cells }
  })

  const cellIndex = useCallback(
    (cellId: string): { row: number; col: number } | null => {
      for (const row of rows) {
        const c = row.cells.find((cell) => cell.id === cellId)
        if (c) return { row: c.rowIndex, col: c.colIndex }
      }
      return null
    },
    [rows],
  )

  const activeId = focusId && focusId !== containerId ? focusId : null

  const clipboard = usePatternClipboard({
    onEvent,
    activeId,
    insideEditable,
    on: opts.on,
    builtinChords: gridBuiltinChords,
    disableBuiltinChords: opts.disableBuiltinChords,
  })

  const rootHandleKeyDown = (e: React.KeyboardEvent) => {
    delegate.onKeyDown(e)
    if (e.defaultPrevented) return
    clipboard.handleKeyDown(e)
  }

  const rootProps: RootProps = {
    role: 'grid',
    'aria-readonly': readOnly || undefined,
    'aria-rowcount': rowCount,
    'aria-colcount': colCount,
    'aria-multiselectable': multiSelectable || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...delegate,
    onKeyDown: rootHandleKeyDown,
    onCopy: clipboard.onCopy,
    onCut: clipboard.onCut,
    onPaste: clipboard.onPaste,
  } as unknown as RootProps

  const rowProps = (id: string): ItemProps => {
    const idx = rowIds.indexOf(id)
    return {
      role: 'row',
      'data-row-id': id,
      'aria-rowindex': idx === -1 ? undefined : idx + 1,
    } as unknown as ItemProps
  }

  const headerCellProps = (role: 'columnheader' | 'rowheader') => (id: string): ItemProps => {
    const idx = cellIndex(id)
    const isFocus = focusId === id
    // aria-sort 은 sort 가 활성된 헤더에만. entity.sort 에 'ascending'|'descending'|'other' 일 때만 emit.
    const sort = data.entities[id]?.sort as 'ascending' | 'descending' | 'other' | 'none' | undefined
    const ariaSort = sort && sort !== 'none' ? sort : undefined
    return {
      role,
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-colindex': idx ? idx.col + 1 : undefined,
      'aria-rowindex': idx ? idx.row + 1 : undefined,
      'aria-sort': ariaSort,
      ...(sortable && role === 'columnheader'
        ? {
            'data-sortable': '',
            onClick: () => onEvent?.({ type: 'activate', id }),
          }
        : {}),
    } as unknown as ItemProps
  }

  const columnHeaderProps = headerCellProps('columnheader')
  const rowHeaderProps = headerCellProps('rowheader')

  const cellProps = (id: string): ItemProps => {
    const idx = cellIndex(id)
    const isFocus = focusId === id
    const cell = idx ? rows[idx.row].cells[idx.col] : undefined
    return {
      role: 'gridcell',
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-selected': cell?.selected ?? undefined,
      'aria-disabled': cell?.disabled || undefined,
      'aria-readonly': editable === false ? true : undefined,
      'aria-colindex': idx ? idx.col + 1 : undefined,
      'aria-rowindex': idx ? idx.row + 1 : undefined,
      'data-selected': cell?.selected ? '' : undefined,
      'data-disabled': cell?.disabled ? '' : undefined,
      'data-focus-visible': isFocus ? '' : undefined,
      ...(editable
        ? {
            onKeyDown: (e: React.KeyboardEvent) => {
              if (matchAnyChord(e as unknown as KeyboardEvent, GRID_EDIT_CHORDS)) {
                e.preventDefault()
                onEvent?.({ type: 'editStart', id })
              }
            },
          }
        : {}),
    } as unknown as ItemProps
  }

  return { rootProps, rowProps, columnHeaderProps, rowHeaderProps, cellProps, rows }
}

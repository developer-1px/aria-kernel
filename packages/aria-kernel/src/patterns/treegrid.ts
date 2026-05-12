// editable 옵션은 디폴트 false. true 일 때만 편집 어휘를 emit (W1 UiEvent 8종 참조).
import { useCallback, useEffect, useRef, useState } from 'react'
import { ROOT, getChildren, getCollectionChildren, getLabel, isDisabled, getExpanded, type NormalizedData, type UiEvent } from '../types'
import { activate, composeAxes, multiSelect, treeExpand, treeNavigate, INTENT_CHORDS, matchAnyChord } from '../axes'
import { parseChord } from '../axes/chord'

/** treegrid edit-mode chord registry — declarative SSOT. */
const TREEGRID_EDIT_INSERT = ['Enter'] as const
const TREEGRID_EDIT_REMOVE = ['Backspace'] as const
const TREEGRID_EDIT_ACTIVATE_TAB = ['Tab'] as const

/** treegridEditKeys — chord registry 합집합 도출. */
export const treegridEditKeys = (): readonly string[] =>
  Array.from(new Set([
    ...TREEGRID_EDIT_INSERT, ...TREEGRID_EDIT_REMOVE, ...TREEGRID_EDIT_ACTIVATE_TAB,
  ].map((c) => parseChord(c).key)))
import { selectionFollowsFocus as applySelectionFollowsFocus } from '../gesture'
import { useRovingTabIndex } from '../roving/useRovingTabIndex'
import type { InsideEditableMode } from '../key/insideEditable'
import { usePatternClipboard, type ClipboardOnMiddleware, type ClipboardSerializerOptions } from './usePatternClipboard'
import type { KeyDescriptor, ItemProps, RootProps, TreeItem } from './types'
import { warnMultiSelectPairing } from './devWarnMultiSelect'

/** Options for {@link useTreegridPattern}. */
export interface TreegridOptions {
  /** aria-orientation. Spec implicit value: 'horizontal' for grid family. */
  orientation?: 'horizontal' | 'vertical'
  /** Default: `!multiSelectable` (APG: single sff, multi explicit toggle). */
  selectionFollowsFocus?: boolean
  /** aria-multiselectable. */
  multiSelectable?: boolean
  autoFocus?: boolean
  /** Container entity for nested grids; defaults to ROOT. */
  containerId?: string
  /** aria-label — ARIA: treegrid requires accessible name. */
  label?: string
  labelledBy?: string
  /** aria-colcount — total columns (header column count). */
  colCount?: number
  /**
   * APG Treegrid §"Row Focus" / §"Cell Focus". default `'row'`.
   * - `'row'`: focus 단위 = row. 화살표 = treeNavigate (위/아래 row, 좌/우 expand/collapse).
   * - `'cell'`: focus 단위 = cell. 2D 화살표, row 의 `aria-selected` 가 focused cell 의 row 를 반영.
   * - `'cellOnly'`: cell 와 동일 키보드, 단 row 자체엔 `aria-selected` 표시 안 함 (spec 외 변종).
   */
  navigationMode?: 'row' | 'cell' | 'cellOnly'
  /**
   * 편집 모드 — Enter/Backspace/Tab 을 패턴이 디폴트로 흡수한다.
   * 디폴트 false. true 일 때 emit 하는 UiEvent:
   * - Enter (focused row 의 부모 존재) → `{type:'insertAfter', siblingId}`
   * - Enter (focused row 가 root 직속) → `{type:'appendChild', parentId}`
   * - Backspace → `{type:'remove', id}`
   * - Tab      → `{type:'activate', id}`
   * Host reducer 가 `insertAfter`/`appendChild` 를 처리해야 한다.
   */
  editable?: boolean
  /**
   * input/contenteditable 안에서 clipboard/단축키 라우팅 모드. default 'forward'.
   */
  insideEditable?: InsideEditableMode
  /**
   * 사용자 chord 미들웨어. default 와 충돌 시 userFn(event, originalFn) 으로 wrap.
   */
  on?: ClipboardOnMiddleware
  serialize?: ClipboardSerializerOptions['serialize']
  toClipboard?: ClipboardSerializerOptions['toClipboard']
  fromClipboard?: ClipboardSerializerOptions['fromClipboard']
}

/**
 * treegrid 가 디폴트로 흡수하는 chord 목록 — descriptor SSOT.
 * treegrid 는 Backspace 가 'editable' 모드의 remove 와도 겹치므로,
 * 빌트인 clipboard 'remove' 와 동일 의미로 통합된다.
 */
export const treegridKeys: readonly KeyDescriptor[] = [
  { chord: 'mod+z',       uiEvent: 'undo',   description: 'Undo last operation' },
  { chord: 'mod+shift+z', uiEvent: 'redo',   description: 'Redo' },
  { chord: 'mod+y',       uiEvent: 'redo',   description: 'Redo (Windows fallback)' },
  { chord: 'Backspace',   uiEvent: 'remove', description: 'Remove focused row',    scope: 'item' },
  { chord: 'Delete',      uiEvent: 'remove', description: 'Remove focused row',    scope: 'item' },
  { chord: 'mod+shift+v', uiEvent: 'paste',  description: 'Paste as child of focused row', scope: 'item' },
  // editable 모드 chord (opts.editable=true 일 때만 활성)
  { chord: TREEGRID_EDIT_INSERT[0],        uiEvent: 'insertAfter', description: 'Insert sibling row — editable mode',     scope: 'item' },
  { chord: TREEGRID_EDIT_ACTIVATE_TAB[0],  uiEvent: 'activate',    description: 'Activate row (Tab) — editable mode',     scope: 'item' },
  // clipboard React events
  { chord: 'clipboard:copy',  uiEvent: 'copy',  description: 'Copy focused row (React onCopy)',   scope: 'item' },
  { chord: 'clipboard:cut',   uiEvent: 'cut',   description: 'Cut focused row (React onCut)',     scope: 'item' },
  { chord: 'clipboard:paste', uiEvent: 'paste', description: 'Paste onto focused row (React onPaste)', scope: 'item' },
]

const findParent = (data: NormalizedData, id: string): string | null => {
  for (const [pid, kids] of Object.entries(data.relationships)) {
    if (kids.includes(id)) return pid
  }
  return null
}

/** Treegrid 가 등록하는 axis — SSOT. */
export const treegridAxis = (opts: { multiSelectable?: boolean } = {}) =>
  opts.multiSelectable
    ? composeAxes(multiSelect, treeNavigate, treeExpand, activate)
    : composeAxes(treeNavigate, treeExpand, activate)
const singleAxis = treegridAxis()
const multiAxis = treegridAxis({ multiSelectable: true })

/**
 * treegrid — APG `/treegrid/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
 *
 * Focus stays on rows; cells expose grid semantics through rowheader/gridcell + aria-colindex.
 *
 * @example canonical — expand gesture 는 default 로 박혀 있음
 *   const [data, dispatch] = useTreegridReducer(ROWS, { defaultExpanded: ['src'] })
 *   const { treegridProps, rowProps, gridcellProps, items } = useTreegridPattern(data, dispatch)
 */
export function useTreegridPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: TreegridOptions = {},
): {
  treegridProps: RootProps
  headerRowProps: ItemProps
  rowProps: (id: string) => ItemProps
  columnheaderProps: (colIndex: number) => ItemProps
  rowheaderProps: (rowId: string) => ItemProps
  gridcellProps: (rowId: string, colIndex: number) => ItemProps
  items: TreeItem[]
} {
  const {
    autoFocus, multiSelectable, containerId = ROOT, orientation = 'horizontal',
    label, labelledBy, colCount, navigationMode = 'row', editable = false,
    insideEditable = 'forward',
  } = opts
  const sff = opts.selectionFollowsFocus ?? !multiSelectable
  if (multiSelectable) warnMultiSelectPairing('useTreegridPattern')
  const cellsMode = navigationMode !== 'row'
  const colsCount = colCount ?? 1

  const relay = useCallback(
    (e: UiEvent) => {
      if (!onEvent) return
      const out = sff ? applySelectionFollowsFocus(data, e) : [e]
      out.forEach(onEvent)
    },
    [data, onEvent, sff],
  )

  const axis = multiSelectable ? multiAxis : singleAxis
  const { focusId, bindFocus, delegate } = useRovingTabIndex(axis, data, relay, {
    autoFocus,
    containerId,
  })
  const expanded = getExpanded(data)

  const flat: TreeItem[] = []
  const walk = (parent: string, level: number) => {
    const children = parent === containerId
      ? getCollectionChildren(data, parent)
      : getChildren(data, parent)
    children.forEach((id, i) => {
      const ent = data.entities[id] ?? {}
      const kids = getChildren(data, id)
      const isExpanded = expanded.has(id)
      flat.push({
        id, label: getLabel(data, id),
        selected: Boolean(ent.selected), disabled: isDisabled(data, id),
        level, expanded: isExpanded, hasChildren: kids.length > 0,
        posinset: i + 1, setsize: children.length,
      })
      if (isExpanded) walk(id, level + 1)
    })
  }
  walk(containerId, 1)
  const HEADER_ROWS = 1
  const rowMap = new Map(flat.map((it, idx) => [it.id, { it, idx }]))

  // ─── cells-mode (cell / cellOnly) ────────────────────────────────
  const [cellFocus, setCellFocus] = useState<{ rowId: string; col: number } | null>(null)
  useEffect(() => {
    if (!cellsMode) return
    if (cellFocus && rowMap.has(cellFocus.rowId)) return
    const first = flat[0]?.id
    if (first) setCellFocus({ rowId: first, col: 0 })
  }, [cellsMode, flat, cellFocus, rowMap])

  const cellRefs = useRef(new Map<string, HTMLElement | null>())
  const cellKey = (rowId: string, col: number) => `${rowId}::${col}`

  useEffect(() => {
    if (!cellsMode || !cellFocus) return
    const el = cellRefs.current.get(cellKey(cellFocus.rowId, cellFocus.col))
    el?.focus({ preventScroll: true })
  }, [cellsMode, cellFocus])

  const moveCell = (dRow: number, dCol: number) => {
    if (!cellFocus) return
    const idx = flat.findIndex((it) => it.id === cellFocus.rowId)
    if (idx < 0) return
    const nextRowIdx = Math.max(0, Math.min(flat.length - 1, idx + dRow))
    const nextCol = Math.max(0, Math.min(colsCount - 1, cellFocus.col + dCol))
    setCellFocus({ rowId: flat[nextRowIdx].id, col: nextCol })
  }

  const editKeyDown = (id: string | undefined, e: React.KeyboardEvent): boolean => {
    if (!editable || !id || id === containerId) return false
    if (matchAnyChord(e as unknown as KeyboardEvent, TREEGRID_EDIT_INSERT)) {
      e.preventDefault()
      const parentId = findParent(data, id)
      if (parentId) relay({ type: 'insertAfter', siblingId: id })
      else          relay({ type: 'appendChild', parentId: id })
      return true
    }
    if (matchAnyChord(e as unknown as KeyboardEvent, TREEGRID_EDIT_REMOVE)) {
      e.preventDefault()
      relay({ type: 'remove', id })
      return true
    }
    if (matchAnyChord(e as unknown as KeyboardEvent, TREEGRID_EDIT_ACTIVATE_TAB)) {
      e.preventDefault()
      relay({ type: 'activate', id })
      return true
    }
    return false
  }

  const cellModeKeyDown = (rowId: string, _col: number) => (e: React.KeyboardEvent) => {
    if (editKeyDown(rowId, e)) return
    if (matchAnyChord(e as unknown as KeyboardEvent, [INTENT_CHORDS.gridNavigate.left])) { e.preventDefault(); moveCell(0, -1); return }
    if (matchAnyChord(e as unknown as KeyboardEvent, [INTENT_CHORDS.gridNavigate.right])) { e.preventDefault(); moveCell(0, 1); return }
    if (matchAnyChord(e as unknown as KeyboardEvent, [INTENT_CHORDS.gridNavigate.up])) { e.preventDefault(); moveCell(-1, 0); return }
    if (matchAnyChord(e as unknown as KeyboardEvent, [INTENT_CHORDS.gridNavigate.down])) { e.preventDefault(); moveCell(1, 0); return }
    if (matchAnyChord(e as unknown as KeyboardEvent, [INTENT_CHORDS.gridNavigate.rowStart])) { e.preventDefault(); setCellFocus({ rowId, col: 0 }); return }
    if (matchAnyChord(e as unknown as KeyboardEvent, [INTENT_CHORDS.gridNavigate.rowEnd])) { e.preventDefault(); setCellFocus({ rowId, col: colsCount - 1 }); return }
    if (matchAnyChord(e as unknown as KeyboardEvent, INTENT_CHORDS.activate.trigger)) {
      e.preventDefault()
      relay({ type: 'activate', id: rowId })
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const activeId = cellsMode
    ? (cellFocus?.rowId ?? null)
    : (focusId && focusId !== containerId ? focusId : null)

  const clipboard = usePatternClipboard({
    onEvent,
    activeId,
    insideEditable,
    on: opts.on,
    builtinChords: treegridKeys,
    serialize: opts.serialize,
    toClipboard: opts.toClipboard,
    fromClipboard: opts.fromClipboard,
  })

  // cells-mode 에선 row 단위 onKeyDown delegate 를 끈다 (cell 이 직접 수신).
  const treegridProps: RootProps = {
    role: 'treegrid',
    'aria-multiselectable': multiSelectable || undefined,
    'aria-orientation': orientation,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'aria-rowcount': flat.length + HEADER_ROWS,
    'aria-colcount': colCount,
    ...(cellsMode ? {} : {
      ...delegate,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (editKeyDown(focusId ?? undefined, e)) return
        delegate.onKeyDown(e)
        if (e.defaultPrevented) return
        clipboard.handleKeyDown(e)
      },
    }),
    ...(cellsMode ? { onKeyDown: clipboard.handleKeyDown } : {}),
    onCopy: clipboard.onCopy,
    onCut: clipboard.onCut,
    onPaste: clipboard.onPaste,
  } as RootProps

  const headerRowProps: ItemProps = {
    role: 'row',
    'aria-rowindex': 1,
  } as unknown as ItemProps

  const rowProps = (id: string): ItemProps => {
    const entry = rowMap.get(id)
    const it = entry?.it
    if (cellsMode) {
      const isFocusRow = navigationMode === 'cell' && cellFocus?.rowId === id
      return {
        role: 'row',
        'data-id': id,
        'aria-rowindex': entry ? entry.idx + 1 + HEADER_ROWS : undefined,
        'aria-selected': isFocusRow ? true : (it?.selected ?? undefined),
        'aria-expanded': it?.hasChildren ? it.expanded : undefined,
        'aria-level': it?.level,
        'aria-posinset': it?.posinset,
        'aria-setsize': it?.setsize,
      } as unknown as ItemProps
    }
    const isFocus = focusId === id
    return {
      role: 'row',
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-rowindex': entry ? entry.idx + 1 + HEADER_ROWS : undefined,
      'aria-selected': it?.selected ?? false,
      'aria-expanded': it?.hasChildren ? it.expanded : undefined,
      'aria-level': it?.level,
      'aria-posinset': it?.posinset,
      'aria-setsize': it?.setsize,
    } as unknown as ItemProps
  }

  const columnheaderProps = (colIndex: number): ItemProps => ({
    role: 'columnheader',
    'data-col': colIndex,
    'aria-colindex': colIndex + 1,
  } as unknown as ItemProps)

  const rowheaderProps = (rowId: string): ItemProps => ({
    role: 'rowheader',
    'data-row': rowId,
    'data-col': 0,
    'aria-colindex': 1,
  } as unknown as ItemProps)

  const gridcellProps = (rowId: string, colIndex: number): ItemProps => {
    const base = {
      role: 'gridcell',
      'data-row': rowId,
      'data-col': colIndex,
      'aria-colindex': colIndex + 1,
    }
    if (!cellsMode) return base as unknown as ItemProps
    const isFocus = cellFocus?.rowId === rowId && cellFocus.col === colIndex
    return {
      ...base,
      ref: ((el: HTMLElement | null) => {
        cellRefs.current.set(cellKey(rowId, colIndex), el)
      }) as unknown as React.Ref<HTMLElement>,
      tabIndex: isFocus ? 0 : -1,
      'data-focus-visible': isFocus ? '' : undefined,
      onKeyDown: cellModeKeyDown(rowId, colIndex),
    } as unknown as ItemProps
  }

  return {
    treegridProps,
    headerRowProps,
    rowProps,
    columnheaderProps,
    rowheaderProps,
    gridcellProps,
    items: flat,
  }
}

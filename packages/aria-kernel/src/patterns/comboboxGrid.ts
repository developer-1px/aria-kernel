import { useRef } from 'react'
import {
  ROOT, getChildren, getCollectionChildren, getLabel, isDisabled, getFocus, isOpen,
  type NormalizedData, type UiEvent,
} from '../types'
import {
  activate, composeAxes, escape,
  gridNavigate, matchAnyChord, openControl,
} from '../axes'
import { bindAxis } from '../state/bind'
import { useControlValue } from './_useControlValue'
import { useActiveDescendant } from '../roving/useActiveDescendant'
import type { ItemProps, RootProps } from './types'
import { BLUR_RACE_DELAY_MS } from '../key/timing'
import { usePopupBlurRace } from './usePopupBlurRace'

/** comboboxGrid open-trigger chord registry — declarative SSOT. */
const ARROW_DOWN = ['ArrowDown'] as const
const ARROW_UP = ['ArrowUp'] as const
const ESCAPE = ['Escape'] as const

/** Combobox(grid popup) 가 등록하는 axis — Escape · Alt+Arrow popup control · 2D nav · Enter. */
export const comboboxGridAxis = () =>
  composeAxes(escape, openControl, gridNavigate, activate)

export interface ComboboxGridOptions {
  value?: string
  defaultValue?: string
  filter?: (query: string, label: string, rowId: string) => boolean
  closeOnBlurDelay?: number
  /** activate 시 focused row 의 첫 cell label 을 input value 로 commit. default true. */
  commitOnActivate?: boolean
  openOnFocus?: boolean
  openOnType?: boolean
  idPrefix?: string
  required?: boolean
  readOnly?: boolean
  invalid?: boolean
  disabled?: boolean
  label?: string
  labelledBy?: string
  popupLabel?: string
  popupLabelledBy?: string
  rowCount?: number
  colCount?: number
}

/** Cell view (grid popup 안 cell). */
export interface ComboboxGridCell {
  id: string
  rowId: string
  rowIndex: number
  colIndex: number
  label: string
  disabled: boolean
}

const defaultFilter = (q: string, label: string): boolean =>
  label.toLowerCase().includes(q.toLowerCase())

/**
 * combobox with grid popup — APG `/combobox/examples/grid-combo/`.
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/grid-combo/
 *
 * input 에 DOM focus 유지, popup 은 `role="grid"`, `aria-activedescendant` 가
 * gridcell 을 가리킨다. 2D navigation: Arrow Up/Down (row), Arrow Left/Right (col).
 * Enter 시 focused row 의 첫 cell label 을 input value 로 commit.
 *
 * data: ROOT children = rowIds, 각 row 의 children = cellIds.
 *
 * @example canonical
 *   const [data, dispatch] = useComboboxGridReducer(ROWS)
 *   const { comboboxProps, inputProps, gridProps, rowProps, cellProps } = useComboboxGridPattern(data, dispatch)
 */
export function useComboboxGridPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: ComboboxGridOptions = {},
): {
  comboboxProps: ItemProps
  gridProps: RootProps
  rowProps: (id: string) => ItemProps
  cellProps: (id: string) => ItemProps
  rows: { id: string; cells: ComboboxGridCell[] }[]
  /** popup 열림 상태 — 호스트가 렌더 분기에 사용. data 에서 다시 derive 금지. */
  expanded: boolean
} {
  const {
    value: valueProp, defaultValue = '',
    filter = defaultFilter,
    closeOnBlurDelay = BLUR_RACE_DELAY_MS,
    commitOnActivate = true,
    openOnFocus = true,
    openOnType = true,
    idPrefix = 'cmbg',
    required, readOnly, invalid, disabled,
    label, labelledBy, popupLabel, popupLabelledBy,
    rowCount, colCount,
  } = opts

  const [query, setValue] = useControlValue<string>(valueProp, defaultValue, onEvent)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const blurRace = usePopupBlurRace(closeOnBlurDelay)

  const expanded = isOpen(data, ROOT)
  const activeId = getFocus(data) ?? null
  const allRowIds = getCollectionChildren(data, ROOT)
  const gridId = `${idPrefix}-grid`
  const cellDomId = (id: string) => `${idPrefix}-cell-${id}`
  const rowDomId = (id: string) => `${idPrefix}-row-${id}`
  useActiveDescendant(inputRef, expanded && activeId ? cellDomId(activeId) : null)

  // visible — query 가 row 의 첫 cell label (또는 row label) 에 매칭되는 row 만.
  const visibleRowIds = allRowIds.filter((rowId) => {
    const lbl = getLabel(data, rowId) || getLabel(data, getChildren(data, rowId)[0] ?? '')
    return filter(query, lbl, rowId)
  })

  const rows = visibleRowIds.map((rowId, rowIndex) => {
    const cellIds = getChildren(data, rowId)
    const cells: ComboboxGridCell[] = cellIds.map((cellId, colIndex) => ({
      id: cellId,
      rowId,
      rowIndex,
      colIndex,
      label: getLabel(data, cellId),
      disabled: isDisabled(data, cellId),
    }))
    return { id: rowId, cells }
  })

  // activeId 가 cell 인지 row 인지 — focused id 의 부모가 ROOT 면 row, 아니면 cell.
  const findRowOfCell = (cellId: string): string | undefined =>
    visibleRowIds.find((rowId) => getChildren(data, rowId).includes(cellId))

  const intent = (e: UiEvent) => {
    if (e.type === 'navigate' && !expanded) {
      onEvent?.({ type: 'open', id: ROOT, open: true })
    }
    if (e.type === 'activate') {
      onEvent?.(e)
      onEvent?.({ type: 'open', id: ROOT, open: false })
      if (commitOnActivate) {
        const rowId = findRowOfCell(e.id) ?? e.id
        const firstCell = getChildren(data, rowId)[0]
        const lbl = firstCell ? getLabel(data, firstCell) : getLabel(data, rowId)
        if (typeof lbl === 'string' && lbl) setValue(lbl)
      }
      return
    }
    onEvent?.(e)
  }

  const axis = comboboxGridAxis()
  const { onKey: dispatchKey } = bindAxis(axis, data, intent)

  const onKeyDown = (e: React.KeyboardEvent) => {
    // closed + ArrowDown/Up → open + 첫/마지막 row 의 첫 cell focus
    const ev = e as unknown as KeyboardEvent
    if (!expanded && (matchAnyChord(ev, ARROW_DOWN) || matchAnyChord(ev, ARROW_UP))) {
      e.preventDefault()
      onEvent?.({ type: 'open', id: ROOT, open: true })
      const targetRow = matchAnyChord(ev, ARROW_UP) ? visibleRowIds[visibleRowIds.length - 1] : visibleRowIds[0]
      const targetCell = targetRow ? getChildren(data, targetRow)[0] : undefined
      if (targetCell) onEvent?.({ type: 'navigate', id: targetCell })
      return
    }
    // Escape — open scope 는 ROOT (popup 자체). axis 가 activeId 로 dispatch 하면
    // ROOT 의 expanded 가 변하지 않아 닫히지 않음 → 명시적으로 ROOT id 로 emit.
    // APG combobox: Escape MUST close popup.
    if (expanded && matchAnyChord(ev, ESCAPE)) {
      e.preventDefault()
      onEvent?.({ type: 'open', id: ROOT, open: false })
      return
    }
    dispatchKey(e, activeId ?? ROOT)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (openOnType && !expanded) onEvent?.({ type: 'open', id: ROOT, open: true })
  }
  const onFocus = () => {
    blurRace.cancel()
    inputRef.current?.select()
    if (openOnFocus && !expanded) onEvent?.({ type: 'open', id: ROOT, open: true })
  }
  const onBlur = () => blurRace.schedule(() => onEvent?.({ type: 'open', id: ROOT, open: false }))

  const comboboxProps: ItemProps = {
    role: 'combobox',
    ref: inputRef as React.Ref<HTMLElement>,
    value: query,
    'aria-autocomplete': 'list',
    'aria-expanded': expanded,
    'aria-controls': gridId,
    'aria-haspopup': 'grid',
    'aria-required': required || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-invalid': invalid || undefined,
    'aria-disabled': disabled || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    onKeyDown,
    onChange,
    onFocus,
    onBlur,
  } as unknown as ItemProps

  const gridProps: RootProps = {
    role: 'grid',
    id: gridId,
    hidden: !expanded || undefined,
    'aria-label': popupLabel,
    'aria-labelledby': popupLabelledBy,
    'aria-rowcount': rowCount,
    'aria-colcount': colCount,
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault()
      blurRace.cancel()
    },
  } as unknown as RootProps

  const rowProps = (id: string): ItemProps => {
    const idx = visibleRowIds.indexOf(id)
    return {
      role: 'row',
      id: rowDomId(id),
      'data-row-id': id,
      'aria-rowindex': idx === -1 ? undefined : idx + 1,
    } as unknown as ItemProps
  }

  const cellProps = (id: string): ItemProps => {
    const isActive = activeId === id
    let rowIndex: number | undefined
    let colIndex: number | undefined
    let cellDisabled = false
    for (const r of rows) {
      const c = r.cells.find((cell) => cell.id === id)
      if (c) {
        rowIndex = c.rowIndex
        colIndex = c.colIndex
        cellDisabled = c.disabled
        break
      }
    }
    return {
      role: 'gridcell',
      id: cellDomId(id),
      'data-id': id,
      'aria-disabled': cellDisabled || undefined,
      'aria-colindex': colIndex !== undefined ? colIndex + 1 : undefined,
      'aria-rowindex': rowIndex !== undefined ? rowIndex + 1 : undefined,
      'data-active': isActive ? '' : undefined,
      onClick: () => intent({ type: 'activate', id }),
    } as unknown as ItemProps
  }

  return { comboboxProps, gridProps, rowProps, cellProps, rows, expanded }
}

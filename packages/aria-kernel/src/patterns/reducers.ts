/**
 * use<Pattern>Reducer — ARIA pattern-named L1 합성 hooks.
 *
 * 각 hook = `useReducer(reduce*, items, from*)` 의 pattern-named shortcut.
 * 반환: `[data, dispatch]` — React `useReducer` 와 동일 인터페이스.
 *
 * - LLM 그래디언트: 한 단어 (예: 'listbox') 가 reducer + builder + multi 모드 자동 정렬
 * - middleware: `enhance` 옵션이 HOR 자리 (`(r: Reducer) => Reducer`)
 * - escape: `useReducer(reduceSingleSelect, items, fromList)` 직접 호출도 그대로 가능
 *
 * @example canonical
 *   const [data, dispatch] = useListboxReducer(items, { multi: true })
 *   const { rootProps, optionProps } = useListboxPattern(data, dispatch, { label: 'X' })
 *
 * @example middleware (HOR — redux-undo 등과 호환)
 *   const [data, dispatch] = useListboxReducer(items, { enhance: undoable })
 */
import { useReducer, useMemo, type Dispatch } from 'react'
import { fromList, fromTree } from '../state/fromTree'
import { reduceSingleSelect, reduceMultiSelect, reduceRadio } from '../state/defaults'
import { applyGesture, type Reducer } from '../state/compose'
import { expandBranchOnActivate } from '../gesture'
import type { NormalizedData, UiEvent } from '../types'

type Enhance = (r: Reducer) => Reducer
type Result = [NormalizedData, Dispatch<UiEvent>]

/** select-multi 지원 패턴 옵션. */
export interface SelectableReducerOptions {
  /** ARIA `aria-multiselectable="true"` 시나리오 — `reduceMultiSelect` 선택. */
  multi?: boolean
  /** HOR middleware — `(reducer) => reducer`. redux-undo 등과 호환. */
  enhance?: Enhance
}

/** Tree/TreeGrid 옵션 — expand 기본 박힘 + 초기 expanded seed. */
export interface TreeReducerOptions extends SelectableReducerOptions {
  /** 초기 expanded id seed. `fromTree(roots, { expanded })`로 thread. */
  defaultExpanded?: string[]
}

/** select-single 전용 패턴 옵션. */
export interface SingleReducerOptions {
  /** HOR middleware. */
  enhance?: Enhance
}

const pickSelectable = (multi: boolean | undefined, enhance?: Enhance): Reducer => {
  const base = multi ? reduceMultiSelect : reduceSingleSelect
  return enhance ? enhance(base) : base
}

/** Tree/TreeGrid 정본 reducer — `applyGesture(base, expandBranchOnActivate)` 후 enhance.
 *  APG `treeview` 자구: Enter/Space는 parent면 expand, leaf면 activate. */
const pickTreeSelectable = (multi: boolean | undefined, enhance?: Enhance): Reducer => {
  const base = multi ? reduceMultiSelect : reduceSingleSelect
  const withExpand = applyGesture(base, expandBranchOnActivate)
  return enhance ? enhance(withExpand) : withExpand
}
const pickSingle = (enhance?: Enhance): Reducer =>
  enhance ? enhance(reduceSingleSelect) : reduceSingleSelect
const pickRadio = (enhance?: Enhance): Reducer =>
  enhance ? enhance(reduceRadio) : reduceRadio

/* ─────────────────────────────────────────────────────────────
 * List-based (fromList) — multi 지원
 * ───────────────────────────────────────────────────────────── */

export function useListboxReducer<T extends Record<string, unknown>>(items: T[], opts: SelectableReducerOptions = {}): Result {
  return useReducer(pickSelectable(opts.multi, opts.enhance), items, fromList)
}

/* ─────────────────────────────────────────────────────────────
 * Tree-based (fromTree) — multi 지원
 * ───────────────────────────────────────────────────────────── */

export function useTreeReducer<T extends { id: string; children?: T[] }>(
  roots: T[],
  opts: TreeReducerOptions = {},
): Result {
  const reducer = useMemo(() => pickTreeSelectable(opts.multi, opts.enhance), [opts.multi, opts.enhance])
  return useReducer(reducer, roots, (r) =>
    opts.defaultExpanded ? fromTree(r, { expanded: opts.defaultExpanded }) : fromTree(r),
  )
}

export function useGridReducer<T extends { id: string; children?: T[] }>(
  rows: T[],
  opts: SelectableReducerOptions = {},
): Result {
  return useReducer(pickSelectable(opts.multi, opts.enhance), rows, fromTree)
}

export function useTreeGridReducer<T extends { id: string; children?: T[] }>(
  rows: T[],
  opts: TreeReducerOptions = {},
): Result {
  const reducer = useMemo(() => pickTreeSelectable(opts.multi, opts.enhance), [opts.multi, opts.enhance])
  return useReducer(reducer, rows, (r) =>
    opts.defaultExpanded ? fromTree(r, { expanded: opts.defaultExpanded }) : fromTree(r),
  )
}

/* ─────────────────────────────────────────────────────────────
 * List-based, single-only
 * ───────────────────────────────────────────────────────────── */

export function useTabsReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

export function useAccordionReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

export function useToolbarReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

export function useCheckboxGroupReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

export function useComboboxReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

export function useComboboxSelectReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

export function useDisclosureReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

export function useNavigationListReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.enhance), items, fromList)
}

/* ─────────────────────────────────────────────────────────────
 * Tree-based, single-only
 * ───────────────────────────────────────────────────────────── */

export function useMenuReducer<T extends { id: string; children?: T[] }>(
  roots: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.enhance), roots, fromTree)
}

export function useMenubarReducer<T extends { id: string; children?: T[] }>(
  roots: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.enhance), roots, fromTree)
}

export function useMenuButtonReducer<T extends { id: string; children?: T[] }>(
  roots: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.enhance), roots, fromTree)
}

export function useComboboxGridReducer<T extends { id: string; children?: T[] }>(
  rows: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.enhance), rows, fromTree)
}

/* ─────────────────────────────────────────────────────────────
 * Radio — `role="radiogroup"` (reduceRadio)
 * ───────────────────────────────────────────────────────────── */

export function useRadioGroupReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickRadio(opts.enhance), items, fromList)
}

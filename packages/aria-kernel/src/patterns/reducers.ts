/**
 * use<Pattern>Reducer — ARIA pattern-named L1 합성 hooks.
 *
 * 각 hook = `useReducer(reduce*, items, from*)` 의 pattern-named shortcut.
 * 반환: `[data, dispatch]` — React `useReducer` 와 동일 인터페이스.
 *
 * - LLM 그래디언트: 한 단어 (예: 'listbox') 가 reducer + builder + multi 모드 자동 정렬
 * - middleware: `pipe` 옵션이 HOR 자리 (`(r: Reducer) => Reducer`)
 * - escape: `useReducer(reduceSingleSelect, items, fromList)` 직접 호출도 그대로 가능
 *
 * @example canonical
 *   const [data, dispatch] = useListboxReducer(items, { multi: true })
 *   const { rootProps, optionProps } = useListboxPattern(data, dispatch, { label: 'X' })
 *
 * @example middleware (HOR — redux-undo 등과 호환)
 *   const [data, dispatch] = useListboxReducer(items, { pipe: undoable })
 */
import { useReducer, type Dispatch } from 'react'
import { fromList, fromTree } from '../state/fromTree'
import { reduceSingleSelect, reduceMultiSelect, reduceRadio } from '../state/defaults'
import type { Reducer } from '../state/compose'
import type { NormalizedData, UiEvent } from '../types'

type Pipe = (r: Reducer) => Reducer
type Result = [NormalizedData, Dispatch<UiEvent>]

/** select-multi 지원 패턴 옵션. */
export interface SelectableReducerOptions {
  /** ARIA `aria-multiselectable="true"` 시나리오 — `reduceMultiSelect` 선택. */
  multi?: boolean
  /** HOR middleware — `(reducer) => reducer`. redux-undo 등과 호환. */
  pipe?: Pipe
}

/** select-single 전용 패턴 옵션. */
export interface SingleReducerOptions {
  /** HOR middleware. */
  pipe?: Pipe
}

const pickSelectable = (multi: boolean | undefined, pipe?: Pipe): Reducer => {
  const base = multi ? reduceMultiSelect : reduceSingleSelect
  return pipe ? pipe(base) : base
}
const pickSingle = (pipe?: Pipe): Reducer =>
  pipe ? pipe(reduceSingleSelect) : reduceSingleSelect
const pickRadio = (pipe?: Pipe): Reducer =>
  pipe ? pipe(reduceRadio) : reduceRadio

/* ─────────────────────────────────────────────────────────────
 * List-based (fromList) — multi 지원
 * ───────────────────────────────────────────────────────────── */

export function useListboxReducer<T extends Record<string, unknown>>(items: T[], opts: SelectableReducerOptions = {}): Result {
  return useReducer(pickSelectable(opts.multi, opts.pipe), items, fromList)
}

/* ─────────────────────────────────────────────────────────────
 * Tree-based (fromTree) — multi 지원
 * ───────────────────────────────────────────────────────────── */

export function useTreeReducer<T extends { id: string; children?: T[] } & Record<string, unknown>>(
  roots: T[],
  opts: SelectableReducerOptions = {},
): Result {
  return useReducer(pickSelectable(opts.multi, opts.pipe), roots, fromTree)
}

export function useGridReducer<T extends { id: string; children?: T[] } & Record<string, unknown>>(
  rows: T[],
  opts: SelectableReducerOptions = {},
): Result {
  return useReducer(pickSelectable(opts.multi, opts.pipe), rows, fromTree)
}

export function useTreeGridReducer<T extends { id: string; children?: T[] } & Record<string, unknown>>(
  rows: T[],
  opts: SelectableReducerOptions = {},
): Result {
  return useReducer(pickSelectable(opts.multi, opts.pipe), rows, fromTree)
}

/* ─────────────────────────────────────────────────────────────
 * List-based, single-only
 * ───────────────────────────────────────────────────────────── */

export function useTabsReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

export function useAccordionReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

export function useToolbarReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

export function useCheckboxGroupReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

export function useComboboxReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

export function useComboboxSelectReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

export function useDisclosureReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

export function useNavigationListReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickSingle(opts.pipe), items, fromList)
}

/* ─────────────────────────────────────────────────────────────
 * Tree-based, single-only
 * ───────────────────────────────────────────────────────────── */

export function useMenuReducer<T extends { id: string; children?: T[] } & Record<string, unknown>>(
  roots: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.pipe), roots, fromTree)
}

export function useMenubarReducer<T extends { id: string; children?: T[] } & Record<string, unknown>>(
  roots: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.pipe), roots, fromTree)
}

export function useMenuButtonReducer<T extends { id: string; children?: T[] } & Record<string, unknown>>(
  roots: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.pipe), roots, fromTree)
}

export function useComboboxGridReducer<T extends { id: string; children?: T[] } & Record<string, unknown>>(
  rows: T[],
  opts: SingleReducerOptions = {},
): Result {
  return useReducer(pickSingle(opts.pipe), rows, fromTree)
}

/* ─────────────────────────────────────────────────────────────
 * Radio — `role="radiogroup"` (reduceRadio)
 * ───────────────────────────────────────────────────────────── */

export function useRadioGroupReducer<T extends Record<string, unknown>>(items: T[], opts: SingleReducerOptions = {}): Result {
  return useReducer(pickRadio(opts.pipe), items, fromList)
}

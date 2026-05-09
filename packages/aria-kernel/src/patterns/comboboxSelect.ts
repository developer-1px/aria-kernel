import { useRef } from 'react'
import {
  ROOT, getCollectionChildren, getLabel, isDisabled, getFocus, isOpen,
  type NormalizedData, type UiEvent,
} from '../types'
import {
  activate, composeAxes, escape, INTENT_CHORDS, matchAnyChord,
  navigate, openControl,
} from '../axes'
import { bindAxis } from '../state/bind'
import { useActiveDescendant } from '../roving/useActiveDescendant'
import type { BaseItem, ItemProps, RootProps } from './types'

const ARROW_DOWN = ['ArrowDown'] as const
const ARROW_UP = ['ArrowUp'] as const
const HOME = ['Home'] as const
const END = ['End'] as const
const BACKWARD_OPEN = [...ARROW_UP, ...END] as const

/** Combobox select-only 가 등록하는 axis — listbox variant 와 동일 합성. */
export const comboboxSelectAxis = () =>
  composeAxes(escape, openControl, navigate('vertical'), activate)

/** Options for {@link useComboboxSelectPattern}. */
export interface ComboboxSelectOptions {
  haspopup?: 'listbox' | 'tree' | 'grid'
  /** outside click 흡수 — option click 과 race 방지. de facto 100ms. */
  closeOnBlurDelay?: number
  idPrefix?: string
  required?: boolean
  invalid?: boolean
  disabled?: boolean
  label?: string
  labelledBy?: string
  popupLabel?: string
  popupLabelledBy?: string
}

/**
 * combobox select-only — APG `combobox-select-only` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
 *
 * 격리 근거 (요소 타입·props 내용이 textbox variant 와 다름):
 *   ② 반환 props 내용: `children`(=selectedLabel) + `onClick` (input variant 의 `value`+`onChange` 와 상충)
 *   호스트 JSX 가 input 이 아니라 button-like (`<div role="combobox">`)
 *   키맵: Enter/Space/Down/Up/Home/End 모두 popup open (typing 어휘 없음)
 *
 * 모든 emit:
 *   nav     → {type:'navigate', id}
 *   activate→ {type:'activate', id} + {type:'open', open:false}
 *   escape  → {type:'open', id:ROOT, open:false}
 *   click   → {type:'open', open:!expanded}
 */
export function useComboboxSelectPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: ComboboxSelectOptions = {},
): {
  comboboxProps: ItemProps
  listboxProps: RootProps
  optionProps: (id: string) => ItemProps
  items: BaseItem[]
  expanded: boolean
} {
  const {
    haspopup = 'listbox',
    closeOnBlurDelay = 100,
    idPrefix = 'cmbx',
    required, invalid, disabled,
    label, labelledBy, popupLabel, popupLabelledBy,
  } = opts

  const rootRef = useRef<HTMLElement | null>(null)
  const blurTimerRef = useRef<number | null>(null)

  const expanded = isOpen(data, ROOT)
  const activeId = getFocus(data) ?? null
  const allIds = getCollectionChildren(data, ROOT)
  const listId = `${idPrefix}-list`
  const optionDomId = (id: string) => `${idPrefix}-opt-${id}`
  useActiveDescendant(rootRef, expanded && activeId ? optionDomId(activeId) : null)

  const items: BaseItem[] = allIds.map((id, i) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: Boolean(ent.selected),
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: allIds.length,
    }
  })

  const selectedId = allIds.find((id) => data.entities[id]?.selected)
  const selectedLabel = selectedId ? getLabel(data, selectedId) : ''

  const cancelBlurClose = () => {
    if (blurTimerRef.current !== null) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
  }

  const intent = (e: UiEvent) => {
    if (e.type === 'navigate' && !expanded) onEvent?.({ type: 'open', id: ROOT, open: true })
    if (e.type === 'activate') {
      onEvent?.(e)
      onEvent?.({ type: 'open', id: ROOT, open: false })
      return
    }
    onEvent?.(e)
  }

  const axis = comboboxSelectAxis()
  const { onKey: dispatchKey } = bindAxis(axis, data, intent)

  const onKeyDown = (e: React.KeyboardEvent) => {
    const ev = e as unknown as KeyboardEvent
    // closed: Enter/Space/Down/Up/Home/End all open popup (APG select-only).
    if (!expanded && (
      matchAnyChord(ev, INTENT_CHORDS.activate.trigger) ||
      matchAnyChord(ev, ARROW_DOWN) || matchAnyChord(ev, ARROW_UP) ||
      matchAnyChord(ev, HOME) || matchAnyChord(ev, END)
    )) {
      e.preventDefault()
      onEvent?.({ type: 'open', id: ROOT, open: true })
      const target = matchAnyChord(ev, BACKWARD_OPEN)
        ? allIds[allIds.length - 1]
        : (selectedId ?? allIds[0])
      if (target) onEvent?.({ type: 'navigate', id: target })
      return
    }
    if ((matchAnyChord(ev, HOME) || matchAnyChord(ev, END)) && !expanded) return
    dispatchKey(e, activeId ?? ROOT)
  }

  // @FIXME(srp): blur race(setTimeout)가 popup 패턴 공통 메커니즘인지 미확인 —
  // 판단 조건: menu·menuButton·tooltip 감사 후 동일 race 2건 이상이면 usePopupBlurRace 추출
  const onBlur = () => {
    cancelBlurClose()
    blurTimerRef.current = window.setTimeout(() => {
      onEvent?.({ type: 'open', id: ROOT, open: false })
      blurTimerRef.current = null
    }, closeOnBlurDelay)
  }

  const comboboxProps: ItemProps = {
    role: 'combobox',
    ref: rootRef as React.Ref<HTMLElement>,
    tabIndex: disabled ? -1 : 0,
    'aria-expanded': expanded,
    'aria-controls': listId,
    'aria-haspopup': haspopup,
    'aria-required': required || undefined,
    'aria-invalid': invalid || undefined,
    'aria-disabled': disabled || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'data-value': selectedLabel,
    children: selectedLabel,
    onClick: () => {
      if (disabled) return
      onEvent?.({ type: 'open', id: ROOT, open: !expanded })
    },
    onKeyDown,
    onBlur,
  } as unknown as ItemProps

  const listboxProps: RootProps = {
    role: 'listbox',
    id: listId,
    hidden: !expanded || undefined,
    'aria-label': popupLabel,
    'aria-labelledby': popupLabelledBy,
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault()
      cancelBlurClose()
    },
  } as unknown as RootProps

  const optionProps = (id: string): ItemProps => {
    const it = items.find((x) => x.id === id)
    const isActive = activeId === id
    return {
      role: 'option',
      id: optionDomId(id),
      'data-id': id,
      'aria-selected': it?.selected ?? false,
      'aria-disabled': it?.disabled || undefined,
      'data-active': isActive ? '' : undefined,
      'data-selected': it?.selected ? '' : undefined,
      onClick: () => intent({ type: 'activate', id }),
    } as unknown as ItemProps
  }

  return { comboboxProps, listboxProps, optionProps, items, expanded }
}

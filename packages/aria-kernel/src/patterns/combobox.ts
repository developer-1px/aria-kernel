import { useRef, useMemo } from 'react'
import {
  ROOT, getCollectionChildren, getLabel, isDisabled, getFocus, isOpen,
  type NormalizedData, type UiEvent,
} from '../types'
import {
  activate, composeAxes, escape, matchAnyChord,
  navigate, openControl,
} from '../axes'
import { bindAxis } from '../state/bind'
import { useControlValue } from '../state/useControlValue'
import { useActiveDescendant } from '../roving/useActiveDescendant'
import type { BaseItem, ItemProps, RootProps } from './types'
import { BLUR_RACE_DELAY_MS } from '../key/timing'

/** combobox chord registry — declarative SSOT. */
const ARROW_DOWN = ['ArrowDown'] as const
const ARROW_UP = ['ArrowUp'] as const
const HOME = ['Home'] as const
const END = ['End'] as const
const FORWARD_OPEN = [...ARROW_DOWN, ...HOME] as const
const BACKWARD_OPEN = [...ARROW_UP, ...END] as const

/** Combobox 가 등록하는 axis — SSOT. (Escape · Alt+Arrow popup control · Arrow/Home/End · Enter) */
export const comboboxAxis = () =>
  composeAxes(escape, openControl, navigate('vertical'), activate)

/** Options for {@link useComboboxPattern}. */
export interface ComboboxOptions {
  /** controlled input value. 생략 시 패턴이 useState 로 자체 보유. */
  value?: string
  defaultValue?: string
  /** filter — query 로 visible 좁힘. default: label.toLowerCase().includes(q.toLowerCase()). */
  filter?: (query: string, label: string, id: string) => boolean
  /** aria-autocomplete. APG: 'none' | 'list' | 'both'. */
  autocomplete?: 'none' | 'list' | 'both'
  /** aria-haspopup. Spec implicit: 'listbox'. */
  haspopup?: 'listbox' | 'tree' | 'grid'
  /** outside click 흡수 — option click 과 race 방지. de facto 100ms. */
  closeOnBlurDelay?: number
  /** activate 시 input value 를 선택된 label 로 갱신 (APG default). */
  commitOnActivate?: boolean
  /**
   * focus 시 popup 자동 open. APG `combobox-autocomplete-none` 은 false
   * (Alt+Down 또는 typing 으로만 open). 그 외 default true.
   */
  openOnFocus?: boolean
  /** typing(onChange) 시 popup 자동 open. default true. */
  openOnType?: boolean
  /**
   * blur 시 현재 highlighted option 을 자동 commit.
   * APG `autocomplete='both'` default true, 그 외 false.
   */
  selectOnBlur?: boolean
  /**
   * query 변경 시 첫 visible option 을 자동 highlight (`aria-activedescendant`).
   * APG `autocomplete='both'` default true, 그 외 false.
   */
  autoHighlightFirst?: boolean
  idPrefix?: string
  required?: boolean
  readOnly?: boolean
  invalid?: boolean
  disabled?: boolean
  /** aria-label — combobox 입력의 accessible name (label 또는 labelledBy 필수). */
  label?: string
  labelledBy?: string
  /** popup listbox 의 aria-label / aria-labelledby. */
  popupLabel?: string
  popupLabelledBy?: string
}

const defaultFilter = (q: string, label: string): boolean =>
  label.toLowerCase().includes(q.toLowerCase())

/**
 * combobox — APG `/combobox/` recipe (textbox + listbox popup).
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * 격리된 variant 는 별도 hook:
 *   - select-only (editable=false)        → useComboboxSelectPattern
 *   - dialog-popup (combobox-datepicker)  → useComboboxDialogPattern
 *   - grid-popup                          → useComboboxGridPattern
 *
 * 본 hook 은 textbox + listbox autocomplete=none/list/both 를 담당.
 *
 * 시그니처: 다른 컬렉션 패턴과 동일한 `(data, onEvent, opts)`.
 *
 * **패턴 내부에서 흡수하는 책임** (host 가 안 다뤄도 됨):
 *   - input value (query) state — uncontrolled default, value 옵션으로 controlled 도 가능
 *   - filter visible ids — default label.includes, filter 옵션으로 override
 *   - lifecycle 이벤트 (focus/blur/change) — 모두 onEvent 로 dispatch
 *   - activate 후속 (popup close + commit) — APG 표준 동작 자동
 *
 * 모든 emit:
 *   typing  → {type:'value', id:ROOT, value}
 *   focus   → {type:'open',  id:ROOT, open:true}
 *   blur    → {type:'open',  id:ROOT, open:false}  (closeOnBlurDelay 후)
 *   nav     → {type:'navigate', id}
 *   activate→ {type:'activate', id} + {type:'open', open:false} + (commitOnActivate) {type:'value', value:label}
 *   escape  → {type:'open', id:ROOT, open:false}
 *
 * INVARIANT B11: input 에 focus 유지, popup option 활성은 aria-activedescendant.
 *
 * **Ephemeral derived list 사용 (chat @-mention · /-command 등 키스트로크당 재계산):**
 *
 *   const base = useMemo(() => fromList(filtered), [filtered])
 *   const [data, dispatch] = useControlState(base)
 *   const cb = useComboboxPattern(data, (e) => {
 *     dispatch(e)                              // keyboard nav meta 영속화
 *     if (e.type === 'activate') commit(e.id)  // intent 처리
 *   })
 *
 * `useControlState` 가 base(entities/relationships) 와 local meta(focus/expanded)
 * 를 분리 — filtered 갱신 시 entities 만 swap, 키보드 nav 상태는 보존.
 */
export function useComboboxPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: ComboboxOptions = {},
): {
  comboboxProps: ItemProps
  listboxProps: RootProps
  optionProps: (id: string) => ItemProps
  items: BaseItem[]
  expanded: boolean
} {
  const {
    value: valueProp, defaultValue = '',
    filter = defaultFilter,
    autocomplete = 'list', haspopup = 'listbox',
    closeOnBlurDelay = BLUR_RACE_DELAY_MS, commitOnActivate = true,
    openOnFocus = autocomplete !== 'none',
    openOnType = true,
    selectOnBlur = autocomplete === 'both',
    autoHighlightFirst = autocomplete === 'both',
    idPrefix = 'cmbx',
    required, readOnly, invalid, disabled,
    label, labelledBy, popupLabel, popupLabelledBy,
  } = opts

  // query state — controlled/uncontrolled hybrid 헬퍼.
  const [query, setValue] = useControlValue<string>(valueProp, defaultValue, onEvent)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const blurTimerRef = useRef<number | null>(null)

  const expanded = isOpen(data, ROOT)
  const activeId = getFocus(data) ?? null
  const allIds = getCollectionChildren(data, ROOT)
  const listId = `${idPrefix}-list`
  const optionDomId = (id: string) => `${idPrefix}-opt-${id}`
  useActiveDescendant(inputRef, expanded && activeId ? optionDomId(activeId) : null)

  // visible — query 로 좁힘.
  const visibleIds = useMemo(
    () => allIds.filter((id) => filter(query, getLabel(data, id), id)),
    [allIds, query, filter, data],
  )

  const items: BaseItem[] = visibleIds.map((id, i) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: Boolean(ent.selected),
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: visibleIds.length,
    }
  })

  const cancelBlurClose = () => {
    if (blurTimerRef.current !== null) {
      clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
  }

  // @FIXME(srp): intent re-interpret 코드가 tree 의 effect VM 과 같은 역할 —
  // 판단 조건: menu·menubar god module 분해 시 commands+effect 어휘를 axis 위에 도입할지 결정.
  const intent = (e: UiEvent) => {
    if (e.type === 'navigate' && !expanded) onEvent?.({ type: 'open', id: ROOT, open: true })
    if (e.type === 'activate') {
      onEvent?.(e)
      onEvent?.({ type: 'open', id: ROOT, open: false })
      if (commitOnActivate) {
        const lbl = data.entities[e.id]?.label
        if (typeof lbl === 'string') setValue(lbl)
      }
      return
    }
    onEvent?.(e)
  }

  const axis = comboboxAxis()
  const { onKey: dispatchKey } = bindAxis(axis, data, intent)

  const onKeyDown = (e: React.KeyboardEvent) => {
    const ev = e as unknown as KeyboardEvent
    if (!activeId) {
      if (matchAnyChord(ev, FORWARD_OPEN)) {
        e.preventDefault()
        const target = visibleIds[0]
        if (target) intent({ type: 'navigate', id: target })
        return
      }
      if (matchAnyChord(ev, BACKWARD_OPEN)) {
        e.preventDefault()
        const target = visibleIds[visibleIds.length - 1]
        if (target) intent({ type: 'navigate', id: target })
        return
      }
    }
    if ((matchAnyChord(ev, HOME) || matchAnyChord(ev, END)) && !expanded) return
    dispatchKey(e, activeId ?? ROOT)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setValue(next)
    if (openOnType && !expanded) onEvent?.({ type: 'open', id: ROOT, open: true })
    if (autoHighlightFirst) {
      const firstVisible = allIds.find((id) => filter(next, getLabel(data, id), id))
      if (firstVisible) onEvent?.({ type: 'navigate', id: firstVisible })
    }
  }
  const onFocus = () => {
    cancelBlurClose()
    inputRef.current?.select()
    if (openOnFocus && !expanded) onEvent?.({ type: 'open', id: ROOT, open: true })
  }
  // @FIXME(srp): blur race(setTimeout)가 popup 패턴 공통 메커니즘인지 미확인 —
  // 판단 조건: menu·menuButton·tooltip 감사 후 동일 race 2건 이상이면 usePopupBlurRace 추출
  const onBlur = () => {
    cancelBlurClose()
    blurTimerRef.current = window.setTimeout(() => {
      if (selectOnBlur && activeId) {
        onEvent?.({ type: 'activate', id: activeId })
        if (commitOnActivate) {
          const lbl = data.entities[activeId]?.label
          if (typeof lbl === 'string') setValue(lbl)
        }
      }
      onEvent?.({ type: 'open', id: ROOT, open: false })
      blurTimerRef.current = null
    }, closeOnBlurDelay)
  }

  const comboboxProps: ItemProps = {
    role: 'combobox',
    ref: inputRef as React.Ref<HTMLElement>,
    value: query,
    'aria-autocomplete': autocomplete,
    'aria-expanded': expanded,
    'aria-controls': listId,
    'aria-haspopup': haspopup,
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

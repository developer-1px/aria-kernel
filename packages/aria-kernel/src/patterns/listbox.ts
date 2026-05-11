import { useCallback } from 'react'
import { ROOT, getChildren, getCollectionChildren, getLabel, isDisabled, type NormalizedData, type UiEvent } from '../types'
import { activate, composeAxes, multiSelect, navigate, typeahead, matchAnyChord } from '../axes'
import type { InsideEditableMode } from '../key/insideEditable'
import { usePatternClipboard, type ClipboardOnMiddleware } from './usePatternClipboard'

/** listbox edit-mode chord registry — declarative SSOT (Enter=insertAfter, Backspace=remove). */
const LISTBOX_EDIT_INSERT = ['Enter'] as const
const LISTBOX_EDIT_REMOVE = ['Backspace'] as const

/** listboxEditKeys — chord registry 합집합 도출. editable 모드 추가 키. */
export const listboxEditKeys = (): readonly string[] =>
  [...LISTBOX_EDIT_INSERT, ...LISTBOX_EDIT_REMOVE]
import { selectionFollowsFocus as applySelectionFollowsFocus } from '../gesture'
import { useRovingTabIndex } from '../roving/useRovingTabIndex'
import type { BaseItem, KeyDescriptor, ItemProps, RootProps } from './types'
import { warnMultiSelectPairing } from './devWarnMultiSelect'

/** Options for {@link useListboxPattern}. */
export interface ListboxOptions {
  /** aria-orientation. Spec implicit value: 'vertical'. */
  orientation?: 'horizontal' | 'vertical'
  /** Default: `!multiSelectable` (APG: single sff, multi explicit toggle). */
  selectionFollowsFocus?: boolean
  /** aria-multiselectable. */
  multiSelectable?: boolean
  autoFocus?: boolean
  /** Container entity for nested listboxes (e.g. inside a Menu); defaults to ROOT. */
  containerId?: string
  /** aria-required (form context). */
  required?: boolean
  /** aria-readonly (form context). */
  readOnly?: boolean
  /** aria-invalid (form context). */
  invalid?: boolean
  /** aria-disabled (whole-listbox disabled). */
  disabled?: boolean
  /** aria-label — ARIA: listbox requires accessible name. */
  label?: string
  labelledBy?: string
  /**
   * APG `listbox-grouped` 변종. 활성화 시 ROOT 의 자식이 group entity 이고, 각 group 의
   * 자식이 option 이다 (`fromTree`로 빌드). `<groupProps(groupId)>` getter 와 `groups`
   * 배열이 추가로 노출된다. default false (flat list).
   */
  groups?: boolean
  /**
   * APG `listbox-rearrangeable` 변종. 의미적 marker — root 에 `data-rearrangeable=""`
   * 가 붙고 소비자가 Toolbar (Move Up/Down/Add/Remove) 와 wiring 한다.
   * 패턴 자체는 이벤트를 emit 하지 않는다 — 소비자가 toolbar 버튼 click 을 직접 처리.
   */
  rearrangeable?: boolean
  /**
   * 편집 모드 — Enter→insertAfter(focused option), Backspace→remove(focused option) 흡수.
   * tree 의 `editable` 와 동일 어휘. listbox 는 indent 가 없으므로 Tab 매핑은 없음.
   * 디폴트 false.
   */
  editable?: boolean
  /**
   * input/contenteditable 안에서 clipboard/단축키 라우팅 모드.
   * 'forward' (default) — emit 하되 native 동작 보존.
   * 'native' — input 안이면 skip(인라인 편집 셀에서 native 양보).
   * 'preventDefault' — emit + native 차단.
   */
  insideEditable?: InsideEditableMode
  idPrefix?: string
  /**
   * 사용자 chord 미들웨어. key+mouse 통합. default chord 와 충돌 시
   * userFn(event, originalFn) 으로 wrap — originalFn 호출 여부로 default 실행 결정.
   */
  on?: ClipboardOnMiddleware
}

/**
 * listbox 가 디폴트로 흡수하는 chord 목록 — descriptor SSOT.
 */
export const listboxKeys: readonly KeyDescriptor[] = [
  { chord: 'mod+z',       uiEvent: 'undo',   description: 'Undo last operation' },
  { chord: 'mod+shift+z', uiEvent: 'redo',   description: 'Redo' },
  { chord: 'mod+y',       uiEvent: 'redo',   description: 'Redo (Windows fallback)' },
  { chord: 'Backspace',   uiEvent: 'remove', description: 'Remove focused option', scope: 'item' },
  { chord: 'Delete',      uiEvent: 'remove', description: 'Remove focused option', scope: 'item' },
  { chord: 'mod+shift+v', uiEvent: 'paste',  description: 'Paste as child of focused option', scope: 'item' },
  // editable 모드 chord (opts.editable=true 일 때만 활성)
  // NOTE: Backspace=remove 는 base 에 이미 등록됨(line 80) — editable 도 동일 emit 이라 중복 descriptor 금지.
  { chord: LISTBOX_EDIT_INSERT[0], uiEvent: 'insertAfter', description: 'Insert sibling option — editable mode', scope: 'item' },
  // clipboard React events
  { chord: 'clipboard:copy',  uiEvent: 'copy',  description: 'Copy focused option (React onCopy)',   scope: 'item' },
  { chord: 'clipboard:cut',   uiEvent: 'cut',   description: 'Cut focused option (React onCut)',     scope: 'item' },
  { chord: 'clipboard:paste', uiEvent: 'paste', description: 'Paste onto focused option (React onPaste)', scope: 'item' },
]

// multiSelect must precede navigate — otherwise navigate matches Shift+Arrow first and the range branch never runs.
/**
 * Listbox 가 등록하는 axis — SSOT. 데모/문서는 `axis.chords` 직접 read.
 * 옵션을 그대로 받아 동일한 합성을 노출.
 */
export const listboxAxis = (opts: ListboxOptions = {}) => {
  const orientation = opts.orientation ?? 'vertical'
  return opts.multiSelectable
    ? composeAxes(multiSelect, navigate(orientation), activate, typeahead)
    : composeAxes(navigate(orientation), activate, typeahead)
}

/**
 * listbox — APG `/listbox/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * @example canonical
 *   const [data, dispatch] = useListboxReducer(ITEMS)
 *   const { rootProps, optionProps, items } = useListboxPattern(data, dispatch)
 *
 * @example multi-select — `multi: true` 옵션
 *   const [data, dispatch] = useListboxReducer(ITEMS, { multi: true })
 *   const props = useListboxPattern(data, dispatch, { multiSelectable: true })
 *
 * @example escape — React `useReducer` 직접 (custom init / 합성)
 *   const [data, dispatch] = useReducer(reduceSingleSelect, ITEMS, fromList)
 *   const props = useListboxPattern(data, dispatch)
 */
export function useListboxPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: ListboxOptions = {},
): {
  rootProps: RootProps
  optionProps: (id: string) => ItemProps
  groupProps: (groupId: string) => ItemProps
  items: BaseItem[]
  groups: { id: string; label: string; options: BaseItem[] }[]
} {
  const {
    multiSelectable, autoFocus, containerId = ROOT, orientation = 'vertical',
    required, readOnly, invalid, disabled, label, labelledBy,
    groups: groupsOpt, rearrangeable, editable = false, idPrefix = 'lb',
    insideEditable = 'forward',
  } = opts
  const sff = opts.selectionFollowsFocus ?? !multiSelectable
  if (multiSelectable) warnMultiSelectPairing('useListboxPattern')

  const relay = useCallback(
    (e: UiEvent) => {
      if (!onEvent) return
      const out = sff ? applySelectionFollowsFocus(data, e) : [e]
      out.forEach(onEvent)
    },
    [data, onEvent, sff],
  )

  // groups 모드: ROOT 자식 = group, 각 group 자식 = option. 평면 ids 는 모든 option.
  const directChildren = getCollectionChildren(data, containerId)
  const groupIds = groupsOpt ? directChildren : []
  const ids = groupsOpt
    ? groupIds.flatMap((gid) => getChildren(data, gid))
    : directChildren

  // grouped listbox 의 키보드 순회는 group 경계를 무시한 flat 순회 (APG `listbox-grouped` 표준).
  // navigate axis 는 sibling 그래프(parent=group)를 따르므로 group 안에서만 wrap 한다 — 이를 피하려고
  // 옵션을 ROOT 직속으로 재배치한 합성 데이터를 useRovingTabIndex 에 통과시킨다. 렌더링용 data 는 원본 유지.
  const navData: NormalizedData = groupsOpt
    ? { entities: data.entities, relationships: {}, meta: { ...data.meta, root: ids } }
    : data

  const axis = listboxAxis(opts)
  const { focusId, bindFocus, delegate } = useRovingTabIndex(axis, navData, relay, {
    autoFocus,
    containerId: groupsOpt ? ROOT : containerId,
  })

  const items: BaseItem[] = ids.map((id, i) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: Boolean(ent.selected),
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: ids.length,
    }
  })
  const itemMap = new Map(items.map((it) => [it.id, it]))
  const groups = groupIds.map((gid) => {
    const optionIds = getChildren(data, gid)
    return {
      id: gid,
      label: getLabel(data, gid),
      options: optionIds.map((oid) => itemMap.get(oid)!).filter(Boolean),
    }
  })
  const groupLabelDomId = (gid: string) => `${idPrefix}-glbl-${gid}`

  const editKeyDown = editable
    ? (e: React.KeyboardEvent) => {
        const id = focusId
        if (id && id !== containerId) {
          if (matchAnyChord(e as unknown as KeyboardEvent, LISTBOX_EDIT_INSERT)) {
            e.preventDefault()
            relay({ type: 'insertAfter', siblingId: id })
            return
          }
          if (matchAnyChord(e as unknown as KeyboardEvent, LISTBOX_EDIT_REMOVE)) {
            e.preventDefault()
            relay({ type: 'remove', id })
            return
          }
        }
        delegate.onKeyDown(e)
      }
    : delegate.onKeyDown

  const activeId = focusId && focusId !== containerId ? focusId : null

  const clipboard = usePatternClipboard({
    onEvent,
    activeId,
    insideEditable,
    on: opts.on,
    builtinChords: listboxKeys,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    editKeyDown(e)
    if (e.defaultPrevented) return
    clipboard.handleKeyDown(e)
  }

  const rootProps: RootProps = {
    role: 'listbox',
    'aria-multiselectable': multiSelectable || undefined,
    'aria-orientation': orientation,
    'aria-required': required || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-invalid': invalid || undefined,
    'aria-disabled': disabled || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...(rearrangeable ? { 'data-rearrangeable': '' } : {}),
    ...delegate,
    onKeyDown: handleKeyDown,
    onCopy: clipboard.onCopy,
    onCut: clipboard.onCut,
    onPaste: clipboard.onPaste,
  } as RootProps

  const optionProps = (id: string): ItemProps => {
    const it = itemMap.get(id)
    const isFocus = focusId === id
    return {
      role: 'option',
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-selected': it?.selected ?? false,
      'aria-disabled': it?.disabled || undefined,
      'aria-posinset': it?.posinset,
      'aria-setsize': it?.setsize,
      'data-selected': it?.selected ? '' : undefined,
      'data-disabled': it?.disabled ? '' : undefined,
      'data-focus-visible': isFocus ? '' : undefined,
    } as unknown as ItemProps
  }

  const groupProps = (groupId: string): ItemProps => ({
    role: 'group',
    'data-id': groupId,
    'aria-labelledby': groupLabelDomId(groupId),
  } as unknown as ItemProps)

  return { rootProps, optionProps, groupProps, items, groups }
}

/** group 의 label 요소에 부여할 id (소비자가 groupProps 의 aria-labelledby 와 매칭). */
export const groupLabelId = (idPrefix: string, gid: string): string =>
  `${idPrefix}-glbl-${gid}`

// editable 모드의 chord 어휘는 commands prop 으로 앱이 선언 (SSOT). default 제공.
import { useCallback } from 'react'
import {
  ROOT, getChildren, getCollectionChildren, getLabel, isDisabled, getExpanded,
  type NormalizedData, type UiEvent,
} from '../types'
import { activate, composeAxes, multiSelect, treeExpand, treeNavigate, typeahead } from '../axes'
import { matchEventToChord } from '../axes/chord'
import type { InsideEditableMode } from '../key/insideEditable'
import { usePatternClipboard, type ClipboardOnMiddleware } from './usePatternClipboard'
import { selectionFollowsFocus as applySelectionFollowsFocus } from '../gesture'
import { useRovingTabIndex } from '../roving/useRovingTabIndex'
import type {
  BuiltinChordDescriptor, ItemProps, RootProps, TreeItem,
  TreeAxis, EffectStep, Effect, TreeCommandDescriptor,
} from './types'
import { warnMultiSelectPairing } from './devWarnMultiSelect'

/**
 * defaultTreeCommands — editable tree 의 기본 keymap (chord ↔ effect SSOT).
 * 모든 비즈니스 로직이 effect 데이터로 직렬화돼 있음 — 새 command 추가는 entry 한 줄,
 * 라이브러리(runEffect) 변경 없음 (axis/op 어휘 내에서 표현 가능한 한).
 */
export const defaultTreeCommands: readonly TreeCommandDescriptor[] = [
  { chord: 'Enter',       command: 'editStart',     description: 'Rename — enter inline edit',
    effect: { op: 'editStart' } },
  { chord: 'Shift+Enter', command: 'insertAfter',   description: 'Insert sibling (or child if root)',
    // self has parent → insertAfter sibling; root-level → appendChild on self
    effect: { op: 'insertAfter', source: 'self', fallback: { op: 'appendChild', source: 'self' } } },
  { chord: 'Backspace',   command: 'remove',        description: 'Remove focused item',
    effect: { op: 'remove' } },
  { chord: 'Delete',      command: 'remove',        description: 'Remove focused item',
    effect: { op: 'remove' } },
  { chord: 'Tab',         command: 'demote',        description: 'Demote (move under previous sibling)',
    effect: { op: 'move', source: 'self', target: 'prevSibling', mode: 'child' } },
  { chord: 'Shift+Tab',   command: 'promote',       description: 'Promote (move out of parent)',
    // Workflowy/Roam 정본: following siblings 가 promoted 의 자식으로 흡수된 뒤, self 가 parent 의 sibling-after
    effect: [
      { op: 'move', source: 'followingSiblings', target: 'self', mode: 'child' },
      { op: 'move', source: 'self', target: 'parent', mode: 'sibling-after' },
    ] },
  { chord: 'mod+z',       command: 'undo',          description: 'Undo last operation',
    effect: { op: 'undo' } },
  { chord: 'mod+shift+z', command: 'redo',          description: 'Redo',
    effect: { op: 'redo' } },
  { chord: 'mod+y',       command: 'redo',          description: 'Redo (Windows fallback)',
    effect: { op: 'redo' } },
  { chord: 'mod+shift+v', command: 'paste-as-child', description: 'Paste as child of focused item',
    effect: { op: 'paste', source: 'self', mode: 'child' } },
]

/** treeBuiltinChords — backward-compat. KeymapPanel 등이 쓰던 옛 SSOT 의 default keymap 형태. */
export const treeBuiltinChords: readonly BuiltinChordDescriptor[] = defaultTreeCommands.map((c) => ({
  chord: c.chord,
  uiEvent: c.command ?? (Array.isArray(c.effect) ? c.effect[0]?.op : (c.effect as EffectStep).op) ?? '',
  description: c.description ?? '',
  scope: 'item',
}))

/** Options for {@link useTreePattern}. */
export interface TreeOptions {
  orientation?: 'horizontal' | 'vertical'
  selectionFollowsFocus?: boolean
  multiSelectable?: boolean
  autoFocus?: boolean
  containerId?: string
  label?: string
  labelledBy?: string
  variant?: 'select' | 'navigation'
  /**
   * editable 모드 — true 면 commands(미지정 시 defaultTreeCommands) 가 활성. false 면 chord 어휘 비활성(읽기-only).
   */
  editable?: boolean
  /**
   * 사용자 chord ↔ command keymap. 앱이 SSOT 로 선언 — chord 추가/제거/재배치 자유.
   * 미지정 + editable=true → defaultTreeCommands. 미지정 + editable=false → [] (chord 비활성).
   */
  commands?: readonly TreeCommandDescriptor[]
  insideEditable?: InsideEditableMode
  on?: ClipboardOnMiddleware
}

const findParent = (data: NormalizedData, id: string): string | null => {
  for (const [pid, kids] of Object.entries(data.relationships)) {
    if (kids.includes(id)) return pid
  }
  return null
}

const eventItemId = (e: React.KeyboardEvent): string | null =>
  (e.target as Element).closest<HTMLElement>('[data-id]')?.dataset.id ?? null

/** Tree 가 등록하는 axis — SSOT. */
export const treeAxis = (opts: { multiSelectable?: boolean } = {}) =>
  opts.multiSelectable
    ? composeAxes(multiSelect, treeNavigate, treeExpand, activate, typeahead)
    : composeAxes(treeNavigate, treeExpand, activate, typeahead)
const singleAxis = treeAxis()
const multiAxis = treeAxis({ multiSelectable: true })

/**
 * resolveAxis — focus 노드 기준 TreeAxis 를 NormalizedData 위에서 평가.
 * 단수 axis 는 string|null, 복수 axis(`*Siblings`)는 string[] 를 반환.
 */
function resolveAxis(
  axis: TreeAxis,
  focusId: string,
  data: NormalizedData,
  containerId: string,
): string | string[] | null {
  switch (axis) {
    case 'self': return focusId
    case 'parent': {
      const p = findParent(data, focusId)
      return p && p !== containerId ? p : null
    }
    case 'prevSibling':
    case 'nextSibling': {
      const p = findParent(data, focusId) ?? containerId
      const sibs = data.relationships[p] ?? []
      const idx = sibs.indexOf(focusId)
      if (idx < 0) return null
      const next = axis === 'prevSibling' ? idx - 1 : idx + 1
      return sibs[next] ?? null
    }
    case 'firstChild':
    case 'lastChild': {
      const kids = data.relationships[focusId] ?? []
      return axis === 'firstChild' ? (kids[0] ?? null) : (kids[kids.length - 1] ?? null)
    }
    case 'followingSiblings':
    case 'precedingSiblings': {
      const p = findParent(data, focusId) ?? containerId
      const sibs = data.relationships[p] ?? []
      const idx = sibs.indexOf(focusId)
      if (idx < 0) return []
      return axis === 'followingSiblings' ? sibs.slice(idx + 1) : sibs.slice(0, idx)
    }
  }
}

const isEmpty = (r: string | string[] | null): boolean =>
  r == null || (Array.isArray(r) && r.length === 0)

/**
 * runStep — Effect 한 step 을 UiEvent 로 변환해 relay. axis 미해결 시 false 반환 → caller 가
 * fallback 시도. 새 op 어휘 추가는 이 switch 에 case 1줄, 새 axis 는 resolveAxis 에 case 1줄.
 */
function runStep(
  step: EffectStep,
  focusId: string | null,
  data: NormalizedData,
  containerId: string,
  relay: (e: UiEvent) => void,
): boolean {
  if (step.op === 'undo' || step.op === 'redo') {
    relay({ type: step.op })
    return true
  }
  if (!focusId || focusId === containerId) return false

  const sourceR = resolveAxis(step.source ?? 'self', focusId, data, containerId)
  if (isEmpty(sourceR)) return false
  const sources = Array.isArray(sourceR) ? sourceR : [sourceR as string]

  let targetId: string | null = null
  if (step.target) {
    const t = resolveAxis(step.target, focusId, data, containerId)
    if (isEmpty(t)) return false
    targetId = Array.isArray(t) ? t[0] : t
  }

  for (const id of sources) {
    switch (step.op) {
      case 'editStart':   relay({ type: 'editStart', id }); break
      case 'insertAfter': relay({ type: 'insertAfter', siblingId: id }); break
      case 'appendChild': relay({ type: 'appendChild', parentId: id }); break
      case 'remove':      relay({ type: 'remove', id }); break
      case 'copy':        relay({ type: 'copy', id }); break
      case 'cut':         relay({ type: 'cut', id }); break
      case 'move':
        if (targetId) relay({ type: 'move', id, targetId, mode: step.mode === 'child' || step.mode === 'sibling-after' || step.mode === 'sibling-before' ? step.mode : 'child' })
        break
      case 'paste': {
        const mode = step.mode === 'child' || step.mode === 'auto' || step.mode === 'overwrite' ? step.mode : undefined
        relay({ type: 'paste', targetId: targetId ?? id, mode })
        break
      }
    }
  }
  return true
}

/** insertAfter 는 self.parent 가 root 면 의미 없음 → fallback (appendChild) 가 필요. 별도 가드. */
function runInsertAfterGuard(
  step: EffectStep,
  focusId: string,
  data: NormalizedData,
  containerId: string,
): boolean {
  if (step.op !== 'insertAfter') return true
  const p = findParent(data, focusId)
  return Boolean(p && p !== containerId)
}

/** runEffect — Effect (단일 step | 배열) 를 순차 실행. 미해결 step 은 fallback 시도. */
function runEffect(
  effect: Effect,
  focusId: string | null,
  data: NormalizedData,
  containerId: string,
  relay: (e: UiEvent) => void,
): void {
  const steps = Array.isArray(effect) ? effect : [effect as EffectStep]
  for (const step of steps) {
    const guardOk = focusId ? runInsertAfterGuard(step, focusId, data, containerId) : true
    const ok = guardOk && runStep(step, focusId, data, containerId, relay)
    if (!ok && step.fallback) runStep(step.fallback, focusId, data, containerId, relay)
  }
}

/**
 * tree — APG `/treeview/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 *
 * @example canonical — tree 데이터 + expand gesture (pipe)
 *   const expand = (r) => applyGesture(expandBranchOnActivate, r)
 *   const [data, dispatch] = useTreeReducer(NODES, { enhance: expand })
 *   const { rootProps, itemProps, items } = useTreePattern(data, dispatch)
 *
 * @example multi-select — `multi: true` (두 곳 모두 설정 필요)
 *   const [data, dispatch] = useTreeReducer(NODES, { multi: true, enhance: expand })
 *   const props = useTreePattern(data, dispatch, { multiSelectable: true })
 */
export function useTreePattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: TreeOptions = {},
): {
  rootProps: RootProps
  itemProps: (id: string) => ItemProps
  items: TreeItem[]
  editProps: (id: string) => null | { initial: string; onCommit: (value: string, cancelled: boolean) => void }
} {
  const {
    autoFocus, multiSelectable, containerId = ROOT, orientation = 'vertical',
    label, labelledBy, variant = 'select', editable = false,
    insideEditable = 'forward',
  } = opts
  const sff = opts.selectionFollowsFocus ?? !multiSelectable
  if (multiSelectable) warnMultiSelectPairing('useTreePattern')

  // commands SSOT 결정 — 앱이 명시 > editable=true 면 default > 그 외 빈 배열.
  const commands: readonly TreeCommandDescriptor[] =
    opts.commands ?? (editable ? defaultTreeCommands : [])

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
        id,
        label: getLabel(data, id),
        selected: Boolean(ent.selected),
        disabled: isDisabled(data, id),
        level,
        expanded: isExpanded,
        hasChildren: kids.length > 0,
        posinset: i + 1,
        setsize: children.length,
      })
      if (isExpanded) walk(id, level + 1)
    })
  }
  walk(containerId, 1)
  const itemMap = new Map(flat.map((it) => [it.id, it]))

  // 단일 chord dispatcher — commands 배열 순회. 매칭되면 preventDefault + runEffect.
  const dispatchCommandChord = (e: React.KeyboardEvent): boolean => {
    for (const desc of commands) {
      if (matchEventToChord(e.nativeEvent, desc.chord)) {
        e.preventDefault()
        runEffect(desc.effect, eventItemId(e) ?? focusId, data, containerId, relay)
        return true
      }
    }
    return false
  }

  const activeId = focusId && focusId !== containerId ? focusId : null

  // clipboard event handlers (onCopy/onCut/onPaste) 만 — chord 는 위 dispatcher 가 흡수
  const clipboard = usePatternClipboard({
    onEvent,
    activeId,
    insideEditable,
    on: opts.on,
    builtinChords: treeBuiltinChords,
    disableBuiltinChords: true,  // tree 가 자체 commands 로 모든 chord 처리
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (dispatchCommandChord(e)) return
    delegate.onKeyDown(e)
    if (e.defaultPrevented) return
    clipboard.handleKeyDown(e)  // 'on' middleware 만 실행 (builtin chord 는 비활성)
  }

  const rootProps: RootProps = {
    role: 'tree',
    'aria-multiselectable': multiSelectable || undefined,
    'aria-orientation': orientation,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...delegate,
    onKeyDown: handleKeyDown,
    onCopy: clipboard.onCopy,
    onCut: clipboard.onCut,
    onPaste: clipboard.onPaste,
  } as RootProps

  const itemProps = (id: string): ItemProps => {
    const it = itemMap.get(id)
    const isFocus = focusId === id
    return {
      role: 'treeitem',
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      'data-id': id,
      tabIndex: isFocus ? 0 : -1,
      'aria-selected': it?.selected ?? false,
      'aria-current': variant === 'navigation' && it?.selected ? 'page' : undefined,
      'aria-disabled': it?.disabled || undefined,
      'aria-expanded': it?.hasChildren ? it.expanded : undefined,
      'aria-level': it?.level,
      'aria-posinset': it?.posinset,
      'aria-setsize': it?.setsize,
      'data-selected': it?.selected ? '' : undefined,
      'data-expanded': it?.expanded ? '' : undefined,
    } as unknown as ItemProps
  }

  const editingId = data.meta?.editing
  const editProps = (id: string) => {
    if (editingId !== id) return null
    const it = itemMap.get(id)
    return {
      initial: it?.label ?? '',
      onCommit: (value: string, cancelled: boolean) => {
        if (!cancelled) relay({ type: 'update', id, value })
        relay({ type: 'editEnd' })
      },
    }
  }

  return { rootProps, itemProps, items: flat, editProps }
}

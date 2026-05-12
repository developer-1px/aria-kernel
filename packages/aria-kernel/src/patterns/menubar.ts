import { useEffect, useRef, useState } from 'react'
import {
  ROOT, getChildren, getCollectionChildren, getLabel, isDisabled,
  type NormalizedData, type UiEvent,
} from '../intent/events'
import {
  activate, axisKeys, composeAxes, escape, fromKeyMap,
  navigate, submenuOpen, submenuClose, submenuOpenDown, submenuOpenUp,
  typeahead, type Axis,
} from '../input/keyboard/axes'
import { bindAxis } from '../view-state/bind'
import { parentOf } from '../input/keyboard/axes/index'
import type { ItemProps, RootProps } from './types'
import type { MenuItem, MenuItemKind, MenuLevel } from './menuButton'

/**
 * crossTop — submenu 안에서 ArrowLeft/Right 가 인접 top 으로 점프하는 axis.
 * 이미 열린 submenu 를 닫고 인접 top 의 submenu 를 첫 자식 포커스로 연다.
 *
 * pre-condition: id 는 submenu 안의 menuitem (parentOf 가 top, parentOf(top)=ROOT).
 */
const crossTop: Axis = fromKeyMap([
  ['ArrowLeft', (d, id) => crossTopMove(d, id, -1)],
  ['ArrowRight', (d, id) => crossTopMove(d, id, +1)],
])

function crossTopMove(d: NormalizedData, id: string, delta: -1 | 1): UiEvent[] | null {
  const top = parentOf(d, id)
  if (!top) return null
  const grand = parentOf(d, top)
  if (grand !== ROOT) return null
  const tops = getCollectionChildren(d, ROOT).filter((t) => !isDisabled(d, t))
  const i = tops.indexOf(top)
  if (i < 0) return null
  const ni = ((i + delta) % tops.length + tops.length) % tops.length
  const nextTop = tops[ni]
  const nextSubs = getChildren(d, nextTop).filter((s) => !isDisabled(d, s))
  const events: UiEvent[] = [
    { type: 'expand', id: top, open: false },
    { type: 'navigate', id: nextTop },
  ]
  if (nextSubs[0]) {
    events.push({ type: 'expand', id: nextTop, open: true })
    events.push({ type: 'navigate', id: nextSubs[0] })
  }
  return events
}

/**
 * top axis — menubar item 키:
 *   ArrowLeft/Right         형제 wrap (navigate horizontal)
 *   ArrowDown               submenu open + first
 *   ArrowUp                 submenu open + last
 *   Enter/Space             activate (or open submenu if has children — composeAxes 순서로)
 *   Home/End                navigate start/end
 *   typeahead               first-char search
 */
const topAxis: Axis = composeAxes(
  navigate('horizontal'),
  submenuOpenDown,
  submenuOpenUp,
  // Enter/Space: parent 면 submenu open(+first), leaf 면 activate. submenuOpen 이 ArrowRight 만 받으므로
  // Enter/Space 는 별도 처리 — submenuOpenDown 과 동일 emit 형태.
  fromKeyMap([
    [['Enter', ' '], (d, id) => {
      const kids = getChildren(d, id).filter((k) => !isDisabled(d, k))
      if (!kids.length) return null
      return [{ type: 'expand', id, open: true }, { type: 'navigate', id: kids[0] }]
    }],
  ]),
  activate,
  typeahead,
)

/**
 * sub axis — submenu 안 menuitem 키:
 *   ArrowUp/Down           형제 wrap (vertical)
 *   Home/End               navigate start/end
 *   ArrowRight             자기 자식 submenu 열기 OR 인접 top 으로 (leaf 면 crossTop 으로 fallback)
 *   ArrowLeft              부모 submenu 닫기 + 부모 refocus OR 인접 top 으로 (root 의 child 면 crossTop)
 *   Enter/Space            activate (leaf) / submenu open (parent)
 *   Escape                 close all
 *   typeahead              first-char search
 */
const subAxis: Axis = composeAxes(
  navigate('vertical'),
  submenuOpen,                  // ArrowRight: 자식 있으면 열기
  submenuClose,                 // ArrowLeft: 부모 닫기
  crossTop,                     // ArrowLeft/Right 가 위 두 axis 에서 null 일 때 (leaf right / top-child left)
  activate,
  escape,
  typeahead,
)

/** Menubar 가 응답하는 chord 합집합 — keys SSOT. */
export const menubarAxis = (): Axis => composeAxes(topAxis, subAxis)

export interface MenubarOptions {
  autoFocus?: boolean
  label?: string
  labelledBy?: string
  idPrefix?: string
}

/**
 * menubar — APG `/menubar/` recipe (menubar-navigation example 기준).
 * https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/
 *
 * 데이터 모델 — 무제한 nested:
 *   ROOT
 *     ├─ top-1 (children: sub-1, sub-2, sub-3 …)
 *     │           sub-2 (children: sub-2-1, sub-2-2 …)   ← N-level OK
 *     ├─ top-2
 *     ⋮
 *
 * entity 필드:
 *   kind:    'menuitem' | 'menuitemcheckbox' | 'menuitemradio'
 *   checked: boolean | 'mixed'
 *   current: 'page' | etc — aria-current
 *
 * 키 매핑은 모두 axis 합성. inline switch 0.
 *
 * @example canonical — 트리 데이터
 *   const [data, dispatch] = useMenubarReducer(TREE)
 *   const { rootProps, menubarItemProps, topItems, getSubmenu } = useMenubarPattern(data, dispatch)
 */
export function useMenubarPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: MenubarOptions = {},
): {
  rootProps: RootProps
  menubarItemProps: (id: string) => ItemProps
  topItems: MenuItem[]
  /** 특정 top 의 submenu (열려있으면). 없으면 null. */
  getSubmenu: (parentId: string) => MenuLevel | null
  /** 현재 열린 submenu path (top 부터 leaf 부모까지). */
  openPath: string[]
} {
  const { autoFocus, label, labelledBy, idPrefix = 'mbar' } = opts
  const topIds = getCollectionChildren(data, ROOT).filter((id) => !isDisabled(data, id))

  const [activeTopId, setActiveTopId] = useState<string | null>(autoFocus ? topIds[0] ?? null : null)
  const [openPath, setOpenPath] = useState<string[]>([])
  const [activeSubId, setActiveSubId] = useState<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement | null>())

  const submenuDomId = (parentId: string) => `${idPrefix}-submenu-${parentId}`
  const itemDomId = (id: string) => `${idPrefix}-item-${id}`

  const closeAll = () => {
    setOpenPath([])
    setActiveSubId(null)
  }

  // roving — active 변경 시 .focus()
  useEffect(() => {
    const target = activeSubId ?? activeTopId
    if (!target) return
    itemRefs.current.get(target)?.focus({ preventScroll: true })
  }, [activeTopId, activeSubId])

  // outside click → close submenu (top focus 유지)
  useEffect(() => {
    if (!openPath.length) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      const inAny = Array.from(itemRefs.current.values()).some((el) => el?.contains(t))
      if (inAny) return
      closeAll()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openPath.length])

  const intent = (e: UiEvent) => {
    if (e.type === 'expand') {
      if (e.open) {
        setOpenPath((path) => {
          // top 으로 expand 면 새 path. 이미 다른 top 열려있으면 교체.
          if (topIds.includes(e.id)) return [e.id]
          // submenu 안에서 자식 expand → push
          return [...path, e.id]
        })
      } else {
        // close — id 가 path 안에 있으면 거기서 잘라냄
        setOpenPath((path) => {
          const idx = path.indexOf(e.id)
          if (idx >= 0) return path.slice(0, idx)
          // id 가 menuitem (자식) 이면 자기 부모를 path 에서 찾아 닫음
          const parent = parentOf(data, e.id)
          if (parent && path.includes(parent)) {
            const i = path.indexOf(parent)
            // 부모 닫고 부모로 focus 복귀
            setActiveSubId(parent === path[0] ? null : parent)
            if (parent === path[0]) setActiveTopId(parent)
            return path.slice(0, i)
          }
          return []
        })
      }
      return
    }
    if (e.type === 'navigate' && e.id) {
      if (topIds.includes(e.id)) {
        setActiveTopId(e.id)
        setActiveSubId(null)
        // top 이동 시 다른 top 의 submenu 가 열려있었으면 그건 expand 이벤트로 닫혀들어옴 (crossTop)
      } else {
        setActiveSubId(e.id)
      }
      return
    }
    if (e.type === 'activate' && e.id) {
      const ent = data.entities[e.id] ?? {}
      if (ent.kind === 'menuitemcheckbox') {
        const next = ent.checked === 'mixed' ? true : !ent.checked
        onEvent?.({ type: 'check', ids: [e.id], to: next })
        return
      }
      if (ent.kind === 'menuitemradio') {
        const parent = parentOf(data, e.id) ?? ROOT
        const sibs = getChildren(data, parent)
        for (const sid of sibs) {
          const sEnt = data.entities[sid] ?? {}
          if (sEnt.kind === 'menuitemradio' && sid !== e.id && sEnt.checked) {
            onEvent?.({ type: 'check', ids: [sid], to: false })
          }
        }
        onEvent?.({ type: 'check', ids: [e.id], to: true })
        return
      }
      onEvent?.(e)
      closeAll()
      return
    }
    if (e.type === 'open' && !e.open) {
      // Escape — 가장 안쪽 submenu 닫고 부모 refocus. path 비어있으면 menubar 에서는 무시.
      if (openPath.length) {
        const last = openPath[openPath.length - 1]
        setOpenPath((path) => path.slice(0, -1))
        if (openPath.length === 1) {
          setActiveSubId(null)
          setActiveTopId(last)
        } else {
          setActiveSubId(last)
        }
      }
      return
    }
    onEvent?.(e)
  }

  const topBind = bindAxis(topAxis, data, intent)
  const subBind = bindAxis(subAxis, data, intent)

  const topItems: MenuItem[] = topIds.map((id, i) => {
    const ent = data.entities[id] ?? {}
    return {
      id,
      label: getLabel(data, id),
      selected: false,
      disabled: isDisabled(data, id),
      posinset: i + 1,
      setsize: topIds.length,
      kind: (ent.kind as MenuItemKind | undefined) ?? 'menuitem',
      checked: undefined,
      hasSubmenu: getChildren(data, id).length > 0,
      submenuOpen: openPath[0] === id,
      current: ent.current as MenuItem['current'],
    }
  })

  const rootProps: RootProps = {
    role: 'menubar',
    'aria-orientation': 'horizontal',
    'aria-label': label,
    'aria-labelledby': labelledBy,
  } as unknown as RootProps

  const menubarItemProps = (id: string): ItemProps => {
    const item = topItems.find((x) => x.id === id)!
    const isActive = activeTopId === id && !activeSubId
    const hasSub = item.hasSubmenu
    const isOpen = openPath[0] === id
    return {
      role: 'menuitem',
      id: itemDomId(id),
      'data-id': id,
      'aria-disabled': item.disabled || undefined,
      'aria-haspopup': hasSub ? 'menu' : undefined,
      'aria-expanded': hasSub ? isOpen : undefined,
      'aria-controls': hasSub ? submenuDomId(id) : undefined,
      'aria-current': item.current,
      'data-state': hasSub ? (isOpen ? 'open' : 'closed') : undefined,
      'data-active': isActive ? '' : undefined,
      ref: ((el: HTMLElement | null) => {
        itemRefs.current.set(id, el)
      }) as unknown as React.Ref<HTMLElement>,
      tabIndex: activeTopId === id ? 0 : -1,
      onClick: () => {
        if (item.disabled) return
        if (hasSub) {
          if (isOpen) {
            closeAll()
            setActiveTopId(id)
          } else {
            setOpenPath([id])
            const firstChild = getChildren(data, id).filter((k) => !isDisabled(data, k))[0]
            if (firstChild) setActiveSubId(firstChild)
          }
          return
        }
        intent({ type: 'activate', id })
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (topBind.onKey(e, id)) e.stopPropagation()
      },
    } as unknown as ItemProps
  }

  const buildLevel = (parentId: string): MenuLevel => {
    const ids = getChildren(data, parentId).filter((id) => !isDisabled(data, id))
    const items: MenuItem[] = ids.map((id, i) => {
      const ent = data.entities[id] ?? {}
      const kind = (ent.kind as MenuItemKind | undefined) ?? 'menuitem'
      const rawChecked = ent.checked
      const checked: boolean | 'mixed' | undefined =
        kind === 'menuitem' ? undefined
          : rawChecked === 'mixed' ? 'mixed'
          : Boolean(rawChecked)
      return {
        id,
        label: getLabel(data, id),
        selected: false,
        disabled: isDisabled(data, id),
        posinset: i + 1,
        setsize: ids.length,
        kind,
        checked,
        hasSubmenu: getChildren(data, id).length > 0,
        submenuOpen: openPath.includes(id),
        current: ent.current as MenuItem['current'],
      }
    })

    const menuProps: RootProps = {
      role: 'menu',
      id: submenuDomId(parentId),
      'aria-labelledby': itemDomId(parentId),
      'aria-orientation': 'vertical',
      tabIndex: -1,
    } as unknown as RootProps

    const itemProps = (id: string): ItemProps => {
      const item = items.find((x) => x.id === id)!
      const isActive = activeSubId === id
      const hasSub = item.hasSubmenu
      const isOpen = item.submenuOpen
      return {
        role: item.kind,
        id: itemDomId(id),
        'data-id': id,
        'aria-disabled': item.disabled || undefined,
        'aria-checked': item.checked,
        'aria-haspopup': hasSub ? 'menu' : undefined,
        'aria-expanded': hasSub ? isOpen : undefined,
        'aria-controls': hasSub ? submenuDomId(id) : undefined,
        'aria-current': item.current,
        'data-state': hasSub ? (isOpen ? 'open' : 'closed') : undefined,
        'data-active': isActive ? '' : undefined,
        'data-checked': item.checked === true ? '' : item.checked === 'mixed' ? 'mixed' : undefined,
        ref: ((el: HTMLElement | null) => {
          itemRefs.current.set(id, el)
        }) as unknown as React.Ref<HTMLElement>,
        tabIndex: isActive ? 0 : -1,
        onClick: () => {
          if (item.disabled) return
          if (hasSub) {
            if (isOpen) {
              setOpenPath((path) => path.filter((p) => p !== id))
              setActiveSubId(id)
            } else {
              setOpenPath((path) => [...path, id])
              const fc = getChildren(data, id).filter((k) => !isDisabled(data, k))[0]
              if (fc) setActiveSubId(fc)
            }
            return
          }
          intent({ type: 'activate', id })
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (subBind.onKey(e, id)) e.stopPropagation()
        },
      } as unknown as ItemProps
    }

    return { menuProps, itemProps, items }
  }

  const getSubmenu = (parentId: string): MenuLevel | null => {
    if (!openPath.includes(parentId)) return null
    return buildLevel(parentId)
  }

  return { rootProps, menubarItemProps, topItems, getSubmenu, openPath }
}

/** keys SSOT. */
export const menubarKeys = (): readonly string[] => axisKeys(menubarAxis())

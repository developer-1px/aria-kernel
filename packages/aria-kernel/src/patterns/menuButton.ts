import { useEffect, useRef, useState } from 'react'
import {
  ROOT, getChildren, getCollectionChildren, getLabel, isDisabled,
  type NormalizedData, type UiEvent,
} from '../types'
import {
  activate, axisKeys, composeAxes, escape, fromKeyMap, INTENT_CHORDS, navigate,
  submenuOpen, submenuClose, type Axis,
} from '../axes'
import { bindAxis } from '../state/bind'
import type { BaseItem, ItemProps, RootProps } from './types'

/**
 * trigger-state axis — closed 일 때 trigger button 키.
 *   ArrowDown / Enter / Space → open + first menuitem
 *   ArrowUp                   → open + last menuitem
 */
const triggerOpenAxis: Axis = fromKeyMap([
  [['ArrowDown', ...INTENT_CHORDS.activate.trigger],
    (d, id) => {
      const kids = getChildren(d, id).filter((k) => !isDisabled(d, k))
      const first = kids[0]
      return first
        ? [{ type: 'open', id, open: true }, { type: 'navigate', id: first }]
        : [{ type: 'open', id, open: true }]
    },
  ],
  ['ArrowUp',
    (d, id) => {
      const kids = getChildren(d, id).filter((k) => !isDisabled(d, k))
      const last = kids[kids.length - 1]
      return last
        ? [{ type: 'open', id, open: true }, { type: 'navigate', id: last }]
        : [{ type: 'open', id, open: true }]
    },
  ],
])

/**
 * menu-state axis — open 일 때 menuitem 키. 정본 합성:
 *   navigate('vertical')  ↑↓ Home/End (wrap)
 *   submenuOpen           → (parent only — leaf 에선 activate 로 흐름)
 *   submenuClose          ←
 *   activate              Enter/Space + Click
 *   escape                Escape
 */
const menuStateAxis: Axis = composeAxes(
  navigate('vertical'),
  submenuOpen,
  submenuClose,
  activate,
  escape,
)

/** menuButton 이 응답하는 chord 합집합 — keys 카탈로그 SSOT. */
export const menuButtonAxis = (): Axis => composeAxes(triggerOpenAxis, menuStateAxis)

export type MenuItemKind = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'

export interface MenuItem extends BaseItem {
  kind: MenuItemKind
  checked?: boolean | 'mixed'
  hasSubmenu: boolean
  submenuOpen: boolean
  /** aria-current — menubar-navigation 등에서 사용 */
  current?: 'page' | 'step' | 'location' | 'date' | 'time' | true
}

export interface MenuLevel {
  menuProps: RootProps
  itemProps: (id: string) => ItemProps
  items: MenuItem[]
}

export interface MenuButtonOptions {
  open?: boolean
  defaultOpen?: boolean
  focusMode?: 'roving' | 'activeDescendant'
  containerId?: string
  label?: string
  labelledBy?: string
  idPrefix?: string
}

/**
 * menu-button — APG `/menu-button/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * 키보드 처리는 axis 합성 정본:
 *   trigger(closed) → `triggerOpenAxis`
 *   menu(open)      → `menuStateAxis`
 *
 * N-level nested submenu 지원. data.entities[id].kind 로 menuitem /
 * menuitemcheckbox / menuitemradio 구분. data.entities[id].checked 로 체크 상태.
 * data.entities[id].current (aria-current) 도 흡수.
 *
 * Submenu 렌더 (재귀):
 *   const root = useMenuButtonPattern(data, ...)
 *   <Level data={root.rootLevel} pattern={root} />
 *   function Level({ data: lv, pattern }) {
 *     return <ul {...lv.menuProps}>{lv.items.map(it => (
 *       <li {...lv.itemProps(it.id)}>
 *         {it.label}
 *         {it.submenuOpen && <Level data={pattern.getSubmenu(it.id)!} pattern={pattern} />}
 *       </li>
 *     ))}</ul>
 *   }
 *
 * @example canonical 합성 (#148 §4)
 *   const [data, dispatch] = useReducer(reduceWithDefaults, MENU, fromTree)
 *   const { triggerProps, rootLevel, getSubmenu } = useMenuButtonPattern(data, dispatch)
 */
export function useMenuButtonPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: MenuButtonOptions = {},
): {
  triggerProps: ItemProps
  rootLevel: MenuLevel
  getSubmenu: (parentId: string) => MenuLevel | null
  /** root level alias */
  menuProps: RootProps
  /** root level alias */
  itemProps: (id: string) => ItemProps
  /** root level alias */
  items: MenuItem[]
  open: boolean
  setOpen: (open: boolean) => void
  /** 현재 열려있는 submenu path (root → leaf). UI 가 어떤 부모들이 expand 인지 알기 위해. */
  openPath: string[]
} {
  const {
    open: openProp,
    defaultOpen = false,
    focusMode = 'roving',
    containerId = ROOT,
    label, labelledBy,
    idPrefix = 'mb',
  } = opts

  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
  }

  const triggerRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement | null>())

  /** 열린 submenu 들의 부모 id chain. [] = root menu only. */
  const [openPath, setOpenPath] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const triggerDomId = `${idPrefix}-trigger`
  const rootMenuId = `${idPrefix}-menu`
  const submenuDomId = (parentId: string) => `${idPrefix}-submenu-${parentId}`
  const itemDomId = (id: string) => `${idPrefix}-item-${id}`

  /** 어떤 id 가 어떤 parentId 아래 있는지 — submenu 추적용. */
  const parentOfItem = (id: string): string | null => {
    for (const [pid, kids] of Object.entries(data.relationships)) {
      if (kids.includes(id)) return pid
    }
    return null
  }

  const closeAndReturnFocus = () => {
    setOpen(false)
    setActiveId(null)
    setOpenPath([])
    triggerRef.current?.focus({ preventScroll: true })
  }

  // roving — activeId 변경 시 .focus() 동기화
  useEffect(() => {
    if (!open || focusMode !== 'roving') return
    if (!activeId) return
    itemRefs.current.get(activeId)?.focus({ preventScroll: true })
  }, [open, activeId, focusMode])

  // outside click → close all
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (triggerRef.current?.contains(t)) return
      // 모든 menu DOM 안 클릭은 통과
      const inAnyMenu = Array.from(itemRefs.current.values()).some((el) => el?.contains(t))
      if (inAnyMenu) return
      setOpen(false)
      setActiveId(null)
      setOpenPath([])
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const intent = (e: UiEvent) => {
    if (e.type === 'open') {
      if (e.open) setOpen(true)
      else closeAndReturnFocus()
      return
    }
    if (e.type === 'expand') {
      if (e.open) {
        // submenu open — path push
        setOpenPath((path) => [...path, e.id])
        // navigate 가 함께 들어옴 (submenuOpen axis가 첫 자식 navigate emit)
      } else {
        // submenu close — current 가 leaf-of-path 이면 path pop + 부모 refocus
        // ArrowLeft 시 e.id 는 현재 활성 menuitem (자식). 그 부모를 path 에서 찾음.
        const parent = parentOfItem(e.id)
        if (parent && openPath.includes(parent)) {
          setOpenPath((path) => path.filter((p) => p !== parent))
          setActiveId(parent)
        } else {
          // 이미 root level — close all
          closeAndReturnFocus()
        }
      }
      return
    }
    if (e.type === 'navigate') {
      setActiveId(e.id ?? null)
      return
    }
    if (e.type === 'activate') {
      const ent = data.entities[e.id] ?? {}
      const kind = (ent.kind as MenuItemKind | undefined) ?? 'menuitem'
      // checkbox/radio 는 메뉴 닫지 않음 (APG: 토글만, 메뉴 유지)
      if (kind === 'menuitemcheckbox') {
        const cur = ent.checked
        const next = cur === 'mixed' ? true : !cur
        onEvent?.({ type: 'check', ids: [e.id], to: next })
        return
      }
      if (kind === 'menuitemradio') {
        // 같은 부모의 모든 radio sibling unchecked, 자기는 checked
        const parent = parentOfItem(e.id) ?? containerId
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
      // plain menuitem — activate + close all
      onEvent?.(e)
      closeAndReturnFocus()
      return
    }
    onEvent?.(e)
  }

  const triggerBind = bindAxis(triggerOpenAxis, data, intent)
  const menuBind = bindAxis(menuStateAxis, data, intent)

  const triggerProps: ItemProps = {
    type: 'button',
    id: triggerDomId,
    ref: triggerRef as React.Ref<HTMLElement>,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': rootMenuId,
    'aria-activedescendant': focusMode === 'activeDescendant' && open && activeId
      ? itemDomId(activeId) : undefined,
    onClick: () => {
      const next = !open
      setOpen(next)
      if (next) {
        const firstId = getCollectionChildren(data, containerId).filter((k) => !isDisabled(data, k))[0] ?? null
        setActiveId(firstId)
      } else {
        setActiveId(null)
        setOpenPath([])
      }
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!open) {
        triggerBind.onKey(e, containerId)
        return
      }
      if (focusMode === 'activeDescendant') {
        menuBind.onKey(e, activeId ?? containerId)
      }
    },
  } as unknown as ItemProps

  /** 한 레벨의 menu props/itemProps 빌더 — root + submenu 공유. */
  const buildLevel = (parentId: string, isRoot: boolean): MenuLevel => {
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
      id: isRoot ? rootMenuId : submenuDomId(parentId),
      'aria-labelledby': isRoot ? (labelledBy ?? triggerDomId) : itemDomId(parentId),
      'aria-label': isRoot ? label : undefined,
      'aria-orientation': 'vertical',
      hidden: isRoot ? !open || undefined : undefined,
      tabIndex: -1,
    } as unknown as RootProps

    const itemProps = (id: string): ItemProps => {
      const item = items.find((x) => x.id === id)!
      const isActive = activeId === id
      const disabled = item.disabled
      const checked = item.checked
      const hasSub = item.hasSubmenu
      const isOpen = item.submenuOpen
      return {
        role: item.kind,
        id: itemDomId(id),
        'data-id': id,
        'aria-disabled': disabled || undefined,
        'aria-checked': checked,
        'aria-haspopup': hasSub ? 'menu' : undefined,
        'aria-expanded': hasSub ? isOpen : undefined,
        'aria-controls': hasSub ? submenuDomId(id) : undefined,
        'aria-current': item.current,
        'data-active': isActive ? '' : undefined,
        'data-state': hasSub ? (isOpen ? 'open' : 'closed') : undefined,
        'data-checked': checked === true ? '' : checked === 'mixed' ? 'mixed' : undefined,
        ref: ((el: HTMLElement | null) => {
          itemRefs.current.set(id, el)
        }) as unknown as React.Ref<HTMLElement>,
        tabIndex: focusMode === 'roving' ? (isActive ? 0 : -1) : -1,
        onClick: () => {
          if (disabled) return
          if (hasSub) {
            // parent menuitem click → submenu toggle
            if (isOpen) {
              setOpenPath((path) => path.filter((p) => p !== id))
            } else {
              setOpenPath((path) => [...path, id])
              const firstChild = getChildren(data, id).filter((k) => !isDisabled(data, k))[0]
              if (firstChild) setActiveId(firstChild)
            }
            return
          }
          // leaf — activate via intent (checkbox/radio/plain 분기 흡수)
          intent({ type: 'activate', id })
        },
        onKeyDown: focusMode === 'roving'
          ? (e: React.KeyboardEvent) => {
              if (menuBind.onKey(e, id)) e.stopPropagation()
            }
          : undefined,
      } as unknown as ItemProps
    }

    return { menuProps, itemProps, items }
  }

  const rootLevel = buildLevel(containerId, true)

  const getSubmenu = (parentId: string): MenuLevel | null => {
    if (!openPath.includes(parentId)) return null
    return buildLevel(parentId, false)
  }

  return {
    triggerProps,
    rootLevel,
    getSubmenu,
    // backward-compat aliases — root level 그대로 노출.
    menuProps: rootLevel.menuProps,
    itemProps: rootLevel.itemProps,
    items: rootLevel.items,
    open,
    setOpen,
    openPath,
  }
}

/** keys SSOT — axisKeys 정본 사용. */
export const menuButtonKeys = (): readonly string[] => axisKeys(menuButtonAxis())

import { useEffect, useRef, useState } from 'react'
import {
  ROOT, getChildren, getCollectionChildren, getLabel, isDisabled,
  type NormalizedData, type UiEvent,
} from '../types'
import {
  activate, axisKeys, composeAxes, escape, navigate,
  submenuOpen, submenuClose, typeahead, matchAnyChord,
  type Axis,
} from '../axes'
import { bindAxis } from '../state/bind'
import { parentOf } from '../axes/index'
import type { ItemProps, RootProps } from './types'
import type { MenuItem, MenuItemKind, MenuLevel } from './menuButton'

/** menu trigger button chord registry — declarative SSOT (open 트리거 키). */
const TRIGGER_OPEN_CHORDS = ['ArrowDown'] as const
export const menuButtonTriggerKeys = (): readonly string[] => [...TRIGGER_OPEN_CHORDS]

/**
 * menu axis — vertical menu 의 키. menubar 의 subAxis 와 동일 합성.
 *   navigate('vertical')   ↑↓ wrap, Home/End
 *   submenuOpen            → (parent only — leaf 면 activate 로 흐름)
 *   submenuClose           ←
 *   activate               Enter/Space + Click
 *   escape                 Escape
 *   typeahead              first-char search
 */
const menuVerticalAxis: Axis = composeAxes(
  navigate('vertical'),
  submenuOpen,
  submenuClose,
  activate,
  escape,
  typeahead,
)

const menuHorizontalAxis: Axis = composeAxes(
  navigate('horizontal'),
  submenuOpen,
  submenuClose,
  activate,
  escape,
  typeahead,
)

const menuVerticalAxisFlat: Axis = composeAxes(
  navigate('vertical'),
  activate,
  escape,
  typeahead,
)

const menuHorizontalAxisFlat: Axis = composeAxes(
  navigate('horizontal'),
  activate,
  escape,
  typeahead,
)

/**
 * Menu 가 응답하는 chord 합집합 — keys SSOT.
 * `hasSubmenu: false` 시 submenu open/close (ArrowRight/Left) 키 제외.
 */
export const menuAxis = (opts: {
  orientation?: 'horizontal' | 'vertical'
  hasSubmenu?: boolean
} = {}): Axis => {
  const horizontal = opts.orientation === 'horizontal'
  const flat = opts.hasSubmenu === false
  if (horizontal) return flat ? menuHorizontalAxisFlat : menuHorizontalAxis
  return flat ? menuVerticalAxisFlat : menuVerticalAxis
}

export interface MenuOptions {
  /** aria-orientation. default 'vertical'. */
  orientation?: 'horizontal' | 'vertical'
  /** plain menuitem activate 시 자동 close (default true). */
  closeOnSelect?: boolean
  autoFocus?: boolean
  onEscape?: () => void
  /**
   * outside-close — open 인 동안 document mousedown 을 듣고 root menu 외부에서
   * 클릭이 발생하면 호출. ARIA punt 자리(spec 본문은 backdrop/dismiss 동작 미정의).
   * Radix `onInteractOutside` 와 동일 이름 — de facto 어휘.
   */
  onInteractOutside?: () => void
  label?: string
  labelledBy?: string
  containerId?: string
  /** controlled open. 생략 시 패턴이 useState 자체 보유. */
  open?: boolean
  defaultOpen?: boolean
  idPrefix?: string
}

/**
 * menu — APG `/menu/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * 키보드: 모두 axis 합성 정본 (`menuAxis`). inline switch 0.
 * N-level nested submenu 지원 (path-stack). `data.entities[id].kind` 로
 * menuitem / menuitemcheckbox / menuitemradio 구분.
 *
 * trigger 가 필요하면 `useMenuButtonPattern` 사용. 본 패턴은 standalone menu
 * (context menu, popover trigger 외부에서 관리) 케이스.
 */
export function useMenuPattern(
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts: MenuOptions = {},
): {
  rootProps: RootProps
  menuitemProps: (id: string) => ItemProps
  buttonProps: ItemProps
  rootLevel: MenuLevel
  getSubmenu: (parentId: string) => MenuLevel | null
  items: MenuItem[]
  open: boolean
  setOpen: (open: boolean) => void
  openPath: string[]
} {
  const {
    autoFocus, onEscape, onInteractOutside, orientation = 'vertical', label, labelledBy,
    containerId = ROOT, open: openProp, defaultOpen = false,
    closeOnSelect = true, idPrefix = 'menu',
  } = opts
  const rootRef = useRef<HTMLElement | null>(null)

  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    if (!next) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const triggerRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement | null>())

  const [openPath, setOpenPath] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const rootMenuId = `${idPrefix}-menu`
  const submenuDomId = (pid: string) => `${idPrefix}-submenu-${pid}`
  const itemDomId = (id: string) => `${idPrefix}-item-${id}`

  // roving — active 변경 시 .focus()
  useEffect(() => {
    if (!open) return
    if (!activeId) return
    itemRefs.current.get(activeId)?.focus({ preventScroll: true })
  }, [open, activeId])

  // autoFocus — 마운트 시 첫 enabled child 에 focus.
  useEffect(() => {
    if (!autoFocus || !open) return
    const first = getCollectionChildren(data, containerId).filter((id) => !isDisabled(data, id))[0]
    if (first) setActiveId(first)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, open])

  // outside-close — ARIA punt 자리. open 인 동안 root 외부 클릭 시 onInteractOutside.
  useEffect(() => {
    if (!open || !onInteractOutside) return
    const onDoc = (e: MouseEvent) => {
      const root = rootRef.current
      if (root && !root.contains(e.target as Node)) onInteractOutside()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onInteractOutside])

  const intent = (e: UiEvent) => {
    if (e.type === 'open') {
      if (e.open) {
        setOpen(true)
      } else {
        // submenu open 상태에서 Escape → 한 단계만 닫고 부모 refocus
        if (openPath.length) {
          const last = openPath[openPath.length - 1]
          setOpenPath((path) => path.slice(0, -1))
          setActiveId(last)
        } else {
          setOpen(false)
          onEscape?.()
        }
      }
      return
    }
    if (e.type === 'expand') {
      if (e.open) {
        setOpenPath((path) => [...path, e.id])
      } else {
        // submenu 안 ArrowLeft → 부모 닫고 부모 refocus
        const parent = parentOf(data, e.id)
        if (parent && openPath.includes(parent)) {
          setOpenPath((path) => path.filter((p) => p !== parent))
          setActiveId(parent)
        }
      }
      return
    }
    if (e.type === 'navigate' && e.id) {
      setActiveId(e.id)
      return
    }
    if (e.type === 'activate') {
      const ent = data.entities[e.id] ?? {}
      const kind = (ent.kind as MenuItemKind | undefined) ?? 'menuitem'
      if (kind === 'menuitemcheckbox') {
        const cur = ent.checked
        const next = cur === 'mixed' ? true : !cur
        onEvent?.({ type: 'check', ids: [e.id], to: next })
        return
      }
      if (kind === 'menuitemradio') {
        const parent = parentOf(data, e.id) ?? containerId
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
      if (closeOnSelect) {
        setOpen(false)
        setOpenPath([])
        setActiveId(null)
      }
      return
    }
    onEvent?.(e)
  }

  const axis = orientation === 'horizontal' ? menuHorizontalAxis : menuVerticalAxis
  const menuBind = bindAxis(axis, data, intent)

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
      'aria-orientation': orientation,
      'aria-label': isRoot ? label : undefined,
      'aria-labelledby': isRoot ? labelledBy : itemDomId(parentId),
      hidden: isRoot ? !open || undefined : undefined,
      tabIndex: -1,
      ...(isRoot ? { ref: ((el: HTMLElement | null) => { rootRef.current = el }) as React.Ref<HTMLElement> } : {}),
    } as unknown as RootProps

    const itemProps = (id: string): ItemProps => {
      const item = items.find((x) => x.id === id)!
      const isActive = activeId === id
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
        ref: ((el: HTMLElement | null) => { itemRefs.current.set(id, el) }) as unknown as React.Ref<HTMLElement>,
        tabIndex: isActive ? 0 : -1,
        onClick: () => {
          if (item.disabled) return
          if (hasSub) {
            if (isOpen) {
              setOpenPath((path) => path.filter((p) => p !== id))
            } else {
              setOpenPath((path) => [...path, id])
              const fc = getChildren(data, id).filter((k) => !isDisabled(data, k))[0]
              if (fc) setActiveId(fc)
            }
            return
          }
          intent({ type: 'activate', id })
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (menuBind.onKey(e, id)) e.stopPropagation()
        },
      } as unknown as ItemProps
    }

    return { menuProps, itemProps, items }
  }

  const rootLevel = buildLevel(containerId, true)

  const getSubmenu = (pid: string): MenuLevel | null => {
    if (!openPath.includes(pid)) return null
    return buildLevel(pid, false)
  }

  const buttonProps: ItemProps = {
    type: 'button',
    ref: ((el: HTMLElement | null) => { triggerRef.current = el }) as React.Ref<HTMLElement>,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': rootMenuId,
    onClick: () => setOpen(!open),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!open && matchAnyChord(e as unknown as KeyboardEvent, TRIGGER_OPEN_CHORDS)) {
        e.preventDefault()
        setOpen(true)
        const first = getCollectionChildren(data, containerId).filter((id) => !isDisabled(data, id))[0]
        if (first) setActiveId(first)
      }
    },
  } as unknown as ItemProps

  return {
    rootProps: rootLevel.menuProps,
    menuitemProps: rootLevel.itemProps,
    buttonProps,
    rootLevel,
    getSubmenu,
    items: rootLevel.items,
    open,
    setOpen,
    openPath,
  }
}

/** keys SSOT — axisKeys 정본 사용. */
export const menuKeys = (orientation: 'horizontal' | 'vertical' = 'vertical'): readonly string[] =>
  axisKeys(menuAxis({ orientation }))

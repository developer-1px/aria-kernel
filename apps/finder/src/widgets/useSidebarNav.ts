// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import { useMemo } from 'react'
import {
  fromTree, navigateOnActivate,
  useControlState, useEventBridge,
  type UiEvent, type NormalizedData,
} from '@p/aria-kernel'
import { useResource, writeResource } from '@p/aria-kernel/store'
import { smartGroups, sidebar } from '../features/data'
import { pathResource, pinnedRootResource } from '../features/resources'

/** L2 — sidebar 단일 listbox wiring.
 *  recent(smart group) + fav(folder bookmark) 를 하나의 NormalizedData 로 합쳐 roving 횡단.
 *  activate 시 id prefix 로 분기: recent → path 변경, fav → pinnedRoot 갱신. */

const META_SCOPE: ReadonlyArray<UiEvent['type']> = ['navigate', 'typeahead']

export type SidebarItemView = {
  id: string
  realPath: string
  label: string
  icon: string
  group: '최근' | '즐겨찾기'
  selected: boolean
}

export type SidebarGroup = {
  key: '최근' | '즐겨찾기'
  label: string
  items: SidebarItemView[]
}

export type SidebarNav = {
  data: NormalizedData
  onEvent: (e: UiEvent) => void
  groups: SidebarGroup[]
}

export function useSidebarNav(): SidebarNav {
  const [path, dispatchPath] = useResource(pathResource)
  const [pinned] = useResource(pinnedRootResource)

  const items = useMemo<SidebarItemView[]>(() => [
    ...smartGroups.map((g): SidebarItemView => ({
      id: `recent:${g.path}`,
      realPath: g.path,
      label: g.label,
      icon: g.icon,
      group: '최근',
      selected: g.path === path,
    })),
    ...sidebar.map((s): SidebarItemView => ({
      id: `fav:${s.path}`,
      realPath: s.path,
      label: s.label,
      icon: s.icon,
      group: '즐겨찾기',
      selected: s.path === pinned,
    })),
  ], [path, pinned])

  const focusId = useMemo(() => {
    const sel = items.find((it) => it.selected)
    return sel?.id ?? items[0]?.id ?? null
  }, [items])

  const base = useMemo(
    () => fromTree(
      items.map((it) => ({
        id: it.id,
        label: it.label,
        icon: it.icon,
        realPath: it.realPath,
        group: it.group,
        selected: it.selected,
      })),
      { focusId },
    ),
    [items, focusId],
  )

  const [data, dispatchMeta] = useControlState(base)

  const onEvent = useEventBridge({
    data,
    gestures: navigateOnActivate,
    dispatchMeta: (e) => { if (META_SCOPE.includes(e.type)) dispatchMeta(e) },
    onIntent: (e) => {
      if (e.type !== 'activate') return
      const it = items.find((x) => x.id === e.id)
      if (!it) return
      if (it.group === '최근') {
        const intent: UiEvent = { type: 'activate', id: it.realPath }
        const next = pathResource.onEvent?.(intent, { value: path, data })
        if (next !== undefined) dispatchPath({ type: 'set', value: next })
      } else {
        writeResource(pinnedRootResource, it.realPath)
      }
    },
  })

  const groups: SidebarGroup[] = (
    [
      { key: '최근', label: '최근', items: items.filter((it) => it.group === '최근') },
      { key: '즐겨찾기', label: '즐겨찾기', items: items.filter((it) => it.group === '즐겨찾기') },
    ] satisfies SidebarGroup[]
  ).filter((g) => g.items.length > 0)

  return { data, onEvent, groups }
}
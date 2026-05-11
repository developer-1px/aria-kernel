/**
 * 공통 좌측 네비. SSOT = 각 route 의 `staticData.palette` (router.tsx 에서 타입 선언).
 * 새 라우터 추가 = 그 파일 안에 `staticData.palette` 만 채우면 자동 등장.
 *
 * 표준 Wrapper 적용 — `<Nav data onEvent>` (navigationListPattern) 가 `<nav>` + `<a>` 를 emit.
 * 라우팅은 onEvent('activate') 를 받아 host (TanStack router) 가 navigate.
 */
import { useRef } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import type { NormalizedData } from '@p/aria-kernel'
import { Nav } from '../examples/_navigationListWrapper'
import { collectPalette, paletteCategory, type PaletteEntry } from './palette'

const buildHref = (e: PaletteEntry) => {
  if (!e.params) return e.to
  return Object.entries(e.params).reduce(
    (path, [k, v]) => path.replace(`$${k}`, encodeURIComponent(v)),
    e.to,
  )
}

const buildData = (entries: PaletteEntry[], pathname: string): NormalizedData => {
  const groups = new Map<string, PaletteEntry[]>()
  for (const e of entries) {
    const k = paletteCategory(e)
    const arr = groups.get(k) ?? []
    arr.push(e)
    groups.set(k, arr)
  }

  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}
  const root: string[] = []

  for (const [cat, list] of groups) {
    entities[cat] = { label: cat }
    relationships[cat] = list.map((e) => e.id)
    root.push(cat)
    for (const e of list) {
      const href = buildHref(e)
      entities[e.id] = {
        label: e.label,
        href,
        to: e.to,
        params: e.params,
        current: pathname === href,
      }
    }
  }

  return { entities, relationships, meta: { root } }
}

export function SidebarNav() {
  const router = useRouter()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      detailsRef.current?.removeAttribute('open')
    }
  }

  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const data = buildData(collectPalette(router), pathname)

  const onEvent = (event: { type: string; id?: string }) => {
    if (event.type !== 'activate' || !event.id) return
    const ent = data.entities[event.id]
    if (!ent) return
    closeOnMobile()
    router.navigate({ to: ent.to as string, params: ent.params as never })
  }

  return (
    <div
      aria-label="Site navigation"
      className="shrink-0 border-stone-200 bg-stone-50 text-sm border-b md:border-b-0 md:border-r md:h-screen md:w-56 md:overflow-y-auto"
    >
      <details
        ref={detailsRef}
        className="group flex flex-col gap-4 p-3 md:!block"
        open
      >
        <summary className="cursor-pointer list-none rounded px-2 py-1 font-semibold text-stone-900 marker:hidden hover:bg-stone-200 md:hidden">
          ☰ @p/aria-kernel
        </summary>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            closeOnMobile()
            router.navigate({ to: '/' })
          }}
          className="hidden rounded px-2 py-1 font-semibold text-stone-900 hover:bg-stone-200 md:block"
        >
          @p/aria-kernel
        </a>
        <Nav aria-label="Site navigation" data={data} onEvent={onEvent} />
      </details>
    </div>
  )
}

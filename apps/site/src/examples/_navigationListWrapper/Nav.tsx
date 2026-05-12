import type { NormalizedData } from '@p/aria-kernel'
import { navigationListPattern, type PatternProps } from '@p/aria-kernel/patterns'
import { defaultLabel, renderSlot, type Slot } from '../../catalog/slots'

export interface NavSlots<TItem extends object = Record<string, unknown>> {
  label?: Slot<TItem>
}

export interface NavProps<TItem extends object = Record<string, unknown>> extends PatternProps {
  slots?: NavSlots<TItem>
  /**
   * Arrow-key roving 활성화. nav landmark 는 native Tab 이 정본이지만 사이드바 등에서
   * 화살표 이동이 필요할 때 opt-in.
   */
  roving?: boolean
  /** roving 시 focus 이동이 곧 activate 도 emit (사이드바·카탈로그 라우팅용). */
  selectionFollowsFocus?: boolean
}

/**
 * navigationList wrapper — `<nav>` landmark + grouped `<a aria-current="page">`.
 *
 * 데이터 트리:
 *   ROOT → group ids → link ids
 *   (단층 리스트면 ROOT 가 직접 link 들을 자식으로 가지면 됨 — group 헤딩 생략)
 *
 * group entity.label 이 있으면 `<h3>` 헤딩 노출. 클릭은 `activate` UiEvent 로 onEvent 에 위임.
 */
export function Nav<TItem extends object = Record<string, unknown>>({
  data,
  onEvent,
  slots = {},
  roving = false,
  selectionFollowsFocus = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: NavProps<TItem>) {
  const { rootProps, linkProps, items, groups } = navigationListPattern(data, onEvent, {
    label: ariaLabel,
    labelledBy: ariaLabelledBy,
    roving,
    selectionFollowsFocus,
  })

  const renderLink = (id: string) => {
    const itemData = (data.entities[id] ?? {}) as TItem
    const item = items.find((it) => it.id === id)
    if (!item) return null
    return (
      <a
        key={id}
        {...linkProps(id)}
        className="block rounded px-2 py-1 text-stone-700 [&:not([aria-current=page])]:hover:bg-stone-200 aria-[current=page]:bg-stone-900 aria-[current=page]:text-white"
      >
        {renderSlot(slots.label, defaultLabel as Slot<TItem>, item, itemData)}
      </a>
    )
  }

  return (
    <nav {...rootProps} className="flex flex-col gap-4">
      {groups.length > 0
        ? groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-0.5">
              {group.label && (
                <h3 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  {group.label}
                </h3>
              )}
              {group.items.map((it) => renderLink(it.id))}
            </div>
          ))
        : items.map((it) => renderLink(it.id))}
    </nav>
  )
}

export type NavData = NormalizedData

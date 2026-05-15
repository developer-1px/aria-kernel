import type { BaseItem } from '@interactive-os/aria-kernel/patterns'
import type { ReactNode } from 'react'

export type Slot<TItem extends object, TView extends BaseItem = BaseItem> = (
  props: SlotProps<TItem, TView>,
) => ReactNode

export interface SlotProps<TItem extends object, TView extends BaseItem = BaseItem> {
  item: TView
  data: TItem
}

export function renderSlot<TItem extends object, TView extends BaseItem>(
  slot: Slot<TItem, TView> | undefined,
  fallback: Slot<TItem, TView>,
  item: TView,
  data: TItem,
): ReactNode {
  const Resolved = slot ?? fallback
  return <Resolved item={item} data={data} />
}

export function defaultLabel<TItem extends object, TView extends BaseItem>({
  item,
}: SlotProps<TItem, TView>): ReactNode {
  return item.label
}

export function emptySlot<TItem extends object, TView extends BaseItem>(
  _props: SlotProps<TItem, TView>,
): ReactNode {
  return null
}

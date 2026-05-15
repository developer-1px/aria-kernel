/**
 * Tree — useTreeviewPattern 위에 ul/li skeleton + 인라인 edit 통합을 얹은 기본형.
 *
 *   data·onEvent  → useTreeviewPattern 그대로 패스
 *   options       → TreeviewOptions 그대로 forward (label, commands, variant 등)
 *   slots         → marker · label · trailing 3구간. label slot 은 edit 모드를
 *                   editProps 형태로 받아 직접 렌더 가능 (default = EditInput).
 *   className /
 *   itemClassName → root <ul> 와 <li> 시각은 caller 가 utility class 로 조립.
 *
 * 모든 시각은 Tailwind 유틸로 caller 가 결정 — wrapper 는 구조와 ARIA, edit
 * lifecycle 만 책임. focus 복원은 EditInput 가 closest treeitem 으로 처리.
 */
import { type CSSProperties, type ReactNode } from 'react'
import { useTreeviewPattern, type TreeItem, type TreeviewOptions } from '@interactive-os/aria-kernel/patterns'
import type { NormalizedData, UiEvent } from '@interactive-os/aria-kernel'
import { EditInput } from './EditInput'

export interface TreeEdit {
  initial: string
  onCommit: (value: string, cancelled: boolean) => void
}

export interface TreeSlots {
  /** leading glyph. default: branch ▾/▸, leaf '•'. */
  marker?: (item: TreeItem) => ReactNode
  /** label/edit 영역. default: edit 시 EditInput, 아니면 item.label. */
  label?: (item: TreeItem, edit: TreeEdit | null) => ReactNode
  /** trailing 영역. default: none. */
  trailing?: (item: TreeItem) => ReactNode
}

export interface TreeProps {
  data: NormalizedData
  onEvent: (e: UiEvent) => void
  options?: TreeviewOptions
  slots?: TreeSlots
  /** root <ul> 추가 class. */
  className?: string
  /** per-item <li> 추가 class. */
  itemClassName?: string
  /** 레벨당 indent (CSS 길이). default '1rem'. */
  indent?: string
}

const defaultMarker = (item: TreeItem): ReactNode =>
  item.hasChildren ? (item.expanded ? '▾' : '▸') : '•'

const defaultLabel = (item: TreeItem, edit: TreeEdit | null): ReactNode =>
  edit
    ? <EditInput initial={edit.initial} onCommit={edit.onCommit} className="flex-1 rounded border border-blue-400 bg-white px-1 outline-none" />
    : item.label || <em className="text-neutral-300">empty</em>

const ROOT_BASE = ''
const ITEM_BASE = 'flex gap-2 outline-none focus:bg-blue-50 data-[selected]:bg-blue-100'

export function Tree({
  data, onEvent, options, slots,
  className, itemClassName, indent = '1rem',
}: TreeProps) {
  const tree = useTreeviewPattern(data, onEvent, options)
  const marker = slots?.marker ?? defaultMarker
  const label = slots?.label ?? defaultLabel
  const trailing = slots?.trailing
  return (
    <ul {...tree.rootProps} className={className ? `${ROOT_BASE} ${className}` : ROOT_BASE}>
      {tree.items.map((item) => (
        <li
          key={item.id}
          {...tree.itemProps(item.id)}
          className={itemClassName ? `${ITEM_BASE} ${itemClassName}` : ITEM_BASE}
          style={{ paddingLeft: `calc(${item.level} * ${indent})` } as CSSProperties}
        >
          <span aria-hidden className="text-neutral-400">{marker(item)}</span>
          <span className="flex-1">{label(item, tree.editProps(item.id))}</span>
          {trailing && <span>{trailing(item)}</span>}
        </li>
      ))}
    </ul>
  )
}

import { type UiEvent } from '@interactive-os/aria-kernel'
import { useTreeviewPattern, useTreeviewReducer } from '@interactive-os/aria-kernel/patterns'

interface Node { id: string; label: string; children?: Node[]; [key: string]: unknown }

const TREE: Node[] = [
  { id: 'fruit', label: 'Fruits', children: [
    { id: 'apple', label: 'Apple' },
    { id: 'citrus', label: 'Citrus', children: [
      { id: 'orange', label: 'Orange' },
      { id: 'lemon', label: 'Lemon' },
    ]},
  ]},
  { id: 'veg', label: 'Vegetables', children: [
    { id: 'carrot', label: 'Carrot' },
  ]},
]

export function TreeArrowDemo() {
  const [data, dispatch] = useTreeviewReducer(TREE)
  const { rootProps, itemProps, items } = useTreeviewPattern(
    data, (e: UiEvent) => dispatch(e), { label: '카테고리', autoFocus: true },
  )

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.18</span>
          Tree — Right/Left expand · focus≠expand
        </h1>
        <p className="text-sm text-neutral-500">
          APG /tree/ — Right on collapsed = expand, on expanded = move to first child.
          Left on expanded = collapse, on leaf = move to parent. **focus 이동 (↑/↓) 은 절대 expand 유발 ❌.**
        </p>
      </header>

      <ul {...rootProps} className="rounded border border-neutral-200 bg-white py-1">
        {items.map((it) => (
          <li
            key={it.id}
            {...itemProps(it.id)}
            className="px-3 py-1 text-sm hover:bg-neutral-50 data-[focus-visible]:bg-blue-50 data-[selected=true]:bg-blue-100 cursor-pointer"
            style={{ paddingLeft: `${(it.level ?? 1) * 12 + 8}px` }}
          >
            {it.hasChildren ? (it.expanded ? '▾ ' : '▸ ') : '  '}
            {it.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-neutral-400">↑/↓ focus 이동 · → expand/하위 · ← collapse/상위</p>
    </div>
  )
}

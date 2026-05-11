/* eslint-disable react-refresh/only-export-components */
import { useReducer } from 'react'
import { applyGesture, expandBranchOnActivate, fromTree, reduceWithDefaults } from '@p/aria-kernel'
import type { TreeItem } from '@p/aria-kernel/patterns'
import { Tree, type TreeSlots, treeWrapperKeys } from './_treeWrapper'
import type { SlotProps } from '../catalog/slots'

// 데이터는 예제에서 직접 보이도록 inline. wrapper(Tree) 는 _treeWrapper 안.
//
// 트리 구조 (Node 형태로 작성 → fromTree 가 NormalizedData 로 변환):
//   src/                       (folder, expanded)
//     ├─ App.tsx               (file, ext=tsx)
//     └─ demos/                (folder, expanded)
//          ├─ tabs.tsx
//          └─ tree.tsx
//   package.json               (file, ext=json)

interface FileItem extends Record<string, unknown> {
  label: string
  kind: 'folder' | 'file'
  ext?: string
}

interface Node {
  id: string
  label: string
  kind: 'folder' | 'file'
  ext?: string
  children?: Node[]
}

const files: Node[] = [
  {
    id: 'src',
    label: 'src',
    kind: 'folder',
    children: [
      { id: 'app', label: 'App.tsx', kind: 'file', ext: 'tsx' },
      {
        id: 'demos',
        label: 'demos',
        kind: 'folder',
        children: [
          { id: 'tabs', label: 'tabs.tsx', kind: 'file', ext: 'tsx' },
          { id: 'tree', label: 'tree.tsx', kind: 'file', ext: 'tsx' },
        ],
      },
    ],
  },
  { id: 'pkg', label: 'package.json', kind: 'file', ext: 'json' },
]

const initialData = fromTree(files, { expanded: ['src', 'demos'] })

// gesture: branch activate → expand toggle (leaf activate → activate emit 그대로).
const reducer = applyGesture(expandBranchOnActivate, reduceWithDefaults)

const slots: TreeSlots<FileItem> = {
  icon: ({ item, data }: SlotProps<FileItem, TreeItem>) =>
    data.kind === 'folder' ? (item.expanded ? '📂' : '📁') : '📄',
  label: ({ item }: SlotProps<FileItem, TreeItem>) => item.label,
  trailing: ({ data }: SlotProps<FileItem, TreeItem>) =>
    typeof data.ext === 'string' ? data.ext : null,
}

export const meta = {
  title: 'Tree Wrapper',
  apg: 'treeview',
  kind: 'collection' as const,
  blurb: 'A reusable file tree that renders icons, labels, and trailing metadata from item data.',
  keys: treeWrapperKeys,
}

export default function TreeWrapperDemo() {
  const [data, onEvent] = useReducer(reducer, undefined, () => initialData)

  return (
    <Tree
      aria-label="Files"
      data={data}
      onEvent={onEvent}
      slots={slots as TreeSlots}
    />
  )
}

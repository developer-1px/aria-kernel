import type { CollectionData, NormalizedData } from '../intent/events'

/**
 * fromFlatTree — flat record + children:id[] 백엔드를 NormalizedData 로 변환.
 * zod-crud `JsonDoc.nodes` · FS recordset · DB rowset 처럼 *flat store* 백엔드를
 * 위 어댑터 한 줄로 잇는 일반화된 헬퍼. 특정 라이브러리 의존 0.
 *
 * @example
 * const data = fromFlatTree(crud.snapshot().nodes, crud.snapshot().rootId, {
 *   children: (n) => n.children,
 * })
 */
export function fromFlatTree<N extends Record<string, unknown>>(
  nodes: Record<string, N>,
  rootId: string,
  accessors: { children: (n: N) => readonly string[] },
  opts?: { focusId?: string | null; expanded?: string[] },
): CollectionData {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}

  const walk = (id: string) => {
    const node = nodes[id]
    if (!node) return
    entities[id] = node as Record<string, unknown>
    const childIds = accessors.children(node)
    if (childIds.length) {
      relationships[id] = [...childIds]
      for (const c of childIds) walk(c)
    }
  }
  walk(rootId)

  const meta: CollectionData['meta'] = { root: [rootId] }
  if (opts?.focusId !== undefined) meta.focus = opts.focusId
  if (opts?.expanded) meta.expanded = opts.expanded

  return { entities, relationships, meta }
}

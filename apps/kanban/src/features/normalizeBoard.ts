// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import type { JsonDoc, NodeId } from 'zod-crud'
import type { NormalizedData } from '@interactive-os/aria-kernel'

/**
 * normalizeBoard — JsonDoc → NormalizedData.
 * 구조: ROOT → [columnId...]; columnId → [cardId...]; cardId leaf.
 * label: column title 또는 card title.
 * meta.columnIds: column id 목록 (widget 이 컬럼별 listbox 인스턴스 만들 때 사용).
 */
export function normalizeBoard(doc: JsonDoc): NormalizedData & {
  columnIds: NodeId[]
  rootId: NodeId
  /** card id → cards-array id (paste 시 parent 인지 위함). */
  cardParentArray: Record<NodeId, NodeId>
} {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}
  const cardParentArray: Record<NodeId, NodeId> = {}

  const propValue = (objId: NodeId, key: string) => {
    const obj = doc.nodes[objId]
    if (!obj || obj.type !== 'object') return undefined
    const prop = obj.children.map((cid) => doc.nodes[cid]).find((n) => n?.key === key)
    return prop
  }

  // root.columns array → column ids
  const colsArr = propValue(doc.rootId, 'columns')
  const columnIds = colsArr?.children ?? []

  for (const colId of columnIds) {
    const titleProp = propValue(colId, 'title')
    entities[colId] = { label: typeof titleProp?.value === 'string' ? titleProp.value : '' }

    const cardsArr = propValue(colId, 'cards')
    const cardIds = cardsArr?.children ?? []
    relationships[colId] = [...cardIds]

    for (const cardId of cardIds) {
      const cardTitle = propValue(cardId, 'title')
      entities[cardId] = { label: typeof cardTitle?.value === 'string' ? cardTitle.value : '' }
      if (cardsArr) cardParentArray[cardId] = cardsArr.id
    }
  }

  return {
    entities,
    relationships,
    meta: { root: [...columnIds] },
    columnIds: [...columnIds],
    rootId: doc.rootId,
    cardParentArray,
  }
}
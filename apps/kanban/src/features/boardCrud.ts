// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import { createJsonCrud, type JsonValue } from 'zod-crud'
import { Board, SAMPLE } from '../entities/board'

/**
 * focusFilter — column / card 만 focus 후보. title/cards array 중간 노드 skip.
 * defaultFor — 패턴이 value 없이 보내는 insertAfter/appendChild 의 schema-aware 기본값.
 */
export const crud = createJsonCrud(Board, SAMPLE, {
  focusFilter: (doc, id) => {
    const n = doc.nodes[id]
    if (!n || n.type !== 'object') return false
    const keys = n.children.map((cid) => doc.nodes[cid]?.key)
    return !keys.includes('columns')  // skip board-root, column/card OK
  },
  defaultFor: (path): JsonValue => {
    if (path[path.length - 1] === 'columns') return { title: 'New column', cards: [] }
    if (path[path.length - 1] === 'cards')   return { title: '' }
    return { title: '' }
  },
})
// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import type { JsonDoc, NodeId } from 'zod-crud'
import type { NormalizedData } from '@interactive-os/aria-kernel'
import { outlinerSpec } from './outliner.spec'

/** JsonDoc → NormalizedData. schema.labelField/childField 로 walk. */
export function normalize(doc: JsonDoc): NormalizedData {
  const { labelField, childField } = outlinerSpec.schema
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}

  const walk = (objId: NodeId) => {
    const obj = doc.nodes[objId]
    if (!obj || obj.type !== 'object') return
    const text = obj.children
      .map((cid) => doc.nodes[cid])
      .find((n) => n?.key === labelField)?.value
    const childrenArr = obj.children
      .map((cid) => doc.nodes[cid])
      .find((n) => n?.key === childField)
    entities[objId] = { label: typeof text === 'string' ? text : '' }
    const kids = childrenArr?.children ?? []
    if (kids.length) {
      relationships[objId] = [...kids]
      for (const cid of kids) walk(cid)
    }
  }
  walk(doc.rootId)

  return { entities, relationships, meta: { root: [doc.rootId] } }
}
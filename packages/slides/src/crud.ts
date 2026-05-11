// @ts-nocheck — zod-crud legacy API drift (createJsonCrud/JsonDoc), tracked in #132
import { createJsonCrud, type JsonCrud, type JsonDoc, type JsonValue } from 'zod-crud'
import { DeckDocSchema, emptySlide, SAMPLE_DECK, type DeckDoc } from './schema'

const prop = (doc: JsonDoc, id: string, key: string) => {
  const node = doc.nodes[id]
  if (!node || node.type !== 'object') return undefined
  return node.children.map((childId) => doc.nodes[childId]).find((child) => child?.key === key)
}

export const isSlideObject = (doc: JsonDoc, id: string): boolean => {
  const node = doc.nodes[id]
  if (!node || node.type !== 'object') return false
  return Boolean(prop(doc, id, 'title') && prop(doc, id, 'body') && prop(doc, id, 'children'))
}

export function createDeckCrud(initial: DeckDoc = SAMPLE_DECK): JsonCrud<DeckDoc> {
  return createJsonCrud(DeckDocSchema, initial, {
    childKeys: ['slides', 'children'],
    focusFilter: isSlideObject,
    defaultFor: (path): JsonValue => {
      const last = path[path.length - 1]
      if (last === 'slides' || last === 'children') return emptySlide()
      return emptySlide()
    },
  })
}

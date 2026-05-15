import type { NormalizedData } from '@interactive-os/aria-kernel'
import type { JsonDoc, NodeId } from 'zod-crud'
import { isSlideObject } from './crud'

export type DeckData = NormalizedData<{
  label: string
  body: string
  kind: 'slide'
}>

export const propNode = (doc: JsonDoc, id: NodeId, key: string) => {
  const node = doc.nodes[id]
  if (!node || node.type !== 'object') return undefined
  return node.children.map((childId) => doc.nodes[childId]).find((child) => child?.key === key)
}

const stringProp = (doc: JsonDoc, id: NodeId, key: string): string => {
  const node = propNode(doc, id, key)
  return typeof node?.value === 'string' ? node.value : ''
}

const childSlides = (doc: JsonDoc, id: NodeId): NodeId[] => {
  const arr = propNode(doc, id, 'children')
  return arr?.children.filter((childId) => isSlideObject(doc, childId)) ?? []
}

export const rootSlides = (doc: JsonDoc): NodeId[] => {
  const arr = propNode(doc, doc.rootId, 'slides')
  return arr?.children.filter((childId) => isSlideObject(doc, childId)) ?? []
}

export function normalizeDeck(doc: JsonDoc): DeckData {
  const entities: DeckData['entities'] = {}
  const relationships: DeckData['relationships'] = {}

  const walk = (id: NodeId) => {
    entities[id] = {
      kind: 'slide',
      label: stringProp(doc, id, 'title'),
      body: stringProp(doc, id, 'body'),
    }
    const children = childSlides(doc, id)
    if (children.length > 0) {
      relationships[id] = children
      children.forEach(walk)
    }
  }

  const root = rootSlides(doc)
  root.forEach(walk)
  return { entities, relationships, meta: { root, expanded: Object.keys(relationships) } }
}

export function slideText(doc: JsonDoc, id: NodeId): { title: string; body: string } | null {
  if (!isSlideObject(doc, id)) return null
  return {
    title: stringProp(doc, id, 'title'),
    body: stringProp(doc, id, 'body'),
  }
}

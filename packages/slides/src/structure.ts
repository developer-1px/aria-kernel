import type { NormalizedData } from '@p/aria-kernel'

export function selectedEventIds(data: NormalizedData, id: string): string[] {
  const selected = Object.entries(data.entities)
    .filter(([, entity]) => entity.selected)
    .map(([entityId]) => entityId)
  if (!selected.includes(id)) return [id]
  return visibleOrder(data).filter((entityId) => selected.includes(entityId))
}

export function visibleOrder(data: NormalizedData): string[] {
  const out: string[] = []
  const walk = (id: string) => {
    out.push(id)
    ;(data.relationships[id] ?? []).forEach(walk)
  }
  ;(data.meta?.root ?? []).forEach(walk)
  return out
}

export function parentOf(data: NormalizedData, id: string): string | null {
  for (const [parentId, children] of Object.entries(data.relationships)) {
    if (children.includes(id)) return parentId
  }
  return null
}

export function previousSibling(data: NormalizedData, id: string): string | null {
  const parent = parentOf(data, id)
  const siblings = parent ? data.relationships[parent] ?? [] : data.meta?.root ?? []
  const index = siblings.indexOf(id)
  return index > 0 ? siblings[index - 1]! : null
}

export function siblingBatch(data: NormalizedData, ids: string[]): string[] {
  const parent = parentOf(data, ids[0] ?? '')
  if (ids.some((id) => parentOf(data, id) !== parent)) return ids.slice(0, 1)
  const siblings = parent ? data.relationships[parent] ?? [] : data.meta?.root ?? []
  return siblings.filter((id) => ids.includes(id))
}

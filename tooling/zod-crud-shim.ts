// Shim that re-exports current zod-crud and back-fills legacy names
// (createJsonCrud / JsonDoc / JsonValue / NodeId / JsonCrud) used by
// pre-migration apps (#132). Stubs throw at runtime — those apps are
// already broken and tracked separately.
// @ts-ignore — relative path bypasses the vite alias for this file only
export * from '../node_modules/zod-crud/dist/index.js'

export type JsonValue = unknown
export type NodeId = string
export interface JsonNode {
  type: string
  key?: string
  value?: unknown
  children: NodeId[]
}
export interface JsonDoc {
  rootId: NodeId
  nodes: Record<NodeId, JsonNode>
}
export interface JsonCrud<T = unknown> {
  snapshot(): JsonDoc
  subscribe(listener: () => void): () => void
  [k: string]: unknown
}

export function createJsonCrud<T = unknown>(..._args: unknown[]): JsonCrud<T> {
  throw new Error(
    'createJsonCrud is a legacy zod-crud API; apps using it are pending migration (#132).',
  )
}

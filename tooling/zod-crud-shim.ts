// Shim that re-exports current zod-crud and back-fills legacy names
// (createJsonCrud / JsonDoc / JsonValue / NodeId / JsonCrud / OperationResult)
// used by pre-migration apps (#132). Stubs throw at runtime — those apps are
// already broken and tracked separately. Types are intentionally permissive
// (`any` on legacy surface) so tsc doesn't block migration work on the rest
// of the repo. The migration is the proper fix; this is the bridge.
// @ts-ignore — relative path bypasses the vite alias for this file only
export * from '../node_modules/zod-crud/dist/index.js'

export type JsonValue = any
export type NodeId = string
export type OperationResult = any
export interface JsonNode {
  type: string
  key?: string
  value?: any
  children: NodeId[]
  [k: string]: any
}
export interface JsonDoc {
  rootId: NodeId
  nodes: Record<NodeId, JsonNode>
  [k: string]: any
}
// Legacy JsonCrud is wide-open by design — apps using it are pre-migration (#132).
// Using `any` here unblocks tsc on unrelated work; the proper fix is migration.
export type JsonCrud<_T = unknown> = any

// Returns a Proxy whose property access throws — lets module evaluation succeed
// (test harnesses can import then skip), but any actual usage fails loudly.
export function createJsonCrud<_T = unknown>(..._args: any[]): any {
  const handler: ProxyHandler<object> = {
    get(_t, prop) {
      throw new Error(
        `createJsonCrud is legacy (#132). '${String(prop)}' called on stub. Migrate to useJsonDocument.`,
      )
    },
  }
  return new Proxy({}, handler)
}

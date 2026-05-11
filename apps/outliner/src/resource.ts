// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import { createJsonCrud, type JsonDoc } from 'zod-crud'
import { defineResource, routeUiEventToCrud, type CrudPort } from '@p/resource'
import { outlinerSpec } from './outliner.spec'

/** zod-crud singleton — outliner.spec.entity 로 schema-aware CRUD. */
export const crud = createJsonCrud(outlinerSpec.schema.entity, outlinerSpec.schema.initial, {
  focusFilter: (doc, id) => doc.nodes[id]?.type === 'object',
  defaultFor: () => outlinerSpec.schema.emptyValue,
})

/** Resource bridge — zod-crud ↔ React. UiEvent 9종(insertAfter/appendChild/update/remove/copy/cut/paste/undo/redo)이 routeUiEventToCrud 로 자동 라우팅. */
export const resource = defineResource<JsonDoc>({
  key: () => 'outline',
  initial: () => crud.snapshot(),
  subscribe: (_k, push) => crud.subscribe(() => push(crud.snapshot())),
  onEvent: (e) => routeUiEventToCrud(crud as unknown as CrudPort<JsonDoc>, e),
})
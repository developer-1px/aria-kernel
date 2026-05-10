// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import { defineResource, routeUiEventToCrud, type CrudPort } from '@p/aria-kernel/store'
import type { JsonDoc } from 'zod-crud'
import { crud } from './boardCrud'

export const boardResource = defineResource<JsonDoc>({
  key: () => 'board',
  initial: () => crud.snapshot(),
  subscribe: (_k, push) => crud.subscribe(() => push(crud.snapshot())),
  onEvent: (e) => routeUiEventToCrud(crud as unknown as CrudPort<JsonDoc>, e),
})
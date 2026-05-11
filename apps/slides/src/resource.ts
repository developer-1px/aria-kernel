// @ts-nocheck — zod-crud legacy API drift, tracked in #132
import { createDeckCrud, normalizeDeck } from '@p/slides'
import { defineResource, routeUiEventToCrud, type CrudPort } from '@p/aria-kernel/store'
import type { JsonDoc } from 'zod-crud'

export const crud = createDeckCrud()

export const deckResource = defineResource<JsonDoc>({
  key: () => 'deck',
  initial: () => crud.snapshot(),
  subscribe: (_key, push) => crud.subscribe(() => push(crud.snapshot())),
  onEvent: (event) => routeUiEventToCrud(crud as unknown as CrudPort<JsonDoc>, event),
})

export { normalizeDeck }

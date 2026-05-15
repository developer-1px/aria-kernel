import { createDeckCrud, normalizeDeck } from '@interactive-os/slides'
import { defineResource, routeUiEventToCrud, type CrudPort } from '@interactive-os/resource'
import type { JsonDoc } from 'zod-crud'

export const crud = createDeckCrud()

export const deckResource = defineResource<JsonDoc>({
  key: () => 'deck',
  initial: () => crud.snapshot(),
  subscribe: (_key, push) => crud.subscribe(() => push(crud.snapshot())),
  onEvent: (event) => routeUiEventToCrud(crud as unknown as CrudPort<JsonDoc>, event),
})

export { normalizeDeck }

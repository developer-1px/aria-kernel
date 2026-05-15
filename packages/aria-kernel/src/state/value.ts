import type { Reducer } from './compose'

/**
 * setValue — numeric `value` reducer fragment for slider / splitter / spinner.
 *
 * On `value` events, writes `e.value` into `entities[e.id].value`.
 * Compose with `reduce`:
 *   const myReduce = composeReducers(reduce, setValue)
 */
export const setValue: Reducer = (d, e) => {
  if (e.type !== 'value') return d
  const ent = d.entities[e.id]
  if (!ent) return d
  return {
    ...d,
    entities: { ...d.entities, [e.id]: { ...ent, value: e.value } },
  }
}

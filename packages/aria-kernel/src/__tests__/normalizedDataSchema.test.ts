import { describe, expect, it } from 'vitest'
import {
  CollectionDataSchema,
  NormalizedDataSchema,
  parseCollectionData,
} from '../intent/schema'
import { getCollectionRoot } from '../intent/events'
import { fromList, fromTree } from '../state/fromTree'

describe('NormalizedData schema', () => {
  it('accepts the actual entity payload shape emitted by builders', () => {
    type Node = { id: string; label: string; children?: Node[] }
    const tree: Node[] = [
      { id: 'group', label: 'Group', children: [{ id: 'a', label: 'A' }] },
    ]

    expect(NormalizedDataSchema.parse(fromList([{ id: 'a', label: 'A' }]))).toEqual({
      entities: { a: { label: 'A' } },
      relationships: {},
      meta: { root: ['a'] },
    })

    expect(NormalizedDataSchema.parse(fromTree(tree))).toEqual({
      entities: {
        group: { label: 'Group' },
        a: { label: 'A' },
      },
      relationships: { group: ['a'] },
      meta: { root: ['group'] },
    })
  })

  it('treats only explicit root as an intentional empty collection', () => {
    const empty = { entities: {}, relationships: {}, meta: { root: [] } }

    expect(parseCollectionData(empty)).toEqual(empty)
    expect(getCollectionRoot(empty)).toEqual([])
    expect(() => CollectionDataSchema.parse({ entities: {}, relationships: {} })).toThrow()
    expect(() => getCollectionRoot({ entities: {}, relationships: {} })).toThrow(
      /requires `meta\.root`/,
    )
  })

  it('rejects dangling graph references', () => {
    expect(() => NormalizedDataSchema.parse({
      entities: { a: { label: 'A' } },
      relationships: { a: ['missing'] },
      meta: { root: ['a'] },
    })).toThrow(/missing/)

    expect(() => NormalizedDataSchema.parse({
      entities: { a: { label: 'A' } },
      relationships: {},
      meta: { root: ['missing'] },
    })).toThrow(/root id/)
  })
})

import { describe, expect, it } from 'vitest'
import { SAMPLE_DECK, DeckDocSchema } from './schema'
import { exportDeckToPptx } from './pptx'

const PK_SIG = [0x50, 0x4b, 0x03, 0x04] // "PK\x03\x04"

describe('exportDeckToPptx', () => {
  it('valid deck → ZIP-formatted Uint8Array (PK signature)', async () => {
    const bytes = await exportDeckToPptx(SAMPLE_DECK)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(1000)
    expect(Array.from(bytes.subarray(0, 4))).toEqual(PK_SIG)
  })

  it('invalid deck (schema 위반) → DeckDocSchema.parse 가 throw', async () => {
    const bad = { title: 'x', slides: [] } as never  // slides min(1) violation
    expect(() => DeckDocSchema.parse(bad)).toThrow()
    await expect(exportDeckToPptx(bad)).rejects.toThrow()
  })
})

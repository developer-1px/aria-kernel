import { describe, expect, it } from 'vitest'
import { gridEditKeys, gridBuiltinChords } from './grid'

describe('grid pattern — declarative SSOT', () => {
  it('gridEditKeys advertises F2 and Enter', () => {
    expect(gridEditKeys()).toEqual(['F2', 'Enter'])
  })

  it('gridBuiltinChords lists the F2 → editStart mapping', () => {
    const editChord = gridBuiltinChords.find((c) => c.chord === 'F2')
    expect(editChord?.uiEvent).toBe('editStart')
    expect(editChord?.scope).toBe('item')
  })

  it('Enter is *not* explicitly registered in gridBuiltinChords — matched via GRID_EDIT_CHORDS[*]', () => {
    const enterChord = gridBuiltinChords.find((c) => c.chord === 'Enter')
    expect(enterChord).toBeUndefined()
  })
})

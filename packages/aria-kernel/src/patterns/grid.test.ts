import { describe, expect, it } from 'vitest'
import { gridEditKeys, gridKeys } from './grid'

describe('grid pattern — declarative SSOT', () => {
  it('gridEditKeys advertises F2 and Enter', () => {
    expect(gridEditKeys()).toEqual(['F2', 'Enter'])
  })

  it('gridKeys lists the F2 → editStart mapping', () => {
    const editChord = gridKeys.find((c) => c.chord === 'F2')
    expect(editChord?.uiEvent).toBe('editStart')
    expect(editChord?.scope).toBe('item')
  })

  it('Enter is *not* explicitly registered in gridKeys — matched via GRID_EDIT_CHORDS[*]', () => {
    const enterChord = gridKeys.find((c) => c.chord === 'Enter')
    expect(enterChord).toBeUndefined()
  })
})

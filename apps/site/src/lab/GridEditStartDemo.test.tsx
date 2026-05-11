import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GridEditStartDemo } from './GridEditStartDemo'

afterEach(cleanup)

const cell = (label: string) => screen.getByRole('gridcell', { name: label })
const logEntries = () => {
  const pre = document.querySelector('pre')!
  return (pre.textContent ?? '').split('\n').filter(Boolean)
}

describe('Grid editStart demo — black-box', () => {
  it('초기 로그는 비어 있다 (placeholder 만)', () => {
    render(<GridEditStartDemo />)
    expect(logEntries()).toEqual(['(셀 클릭 또는 F2)'])
  })

  it('cell 클릭 → activate emit (editStart 아님)', () => {
    render(<GridEditStartDemo />)
    fireEvent.click(cell('A1'))
    const log = logEntries().join('\n')
    expect(log).toMatch(/^activate id=r0-A/)
    expect(log).not.toMatch(/editStart/)
  })

  it('F2 → editStart emit (activate 아님)', () => {
    render(<GridEditStartDemo />)
    const c = cell('A1')
    c.focus()
    fireEvent.keyDown(c, { key: 'F2' })
    const log = logEntries().join('\n')
    expect(log).toMatch(/^editStart id=r0-A/)
  })

  it('Enter → editStart + activate 둘 다 (GRID_EDIT_CHORDS 확장; activate axis 도 트리거)', () => {
    render(<GridEditStartDemo />)
    const c = cell('B1')
    c.focus()
    fireEvent.keyDown(c, { key: 'Enter' })
    const log = logEntries().join('\n')
    expect(log).toMatch(/editStart id=r0-B/)
    expect(log).toMatch(/activate id=r0-B/)
  })

  it('click → F2 순서: 두 종류 이벤트가 분리되어 누적', () => {
    render(<GridEditStartDemo />)
    fireEvent.click(cell('A1'))
    fireEvent.keyDown(cell('A1'), { key: 'F2' })
    const lines = logEntries()
    expect(lines[0]).toMatch(/editStart/)
    expect(lines[1]).toMatch(/activate/)
  })
})

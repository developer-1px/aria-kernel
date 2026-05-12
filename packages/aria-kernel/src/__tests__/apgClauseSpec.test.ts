import { describe, expect, it } from 'vitest'

import { ApgClauseSchema, ApgClauseSpecSchema, type ApgClause } from '../spec/apgClauseSpec'

const listboxRoleClause: ApgClause = {
  id: 'listbox.role.root',
  pattern: 'listbox',
  sourceUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
  sourceSection: 'roles-states-properties',
  classification: 'required',
  subject: 'role',
  expectation: 'Container has role="listbox".',
  verdict: 'pass',
  evidence: [{
    file: 'packages/aria-kernel/src/patterns/listbox.ts',
    line: 1,
    note: 'rootProps emits the role.',
  }],
}

describe('APG clause contract schema', () => {
  it('accepts a single audited APG clause', () => {
    expect(ApgClauseSchema.parse(listboxRoleClause)).toEqual(listboxRoleClause)
  })

  it('accepts a plain JSON clause list', () => {
    const json = JSON.parse(JSON.stringify([listboxRoleClause]))
    expect(ApgClauseSpecSchema.parse(json)).toEqual([listboxRoleClause])
  })

  it('rejects non-canonical classification vocabulary', () => {
    expect(() => ApgClauseSchema.parse({
      ...listboxRoleClause,
      classification: 'required-if-standalone',
    })).toThrow()
  })
})

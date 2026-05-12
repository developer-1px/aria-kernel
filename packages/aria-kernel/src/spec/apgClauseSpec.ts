import { z } from 'zod'

/**
 * APG clause contract — one audited APG sentence/requirement.
 *
 * This is the machine-readable shape behind the markdown audit artifacts. It is
 * intentionally small: APG prose is classified once, then implementation
 * evidence can be checked or reviewed without changing the vocabulary per
 * pattern.
 */
export const ApgClauseSchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceSection: z.enum([
    'about',
    'keyboard',
    'roles-states-properties',
    'note',
    'example',
  ]),
  classification: z.enum([
    'required',
    'recommended',
    'optional',
    'host-responsibility',
    'not-applicable',
  ]),
  subject: z.enum([
    'role',
    'aria',
    'focus',
    'keyboard',
    'selection',
    'state',
    'relationship',
    'content-model',
    'naming',
  ]),
  expectation: z.string().min(1),
  verdict: z.enum([
    'pass',
    'partial',
    'fail',
    'not-applicable',
    'pending',
  ]),
  evidence: z.array(z.object({
    file: z.string().min(1),
    line: z.number().int().positive(),
    note: z.string().min(1),
  })),
  residualRisk: z.string().min(1).optional(),
})

export const ApgClauseSpecSchema = z.array(ApgClauseSchema)

export type ApgClause = z.infer<typeof ApgClauseSchema>
export type ApgClauseSpec = z.infer<typeof ApgClauseSpecSchema>


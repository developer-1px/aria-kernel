import { z } from 'zod'

const StringListSchema = z.preprocess((value) => {
  if (value == null) return []
  if (typeof value === 'string') return [value]
  return value
}, z.array(z.string().min(1)).default([]))

export const DocFrontmatterSchema = z.object({
  product: z.literal('aria-kernel'),
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  section: z.string().min(1).default('Reference'),
  sectionLabel: z.string().min(1).optional(),
  sectionOrder: z.coerce.number().default(99),
  order: z.coerce.number().default(999),
  status: z.string().min(1).default('stable'),
  source: StringListSchema,
  tags: StringListSchema,
}).passthrough()

export const HeadingSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  level: z.union([z.literal(2), z.literal(3)]),
})

export const DocRecordSchema = z.object({
  relPath: z.string().min(1),
  slug: z.string().min(1),
  href: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  section: z.string().min(1),
  sectionLabel: z.string().min(1),
  sectionOrder: z.number(),
  order: z.number(),
  status: z.string(),
  source: z.array(z.string()),
  tags: z.array(z.string()),
  raw: z.string(),
  body: z.string(),
  html: z.string(),
  headings: z.array(HeadingSchema),
})

export type DocFrontmatter = z.infer<typeof DocFrontmatterSchema>
export type Heading = z.infer<typeof HeadingSchema>
export type DocRecord = z.infer<typeof DocRecordSchema>

export type DocSection = {
  id: string
  label: string
  order: number
  docs: DocRecord[]
}

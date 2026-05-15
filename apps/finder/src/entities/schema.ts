import { z } from 'zod'

/** finder 도메인 UI 엔티티 zod 스키마.
 *  fs entity(FsNode)는 @interactive-os/fs/schema 가 owner — 여기서는 finder UI 메타만. */

const iconToken = z.string()

export { FsNodeSchema } from '@interactive-os/fs'
export type { FsNode } from '@interactive-os/fs'

export const SidebarItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  path: z.string(),
  icon: iconToken,
})
export type SidebarItem = z.infer<typeof SidebarItemSchema>

export const SmartGroupIdSchema = z.enum(['today', 'yesterday', 'thisWeek', 'thisMonth', 'thisYear'])
export type SmartGroupId = z.infer<typeof SmartGroupIdSchema>

export const SmartGroupItemSchema = z.object({
  id: SmartGroupIdSchema,
  label: z.string(),
  path: z.string(),
  icon: iconToken,
})
export type SmartGroupItem = z.infer<typeof SmartGroupItemSchema>

/** Tag 가상 폴더 — frontmatter.tags 기반. id는 tag 문자열 자체.
 *  path는 `/_tag/<encoded>` (tagIndex.tagPath 참고). */
export const TagGroupItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  path: z.string(),
  icon: iconToken,
  count: z.number(),
})
export type TagGroupItem = z.infer<typeof TagGroupItemSchema>

// ViewModeSchema 는 spec.ts 가 owner (schema↔spec 순환 import 방지)
export { ViewModeSchema, type ViewMode } from './spec'

export const PreviewKindSchema = z.enum(['image', 'markdown', 'code', 'text', 'binary'])
export type PreviewKind = z.infer<typeof PreviewKindSchema>

// ── Feature state·cmd·VM (spec 에서 파생) ──────────────────────────────
import { FsNodeSchema } from '@interactive-os/fs'
import { FinderStateSpec, FinderCmdSpec } from './spec'

/** spec.state 의 { key: { schema } } → z.object({ key: schema }) */
export const FinderStateSchema = z.object(
  Object.fromEntries(
    Object.entries(FinderStateSpec).map(([k, v]) => [k, v.schema]),
  ) as { [K in keyof typeof FinderStateSpec]: typeof FinderStateSpec[K]['schema'] },
)
export type FinderState = z.infer<typeof FinderStateSchema>

/** spec.cmds 의 { type: { payload } } → discriminatedUnion('type', [...]) */
const cmdMembers = Object.entries(FinderCmdSpec).map(([type, def]) =>
  def.payload.extend({ type: z.literal(type) }),
) as unknown as readonly [z.ZodObject<z.ZodRawShape>, ...z.ZodObject<z.ZodRawShape>[]]
export const FinderCmdSchema = z.discriminatedUnion('type', cmdMembers)

/** type 별 payload 까지 포함한 정확한 union 타입. */
export type FinderCmd = {
  [K in keyof typeof FinderCmdSpec]: { type: K } & z.infer<typeof FinderCmdSpec[K]['payload']>
}[keyof typeof FinderCmdSpec]

export const PreviewVMSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('empty') }),
  z.object({ kind: z.literal('dir'),   node: FsNodeSchema }),
  z.object({ kind: z.literal('image'), node: FsNodeSchema, src: z.string().nullable() }),
  z.object({ kind: z.literal('text'),  node: FsNodeSchema, text: z.string().nullable() }),
])
export type PreviewVM = z.infer<typeof PreviewVMSchema>

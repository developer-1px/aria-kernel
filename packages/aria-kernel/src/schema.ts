import { z } from 'zod'
import { ROOT, type UiEvent } from './types'

/**
 * Runtime contract for the headless data rail.
 *
 * The public TypeScript types stay intentionally small, but production
 * consumers need a real gate before declarations reach reducers/renderers.
 */
const IdSchema = z.string().min(1)

/** Entity zod schema — id 는 record key 가 정본이고, value 는 도메인 데이터 그대로다. */
export const EntitySchema = z.record(z.string(), z.unknown())

export const MetaSchema = z.object({
  root: z.array(IdSchema).optional(),
  focus: IdSchema.nullable().optional(),
  expanded: z.array(IdSchema).optional(),
  open: z.array(IdSchema).optional(),
  typeahead: z.object({
    buf: z.string(),
    deadline: z.number().finite(),
  }).optional(),
  selectAnchor: IdSchema.nullable().optional(),
  editing: IdSchema.nullable().optional(),
}).catchall(z.unknown())

const validateGraphRefs = (
  value: {
    entities: Record<string, unknown>
    relationships: Record<string, string[]>
    meta?: { root?: string[] }
  },
  ctx: z.RefinementCtx,
) => {
  const ids = new Set(Object.keys(value.entities))
  for (const parentId of Object.keys(value.relationships)) {
    if (!ids.has(parentId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['relationships', parentId],
        message: `relationship parent "${parentId}" must exist in entities`,
      })
    }
    for (const childId of value.relationships[parentId] ?? []) {
      if (!ids.has(childId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['relationships', parentId],
          message: `relationship child "${childId}" must exist in entities`,
        })
      }
    }
  }
  for (const rootId of value.meta?.root ?? []) {
    if (rootId === ROOT || !ids.has(rootId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['meta', 'root'],
        message: `root id "${rootId}" must exist in entities`,
      })
    }
  }
}

export const CollectionMetaSchema = MetaSchema.extend({
  root: z.array(IdSchema),
})

const NormalizedDataBaseSchema = z.object({
  entities: z.record(IdSchema, EntitySchema),
  relationships: z.record(IdSchema, z.array(IdSchema)),
  meta: MetaSchema.optional(),
})

/** NormalizedData zod schema — entities + relationships 런타임 gate. */
export const NormalizedDataSchema = NormalizedDataBaseSchema.superRefine(validateGraphRefs)

export const CollectionDataSchema = NormalizedDataBaseSchema.extend({
  meta: CollectionMetaSchema,
}).superRefine(validateGraphRefs)

/**
 * navigate dir 어휘 — axis 마이그레이션이 채워가는 의도형 방향 enum.
 * PRD: docs/2026/2026-05/2026-05-05/06_prd_keymap_serializable.md
 */
export const NavigateDirSchema = z.enum([
  'next', 'prev', 'start', 'end',
  'pageNext', 'pagePrev',
  'visibleNext', 'visiblePrev', 'firstChild', 'toParent',
  'gridUp', 'gridDown', 'gridLeft', 'gridRight',
  'rowStart', 'rowEnd', 'gridStart', 'gridEnd',
])

/** UiEvent zod schema — ui ↔ headless 어휘 런타임 gate (discriminated union on `type`). */
export const UiEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('navigate'),
    id: z.string().min(1).optional(),
    dir: NavigateDirSchema.optional(),
  }).refine(
    (e) => (e.id != null) !== (e.dir != null),
    { message: 'navigate requires exactly one of `id` (result-form) or `dir` (intent-form)' },
  ),
  z.object({ type: z.literal('activate'), id: z.string().min(1) }),
  z.object({ type: z.literal('expand'), id: z.string().min(1), open: z.boolean() }),
  z.object({
    type: z.literal('select'),
    ids: z.array(z.string().min(1)),
    to: z.boolean().optional(),
    anchor: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('check'),
    ids: z.array(z.string().min(1)),
    to: z.union([z.boolean(), z.literal('mixed')]).optional(),
  }),
  z.object({ type: z.literal('value'), id: z.string().min(1), value: z.unknown() }),
  z.object({ type: z.literal('open'), id: z.string().min(1), open: z.boolean() }),
  z.object({ type: z.literal('typeahead'), buf: z.string(), deadline: z.number().finite() }),
  z.object({
    type: z.literal('pan'),
    id: z.string().min(1),
    dx: z.number().finite(),
    dy: z.number().finite(),
  }),
  z.object({
    type: z.literal('zoom'),
    id: z.string().min(1),
    cx: z.number().finite(),
    cy: z.number().finite(),
    k: z.number().finite().positive(),
  }),
  z.object({
    type: z.literal('insertAfter'),
    siblingId: z.string().min(1),
    value: z.unknown().optional(),
  }),
  z.object({
    type: z.literal('appendChild'),
    parentId: z.string().min(1),
    value: z.unknown().optional(),
  }),
  z.object({ type: z.literal('update'), id: z.string().min(1), value: z.unknown() }),
  z.object({ type: z.literal('remove'), id: z.string().min(1) }),
  z.object({ type: z.literal('copy'), id: z.string().min(1) }),
  z.object({ type: z.literal('cut'), id: z.string().min(1) }),
  z.object({
    type: z.literal('paste'),
    targetId: z.string().min(1),
    mode: z.enum(['auto', 'child', 'overwrite']).optional(),
    index: z.number().int().nonnegative().optional(),
  }),
  z.object({ type: z.literal('undo') }),
  z.object({ type: z.literal('redo') }),
  // Step A — keyboard-universal app commands (DOM Event 정본 없음).
  z.object({ type: z.literal('selectAll') }),
  z.object({ type: z.literal('selectNone') }),
  z.object({ type: z.literal('selectRange'), to: z.string().min(1) }),
  z.object({ type: z.literal('focus'), id: z.string().min(1) }),
  z.object({
    type: z.literal('sort'),
    key: z.string().min(1),
    order: z.enum(['asc', 'desc', 'none']),
  }),
  z.object({ type: z.literal('filter'), query: z.string() }),
  z.object({ type: z.literal('find'), query: z.string().optional() }),
  z.object({ type: z.literal('save') }),
  z.object({ type: z.literal('commit') }),
  z.object({ type: z.literal('revert') }),
  z.object({ type: z.literal('duplicate'), id: z.string().min(1) }),
  // Step C — traditional app vocabulary.
  z.object({ type: z.literal('new'), parentId: z.string().min(1).optional() }),
  z.object({ type: z.literal('close'), id: z.string().min(1).optional() }),
  z.object({ type: z.literal('cancel'), id: z.string().min(1).optional() }),
  z.object({ type: z.literal('refresh'), id: z.string().min(1).optional() }),
  z.object({ type: z.literal('print') }),
  z.object({ type: z.literal('goBack') }),
  z.object({ type: z.literal('goForward') }),
  z.object({ type: z.literal('expandAll'), id: z.string().min(1).optional() }),
  z.object({ type: z.literal('collapseAll'), id: z.string().min(1).optional() }),
  z.object({ type: z.literal('replace'), query: z.string(), with: z.string() }),
  z.object({ type: z.literal('nextMatch') }),
  z.object({ type: z.literal('prevMatch') }),
  z.object({ type: z.literal('dragStart'), id: z.string().min(1) }),
  z.object({
    type: z.literal('dragOver'),
    id: z.string().min(1),
    targetId: z.string().min(1),
  }),
  z.object({
    type: z.literal('drop'),
    id: z.string().min(1),
    targetId: z.string().min(1),
    mode: z.enum(['child', 'sibling-after', 'sibling-before']).optional(),
  }),
  z.object({ type: z.literal('dragEnd'), id: z.string().min(1) }),
])

/** EntitySchema 추론 타입. */
export type EntityInput = z.infer<typeof EntitySchema>
/** NormalizedDataSchema 추론 타입. */
export type NormalizedDataInput = z.infer<typeof NormalizedDataSchema>
/** CollectionDataSchema 추론 타입. */
export type CollectionDataInput = z.infer<typeof CollectionDataSchema>
/** UiEventSchema 추론 타입. */
export type UiEventInput = z.infer<typeof UiEventSchema>

/** unknown → NormalizedData 검증. 실패 시 ZodError throw. */
export const parseNormalizedData = (value: unknown): NormalizedDataInput =>
  NormalizedDataSchema.parse(value)

/** unknown → collection NormalizedData 검증. `meta.root: []` 는 명시적 empty collection. */
export const parseCollectionData = (value: unknown): CollectionDataInput =>
  CollectionDataSchema.parse(value)

/** unknown → UiEvent 검증. 실패 시 ZodError throw. */
export const parseUiEvent = (value: unknown): UiEventInput =>
  UiEventSchema.parse(value)

/** navigate result-form narrowing — `{type:'navigate', id}` 만 true. */
export const isNavigateById = (
  e: UiEvent,
): e is Extract<UiEvent, { type: 'navigate'; id: string }> =>
  e.type === 'navigate' && typeof (e as { id?: unknown }).id === 'string'

/** navigate intent-form narrowing — `{type:'navigate', dir}` 만 true. */
export const isNavigateByDir = (
  e: UiEvent,
): e is Extract<UiEvent, { type: 'navigate'; dir: string }> =>
  e.type === 'navigate' && typeof (e as { dir?: unknown }).dir === 'string'

/**
 * useZodCrudResource — adapter hook 정본.
 *
 * 패턴 ↔ JsonCrud(zod-crud) wiring 1줄. 외부 store 통합(useResource), crud.subscribe →
 * meta.focus 자동 반영, normalize + meta 합성, dispatch 핸들러가 W3C Clipboard Event +
 * UiEvent 어휘를 jsonCrud op + reduce 양쪽으로 라우팅.
 *
 * 시그니처: `useZodCrudResource(resource, crud, normalize, opts?) → [data, dispatch]`.
 * useResource 시그니처와 정합. 4번째 인자 `opts.kind` 로 'list' | 'tree' | 'grid' 분기
 * (default 'tree').
 *
 * NOTE: UiEvent 정의(`types.ts:69-81`)에 `event` 필드 없음. 패턴 hook PR(Deep module #1)
 * 에서 `onEvent({type:'copy', id, event})` 동봉 시 UiEvent 확장 필요. 이 어댑터는 그
 * 확장이 들어왔다고 가정하고 `(e as {event?}).event` 로 옵셔널하게 읽는다 — event 없으면
 * clipboard payload 처리는 skip 하고 crud op 만 실행 (안전).
 */
import {useEffect, useMemo, useState} from 'react'
import type {ZodType} from 'zod'
import {reduce} from '../../state/reduce'
import {reduceWithDefaults, reduceWithMultiSelect} from '../../state/defaults'
import {useResource, type Resource} from '../../store/data'
import {routeUiEventToCrud, type CrudPort} from '../../store/routeUiEventToCrud'
import type {Meta, NormalizedData, UiEvent} from '../../types'
import {decode, encode} from './codec'

type Kind = 'list' | 'tree' | 'grid'

/** crud.subscribe 까지 포함한 minimal duck-type. zod-crud `JsonCrud<T>` 호환. */
interface CrudWithSubscribe<S = unknown, V = unknown> extends CrudPort<S, V> {
  subscribe(notify: (changes: unknown[], focusNodeId?: string) => void): () => void
}

interface OperationResultLike {
  focusNodeId?: string
}

interface UseZodCrudOptions {
  kind?: Kind
  schema?: ZodType
  /** View-state reducer preset for selection semantics. Default: single. */
  selection?: 'single' | 'multi' | 'none'
  /**
   * labelField — `update {id, value:string}` 시, value 를 entity 자체가 아닌
   * entity 의 child 노드(key === labelField) 에 라우팅. nested-text 를 가진
   * outline-style 도메인에서 widget 이 child id 매핑을 알 필요 없게 함.
   */
  labelField?: string
}

interface JsonNodeLike {
  type?: string
  key?: string
  children?: string[]
}
interface JsonDocLike {
  nodes?: Record<string, JsonNodeLike>
}

const pickEntityState = (
  entities: NormalizedData['entities'],
): NormalizedData['entities'] => {
  const picked: NormalizedData['entities'] = {}
  for (const [id, entity] of Object.entries(entities)) {
    const next: Record<string, unknown> = {}
    if ('selected' in entity) next.selected = entity.selected
    if ('current' in entity) next.current = entity.current
    if ('checked' in entity) next.checked = entity.checked
    if (Object.keys(next).length > 0) picked[id] = next
  }
  return picked
}

export function useZodCrudResource<
  T,
  FlatItem extends Record<string, unknown> = Record<string, unknown>,
>(
  resource: Resource<T>,
  crud: CrudWithSubscribe<T>,
  normalize: (
    snapshot: T,
  ) => Pick<NormalizedData<FlatItem>, 'entities' | 'relationships'> & {meta?: Partial<Meta>},
  opts: UseZodCrudOptions = {},
): [data: NormalizedData<FlatItem>, dispatch: (e: UiEvent) => void] {
  const kind: Kind = opts.kind ?? 'tree'
  const reduceView =
    opts.selection === 'multi'
      ? reduceWithMultiSelect
      : opts.selection === 'none'
        ? reduce
        : reduceWithDefaults

  const [doc, baseDispatch] = useResource(resource)
  const snapshot = doc ?? crud.snapshot()

  const [meta, setMeta] = useState<Meta>({})
  const [entityState, setEntityState] = useState<NormalizedData['entities']>({})

  // crud.subscribe → meta.focus 자동 반영. unmount 시 자동 해제.
  useEffect(() => {
    return crud.subscribe((_changes, focusNodeId) => {
      if (focusNodeId) setMeta((prev) => ({...prev, focus: focusNodeId}))
    })
  }, [crud])

  const data = useMemo<NormalizedData<FlatItem>>(() => {
    const flat = normalize(snapshot)
    const entities = Object.fromEntries(
      Object.entries(flat.entities).map(([id, entity]) => [
        id,
        {...entity, ...(entityState[id] ?? {})},
      ]),
    ) as NormalizedData<FlatItem>['entities']
    return {
      entities,
      relationships: flat.relationships,
      meta: {...flat.meta, ...meta},
    }
  }, [snapshot, meta, entityState, normalize])

  const dispatch = (e: UiEvent): void => {
    const ev = (e.type === 'copy' || e.type === 'cut' || e.type === 'paste') ? e.event : undefined
    const cb = ev?.clipboardData

    // ── Clipboard 어휘 — DOM event 동봉 시 payload 직렬화/역직렬화 ─────────────
    if (e.type === 'copy' || e.type === 'cut') {
      if (cb) {
        const value = crud.copy(e.id)
        const enc = encode(value, {kind})
        cb.setData('application/x-p-headless+json', enc.json)
        cb.setData('text/html', enc.html)
        cb.setData('text/plain', enc.plain)
        ev!.preventDefault()
      }
      if (e.type === 'cut') {
        const result = crud.cut(e.id) as OperationResultLike
        baseDispatch({type: 'set', value: crud.snapshot()})
        if (result?.focusNodeId) setMeta((prev) => ({...prev, focus: result.focusNodeId}))
      }
      return
    }

    // ── move — clipboard 미오염 구조 편집 (Tab demote/promote) ────────────────
    // read + insert + delete 시퀀스. crud.cut/paste 안 씀 → 사용자 clipboard buffer 보존.
    if (e.type === 'move') {
      const value = crud.read?.(e.id)
      if (value === undefined) return
      // 이동 전 — 옮길 subtree 안의 expanded 자손들을 상대 path 로 캡처.
      // appendChild/insertAfter 가 새 id 를 allocate 하므로 meta.expanded 의 옛 id 들이
      // 무효해진다. 이를 보존하려면 path → 새 id 로 재매핑해야 한다.
      const wasExpanded = new Set(data.meta?.expanded ?? [])
      const expandedPaths: number[][] = []
      const captureExpanded = (id: string, path: number[]): void => {
        if (wasExpanded.has(id)) expandedPaths.push(path)
        const kids = data.relationships[id] ?? []
        kids.forEach((kid, i) => captureExpanded(kid, [...path, i]))
      }
      captureExpanded(e.id, [])

      let inserted: OperationResultLike | undefined
      if (e.mode === 'child') {
        inserted = crud.appendChild(e.targetId, value as unknown as Parameters<CrudWithSubscribe['appendChild']>[1]) as OperationResultLike
      } else if (e.mode === 'sibling-after') {
        inserted = crud.insertAfter(e.targetId, value as unknown as Parameters<CrudWithSubscribe['insertAfter']>[1]) as OperationResultLike
      } else if (e.mode === 'sibling-before') {
        inserted = crud.insertBefore?.(e.targetId, value as unknown as Parameters<CrudWithSubscribe['insertAfter']>[1]) as OperationResultLike
        if (!inserted) {
          inserted = crud.insertAfter(e.targetId, value as unknown as Parameters<CrudWithSubscribe['insertAfter']>[1]) as OperationResultLike
        }
      }
      crud.delete(e.id)
      baseDispatch({type: 'set', value: crud.snapshot()})

      const newId = inserted?.focusNodeId
      // 새 subtree 의 relationships 를 normalize 으로 재구성해서 path → 새 id 매핑.
      const newFlat = normalize(crud.snapshot())
      const findByPath = (rootId: string, path: number[]): string | undefined =>
        path.reduce<string | undefined>((cur, i) => (cur ? (newFlat.relationships[cur] ?? [])[i] : undefined), rootId)

      setMeta((prev) => {
        const next: Meta = {...prev}
        if (newId) next.focus = newId
        const expanded = new Set(prev.expanded ?? [])
        // 옛 subtree 의 모든 id 를 expanded 에서 제거 (옛 id 는 이제 무효).
        const purge = (id: string): void => {
          expanded.delete(id)
          ;(data.relationships[id] ?? []).forEach(purge)
        }
        purge(e.id)
        // 새 subtree 에 옛 expanded 위치를 매핑해 다시 추가.
        if (newId) {
          for (const path of expandedPaths) {
            const mapped = findByPath(newId, path)
            if (mapped) expanded.add(mapped)
          }
        }
        // child mode 면 부모도 expand.
        if (e.mode === 'child') expanded.add(e.targetId)
        next.expanded = [...expanded]
        return next
      })
      return
    }

    if (e.type === 'paste') {
      // DOM clipboard event 동봉 시: schema 검증만 (zod-crud paste 는 내부 buffer 사용 — value 안 받음).
      // 검증 실패 → silent 무시 (User Story #23). 단 DOM event 없을 때(Tab demote / Shift+Cmd+V keymap)
      // 는 검증 단계 skip 하고 내부 buffer 로 paste — Tab demote 시퀀스 cut+paste 가 같은 frame 안에서
      // 동작하므로 buffer 가 항상 fresh. cross-app paste 미지원(zod-crud 한계).
      if (cb) {
        const value = decode(cb, {kind, schema: opts.schema})
        if (value == null) return
        ev!.preventDefault()
      }
      const result = crud.paste(e.targetId, {mode: e.mode, index: e.index}) as OperationResultLike
      baseDispatch({type: 'set', value: crud.snapshot()})
      if (result?.focusNodeId) setMeta((prev) => ({...prev, focus: result.focusNodeId}))
      return
    }

    // ── update + labelField — child 노드(key === labelField) 로 자동 라우팅 ─────
    // widget 이 nested-text 매핑(예: outline 의 text child id) 을 알 필요 없게 함.
    if (e.type === 'update' && opts.labelField && typeof e.value === 'string') {
      const doc = crud.snapshot() as JsonDocLike
      const obj = doc.nodes?.[e.id]
      if (obj?.type === 'object' && obj.children) {
        const childId = obj.children.find((cid) => doc.nodes?.[cid]?.key === opts.labelField)
        if (childId) {
          crud.update(childId, e.value as Parameters<CrudWithSubscribe['update']>[1])
          baseDispatch({type: 'set', value: crud.snapshot()})
          return
        }
      }
    }

    // ── 나머지 편집/히스토리 어휘 — routeUiEventToCrud 위임 ─────────────────────
    if (
      e.type === 'undo' ||
      e.type === 'redo' ||
      e.type === 'remove' ||
      e.type === 'update' ||
      e.type === 'insertAfter' ||
      e.type === 'appendChild'
    ) {
      const next = routeUiEventToCrud(crud, e)
      if (next !== undefined) {
        baseDispatch({type: 'set', value: next})
        // crud.subscribe 가 focus 를 push 하므로 별도 setMeta 불필요.
      }
      return
    }

    // ── view-state 어휘 — core reduce 위임 (focus/expand/select/typeahead/...) ─
    setMeta((prev) => {
      const next = reduceView({entities: data.entities, relationships: data.relationships, meta: prev}, e)
      setEntityState(pickEntityState(next.entities))
      return next.meta ?? prev
    })
  }

  return [data, dispatch]
}

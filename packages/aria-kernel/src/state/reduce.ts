/**
 * Core reducer — UiEvent → NormalizedData 의 정본. composeReducers 의 첫 칸.
 *
 * 계약 (invariant):
 *   1. **Core-reduced**: navigate · expand · open · typeahead · pan · zoom · select.
 *      이들의 의미는 NormalizedData(meta.focus / meta.expanded / meta.open /
 *      meta.typeahead / entities[id].{x,y,s} / meta.selectAnchor) 위에서 닫힌다.
 *   2. **Identity (host territory)**: activate · value ·
 *      insertAfter · appendChild · update · remove · copy · cut · paste · undo · redo.
 *      core 는 패스스루. host reducer (selection / value / zod-crud 어댑터) 가 의미를 합성.
 *
 * 새 UiEvent 추가 시 둘 중 어느 트랙인지 결정하고 handlers map 에 등록. identity
 * 트랙은 `identity` 로, core-reduced 트랙은 inline 핸들러로.
 */
import type { Meta, NormalizedData, UiEvent } from '../intent/events'
import { resolveNavigate } from './resolveNavigate'
import { resolveIntent } from './resolveIntent'
import type { AxisIntent } from '../axes/intents'
import { isAxisIntent } from '../axes/intents'

/** UiEvent type 별로 narrow 된 reducer 핸들러 시그니처. */
type Handler<T extends UiEvent['type']> = (
  d: NormalizedData,
  e: Extract<UiEvent, { type: T }>,
) => NormalizedData

/** meta 부분 패치 — focus/expanded/typeahead 등 메타 갱신용. */
const setMeta = (d: NormalizedData, patch: Partial<Meta>): NormalizedData => ({
  ...d,
  meta: { ...d.meta, ...patch },
})

/** entity 부분 패치 — 존재하지 않으면 no-op. */
const mergeData = (d: NormalizedData, id: string, patch: Record<string, unknown>): NormalizedData => {
  const prev = d.entities[id]
  if (!prev) return d
  return {
    ...d,
    entities: { ...d.entities, [id]: { ...prev, ...patch } },
  }
}

/** [lo, hi] 구간으로 자르기. */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** meta 의 id-set('expanded' | 'open') 에서 id 의 toggle 상태를 강제. */
const toggleSet = (d: NormalizedData, key: 'expanded' | 'open', id: string, on: boolean): NormalizedData => {
  const prev = d.meta?.[key] ?? []
  const has = prev.includes(id)
  if (on === has) return d
  const next = on ? [...prev, id] : prev.filter((x) => x !== id)
  return setMeta(d, { [key]: next } as Partial<Meta>)
}

/** identity reducer — 데이터 패스스루. activate/value/edit 어휘처럼 host reducer 가 처리할 의도 이벤트. */
const identity = (d: NormalizedData) => d

const handlers: { [K in UiEvent['type']]: Handler<K> } = {
  navigate: (d, e) => {
    const id = e.dir ? resolveNavigate(d, e.dir, e.id) : e.id
    return id ? setMeta(d, { focus: id }) : d
  },
  expand: (d, e) => toggleSet(d, 'expanded', e.id, e.open),
  open: (d, e) => toggleSet(d, 'open', e.id, e.open),
  typeahead: (d, e) => setMeta(d, { typeahead: { buf: e.buf, deadline: e.deadline } }),
  activate: identity,
  select: (d, e) => (e.anchor && e.ids.length === 1 ? setMeta(d, { selectAnchor: e.ids[0] }) : d),
  check: identity,
  value: identity,
  pan: (d, e) => {
    const cur = d.entities[e.id] ?? {}
    const x = ((cur.x as number) ?? 0) + e.dx
    const y = ((cur.y as number) ?? 0) + e.dy
    return mergeData(d, e.id, { x, y })
  },
  zoom: (d, e) => {
    const cur = d.entities[e.id] ?? {}
    const s0 = (cur.s as number) ?? 1
    const x0 = (cur.x as number) ?? 0
    const y0 = (cur.y as number) ?? 0
    const bounds = (cur.bounds as { minS?: number; maxS?: number }) ?? {}
    const s = clamp(s0 * e.k, bounds.minS ?? 0.05, bounds.maxS ?? 16)
    const k = s / s0
    const x = e.cx - (e.cx - x0) * k
    const y = e.cy - (e.cy - y0) * k
    return mergeData(d, e.id, { x, y, s })
  },
  // Edit / Clipboard / History — 모두 host reducer (예: zod-crud 어댑터) 가 처리할 의도 이벤트.
  insertAfter: identity,
  appendChild: identity,
  update: identity,
  remove: identity,
  copy: identity,
  cut: identity,
  paste: identity,
  undo: identity,
  redo: identity,
  move: identity,
  editStart: (d, e) => setMeta(d, { editing: e.id }),
  editEnd: (d) => setMeta(d, { editing: null }),
  // Step A — keyboard-universal app commands. 모두 host reducer 가 의미 부여.
  focus: (d, e) => setMeta(d, { focus: e.id }),
  selectAll: identity,
  selectNone: identity,
  selectRange: identity,
  sort: identity,
  filter: identity,
  find: identity,
  save: identity,
  commit: identity,
  revert: (d) => setMeta(d, { editing: null }),
  duplicate: identity,
  // Step C — traditional app vocabulary. 모두 host territory.
  new: identity,
  close: identity,
  cancel: identity,
  refresh: identity,
  print: identity,
  goBack: identity,
  goForward: identity,
  expandAll: identity,
  collapseAll: identity,
  replace: identity,
  nextMatch: identity,
  prevMatch: identity,
  dragStart: identity,
  dragOver: identity,
  drop: identity,
  dragEnd: identity,
}

/**
 * 코어 reducer — UiEvent 의 기본 의미(focus/expand/open/typeahead/pan/zoom)를 NormalizedData 에 적용.
 * activate/select/value 는 identity 로 패스 — host reducer 가 도메인 의미(selection/value)를 합성한다.
 *
 * @example
 * const myReduce = composeReducers(reduce, singleSelect, setValue)
 */
export const reduce = (d: NormalizedData, e: UiEvent | AxisIntent): NormalizedData => {
  if (isAxisIntent(e as { type: string })) {
    return resolveIntent(d, e as AxisIntent).reduce(reduce, d)
  }
  return (handlers[(e as UiEvent).type] as Handler<UiEvent['type']>)(d, e as UiEvent)
}

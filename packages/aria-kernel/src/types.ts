/** navigate dir 어휘 — schema.ts 의 NavigateDirSchema 와 동기. */
export type NavigateDir =
  | 'next' | 'prev' | 'start' | 'end'
  | 'pageNext' | 'pagePrev'
  | 'visibleNext' | 'visiblePrev' | 'firstChild' | 'toParent'
  | 'gridUp' | 'gridDown' | 'gridLeft' | 'gridRight'
  | 'rowStart' | 'rowEnd' | 'gridStart' | 'gridEnd'

/**
 * NormalizedData — three separated stores:
 *   entities      = id → user data (id is the key, value IS the data)
 *   relationships = id → child ids (entity-keyed only; top-level lives in meta.root)
 *   meta          = library-owned auxiliary state (focus/expanded/open/typeahead/...)
 *
 * Invariants:
 *   - Object.keys(relationships) ⊆ Object.keys(entities)
 *   - meta is library-owned; entities are user-owned (modulo reserved per-item flags
 *     `selected` / `disabled` / `value` that the library reads)
 */
export interface NormalizedData<
  E extends Record<string, unknown> = Record<string, unknown>,
  M extends Meta = Meta,
> {
  entities: Record<string, E>
  relationships: Record<string, string[]>
  meta?: M
}

export type CollectionMeta = Meta & { root: string[] }

export type CollectionData<
  E extends Record<string, unknown> = Record<string, unknown>,
  M extends Meta = Meta,
> = NormalizedData<E, M & CollectionMeta> & {
  meta: M & CollectionMeta
}

/**
 * Meta — 라이브러리 base 키(focus/expanded/open/typeahead/...)는 라이브러리가 읽고 쓴다.
 * 사용자가 `interface MyMeta extends Meta { window?: ... }` 로 키를 추가하면
 * 라이브러리는 추가 키를 읽지 않고 그대로 보존한다. invariant 안 깨짐.
 */
export interface Meta {
  root?: string[]
  focus?: string | null
  expanded?: string[]
  open?: string[]
  typeahead?: { buf: string; deadline: number }
  selectAnchor?: string | null
  /** 인라인 편집 중인 entity id (rename/edit-in-place). null/undefined ⇒ 비편집. */
  editing?: string | null
}

/**
 * UiEvent — ui ↔ headless 통신의 단일 어휘. DOM `Event` global과 충돌 방지를 위해
 * `Ui` prefix 명시.
 */
export type UiEvent =
  /** navigate — id ⊕ dir (result-form ⊕ intent-form). schema.ts 의 zod refine 으로 런타임 강제. */
  | { type: 'navigate'; id?: string; dir?: NavigateDir }
  | { type: 'activate'; id: string }
  /**
   * expand — **inline content reveal** (accordion section · disclosure twisty · tree branch).
   * trigger 옆 콘텐츠가 in-flow 로 펼쳐짐. ARIA: `aria-expanded` on trigger.
   * 대비: 'open' 은 popover/overlay (out-of-flow). 같은 aria-expanded 를 emit 해도 의도가 다름.
   */
  | { type: 'expand'; id: string; open: boolean }
  /**
   * select — `aria-selected` 통합 어휘. 항상 ids 배열.
   * `to` undefined ⇒ replace (ids 만 selected, 나머지 unselected). 단일 클릭 정본.
   * `to: true` ⇒ additive set, `to: false` ⇒ unset. range/all/none batch.
   * `anchor: true` ⇒ meta.selectAnchor 도 함께 갱신 (Space/Cmd+click 의 anchor reset).
   * range select(Shift+Arrow) 는 anchor 유지해야 하므로 anchor 생략.
   */
  | { type: 'select'; ids: string[]; to?: boolean; anchor?: boolean }
  /**
   * check — `aria-checked` 통합 어휘. 항상 ids 배열.
   * `to` undefined ⇒ 각 id 독립 토글. `to: true|false|'mixed'` ⇒ 일괄 set.
   * 단일 토글은 `ids: [id]`. cascade/group 은 ids[].
   */
  | { type: 'check'; ids: string[]; to?: boolean | 'mixed' }
  | { type: 'value'; id: string; value: unknown }
  /**
   * open — **popover/overlay 가시성** (combobox listbox · menu · dialog · tooltip).
   * out-of-flow overlay 가 떠오름/사라짐. ARIA: combobox `aria-expanded`, dialog `aria-modal`,
   * 또는 conditional mount. 대비: 'expand' 는 inline reveal.
   */
  | { type: 'open'; id: string; open: boolean }
  | { type: 'typeahead'; buf: string; deadline: number }
  /** pan: target entity의 (x, y)를 (dx, dy)만큼 이동 — gesture 어댑터가 wheel/pointer를 번역 */
  | { type: 'pan'; id: string; dx: number; dy: number }
  /** zoom: cursor (cx, cy)를 고정점으로 scale을 k 배 — Figma/Miro 식 cursor-anchored zoom */
  | { type: 'zoom'; id: string; cx: number; cy: number; k: number }
  /**
   * Edit / Clipboard / History 어휘 — 정본 = zod-crud `JsonCrud` op 1:1.
   * 의도적으로 시그니처가 zod-crud 와 동일 (insertAfter / appendChild / update / delete / copy / cut / paste / undo / redo).
   * 추상화 0, 옵션 0 — opinionated.
   */
  | { type: 'insertAfter'; siblingId: string; value?: unknown }
  | { type: 'appendChild'; parentId: string; value?: unknown }
  | { type: 'update'; id: string; value: unknown }
  | { type: 'remove'; id: string }
  | { type: 'copy'; id: string; event?: ClipboardEvent }
  | { type: 'cut'; id: string; event?: ClipboardEvent }
  | { type: 'paste'; targetId: string; mode?: 'auto' | 'child' | 'overwrite'; index?: number; event?: ClipboardEvent }
  /**
   * move — id 를 targetId 로 이동. clipboard 를 거치지 않음 (Tab demote/promote 같은
   * 구조 편집은 사용자의 cut/copy buffer 를 오염시키면 안 됨). adapter 가 read + insert +
   * delete 시퀀스로 구현하거나 backend native move 위임.
   */
  | { type: 'move'; id: string; targetId: string; mode: 'child' | 'sibling-after' | 'sibling-before' }
  | { type: 'undo' }
  | { type: 'redo' }
  /** editStart — 인라인 편집 진입(meta.editing = id). UI 가 input 으로 swap. */
  | { type: 'editStart'; id: string }
  /** editEnd — 인라인 편집 종료(meta.editing = null). commit 은 별도 update 이벤트로. */
  | { type: 'editEnd' }
  /**
   * Step A — 키보드 보편 액션 (DOM Event 에 정본 없음). host reducer 가 의미 부여.
   * 모두 Cmd/Ctrl 단축키 정합 — selectAll(A) selectNone(Esc) find(F) save(S)
   * commit(Enter) revert(Esc-edit) duplicate(D).
   */
  /** selectAll — Cmd/Ctrl+A. 가시 항목 전체 선택. host reducer 가 select{ids,to:true} 로 풀거나 직접 처리. */
  | { type: 'selectAll' }
  /** selectNone — Esc. 현재 선택 비우기. */
  | { type: 'selectNone' }
  /** selectRange — Shift+Click/Arrow. anchor 부터 to 까지 범위 선택. anchor 는 meta.selectAnchor 사용. */
  | { type: 'selectRange'; to: string }
  /**
   * focus — 프로그래매틱 포커스 설정. `navigate { id }` 와 다른 점:
   * navigate 는 사용자 제스처라 sff 같은 gesture 가 select 부수효과를 합성하지만,
   * focus 는 autoFocus·dialog 복귀·find 결과 점프처럼 부수효과 없는 순수 focus 이동.
   */
  | { type: 'focus'; id: string }
  /** sort — `aria-sort` 정본. key + order. */
  | { type: 'sort'; key: string; order: 'asc' | 'desc' | 'none' }
  /** filter — collection query 입력 (combobox·grid·listbox). typeahead 와 다른 축. */
  | { type: 'filter'; query: string }
  /** find — Cmd/Ctrl+F. find UI 토글 또는 query 갱신. */
  | { type: 'find'; query?: string }
  /** save — Cmd/Ctrl+S. host 가 persist. */
  | { type: 'save' }
  /** commit — Enter on edit. 현재 편집을 확정. update 이벤트와 함께 dispatch 하기도 함. */
  | { type: 'commit' }
  /** revert — Esc on edit. 편집 폐기. editEnd 와 함께 dispatch. */
  | { type: 'revert' }
  /** duplicate — Cmd/Ctrl+D. id 를 형제로 복제. host 가 read+insert 로 풀음. */
  | { type: 'duplicate'; id: string }
  /**
   * 전통적인 앱 어휘 — File·Edit·View·Window 메뉴 보편 액션 + DnD + 위치 히스토리.
   * 모두 host reducer 가 의미 부여 (identity in core).
   */
  /** new — Cmd/Ctrl+N. 새 항목/문서 생성. parentId 생략 시 root. */
  | { type: 'new'; parentId?: string }
  /** close — Cmd/Ctrl+W. 윈도우·탭·다이얼로그 닫기. open{open:false} 와 다름 — 사용자 의도 dismiss. */
  | { type: 'close'; id?: string }
  /** cancel — Esc on dialog/popover. DOM `<dialog>` cancel event 정본. close 와 다름 — 확정 vs 취소. */
  | { type: 'cancel'; id?: string }
  /** refresh — Cmd/Ctrl+R / F5. data refetch 의도. id 생략 시 전체. */
  | { type: 'refresh'; id?: string }
  /** print — Cmd/Ctrl+P. */
  | { type: 'print' }
  /** goBack — Cmd+[ / Backspace. 위치 히스토리 뒤로. undo(내용 히스토리)와 분리. */
  | { type: 'goBack' }
  /** goForward — Cmd+]. 위치 히스토리 앞으로. */
  | { type: 'goForward' }
  /** expandAll — Cmd+Opt+→. 트리 전체 펼침. id 생략 시 root 부터. */
  | { type: 'expandAll'; id?: string }
  /** collapseAll — Cmd+Opt+←. 트리 전체 접음. */
  | { type: 'collapseAll'; id?: string }
  /** replace — Cmd+H. find & replace. */
  | { type: 'replace'; query: string; with: string }
  /** nextMatch — F3. find 결과 다음. */
  | { type: 'nextMatch' }
  /** prevMatch — Shift+F3. find 결과 이전. */
  | { type: 'prevMatch' }
  /** dragStart — DnD gesture 시작. HTML5 dragstart 정본. */
  | { type: 'dragStart'; id: string }
  /** dragOver — DnD 중 hover target 후보. */
  | { type: 'dragOver'; id: string; targetId: string }
  /** drop — DnD 확정. move 와 다름 — drop 은 gesture intent, move 는 결과 op. */
  | { type: 'drop'; id: string; targetId: string; mode?: 'child' | 'sibling-after' | 'sibling-before' }
  /** dragEnd — DnD 종료(취소 포함). */
  | { type: 'dragEnd'; id: string }

/**
 * UiEvent 의 `value` 변종에서 id 가 빠진 단일값 dispatch shape — slider/switch/spinbutton/splitter.
 * Note: id-bound `update` 는 `UiEvent` 본체에. `ValueEvent<T>` 는 id 없는 단일값 컨트롤 전용.
 */
export type ValueEvent<T> = { type: 'value'; value: T }

/** UiEvent 카테고리 — ARIA spec 어휘 기준 의미 그룹. */
export type UiEventCategory =
  | 'navigate' | 'activate' | 'select' | 'check' | 'value'
  | 'query' | 'crud' | 'clip' | 'history' | 'edit' | 'cmd' | 'gesture'

/**
 * UI_EVENT_CATEGORY — variant → category SSOT.
 * Record<UiEvent['type'], UiEventCategory> 라 새 variant 추가 시 컴파일러가 누락 강제.
 * 직렬화 가능 (string → string map).
 */
export const UI_EVENT_CATEGORY: Record<UiEvent['type'], UiEventCategory> = {
  navigate: 'navigate', focus: 'navigate', typeahead: 'navigate',
  activate: 'activate', expand: 'activate', open: 'activate',
  select: 'select', selectAll: 'select', selectNone: 'select', selectRange: 'select',
  check: 'check',
  value: 'value',
  sort: 'query', filter: 'query', find: 'query',
  insertAfter: 'crud', appendChild: 'crud', update: 'crud', remove: 'crud', move: 'crud', duplicate: 'crud',
  copy: 'clip', cut: 'clip', paste: 'clip',
  undo: 'history', redo: 'history',
  editStart: 'edit', editEnd: 'edit', commit: 'edit', revert: 'edit',
  save: 'cmd', refresh: 'cmd', print: 'cmd',
  pan: 'gesture', zoom: 'gesture',
  // Step C — traditional app vocabulary
  new: 'crud',
  close: 'activate', cancel: 'activate',
  goBack: 'navigate', goForward: 'navigate',
  expandAll: 'activate', collapseAll: 'activate',
  replace: 'query', nextMatch: 'query', prevMatch: 'query',
  dragStart: 'gesture', dragOver: 'gesture', drop: 'gesture', dragEnd: 'gesture',
}

/** 카테고리 표시 메타 (label · hint). 직렬화 가능. */
export const UI_EVENT_CATEGORY_META: Record<UiEventCategory, { label: string; hint: string }> = {
  navigate: { label: 'Navigate',  hint: 'focus 이동 · typeahead' },
  activate: { label: 'Activate',  hint: 'Enter/Space/click + open/expand' },
  select:   { label: 'Select',    hint: 'aria-selected · range · all/none' },
  check:    { label: 'Check',     hint: 'aria-checked' },
  value:    { label: 'Value',     hint: 'slider · spinbutton · splitter' },
  query:    { label: 'Query',     hint: 'sort · filter · find' },
  crud:     { label: 'Structure', hint: 'zod-crud op 1:1' },
  clip:     { label: 'Clipboard', hint: 'W3C Clipboard event' },
  history:  { label: 'History',   hint: '' },
  edit:     { label: 'Edit mode', hint: '인라인 편집 + commit/revert' },
  cmd:      { label: 'Command',   hint: '키보드 보편 명령' },
  gesture:  { label: 'Gesture',   hint: 'pointer/wheel → pan · zoom' },
}

/** 카테고리 표시 순서 — 위 META 의 키 순서 그대로. */
export const UI_EVENT_CATEGORY_ORDER: readonly UiEventCategory[] =
  Object.keys(UI_EVENT_CATEGORY_META) as UiEventCategory[]

/** meta.root (top-level id 배열) read. */
export const getRoot = (d: NormalizedData): string[] =>
  d.meta?.root ?? []

/** collection pattern 입력에서 의도된 빈 collection 은 `meta.root: []` 로 명시한다. */
export const hasRoot = (d: NormalizedData): d is CollectionData =>
  Array.isArray(d.meta?.root)

export const getCollectionRoot = (d: NormalizedData): string[] => {
  if (hasRoot(d)) return d.meta.root
  throw new Error(
    'Collection NormalizedData requires `meta.root`; use `meta: { root: [] }` for an intentionally empty collection.',
  )
}

/** 현재 focus id read (없으면 null). */
export const getFocus = (d: NormalizedData): string | null =>
  d.meta?.focus ?? null

/** expanded id 집합 read. */
export const getExpanded = (d: NormalizedData): Set<string> =>
  new Set(d.meta?.expanded ?? [])

/** open id 집합 read (popover/menu/dialog). */
export const getOpen = (d: NormalizedData): Set<string> =>
  new Set(d.meta?.open ?? [])

/** typeahead 버퍼 read (`{buf, deadline}`). */
export const getTypeahead = (d: NormalizedData): { buf: string; deadline: number } =>
  d.meta?.typeahead ?? { buf: '', deadline: 0 }

/** range-select 의 anchor id read. */
export const getSelectAnchor = (d: NormalizedData): string | null =>
  d.meta?.selectAnchor ?? null

/**
 * ROOT — sentinel "container id" used by axes/patterns to mean "top-level".
 * Not a real entity. `getChildren(d, ROOT)` returns `meta.root`.
 * Users do NOT write this in literals; they set `meta.root` instead.
 */
export const ROOT = '__root__'

/** id 의 자식 id 배열. id===ROOT 면 meta.root 반환. */
export const getChildren = (d: NormalizedData, id: string): string[] => {
  if (id === ROOT) return d.meta?.root ?? []
  return d.relationships[id] ?? []
}

/** collection pattern 용 children read. ROOT entrypoint 는 명시된 `meta.root` 만 허용한다. */
export const getCollectionChildren = (d: NormalizedData, id: string): string[] => {
  if (id === ROOT) return getCollectionRoot(d)
  return getChildren(d, id)
}

/** entity.label read (없으면 id). typeahead 매칭용. */
export const getLabel = (d: NormalizedData, id: string): string => {
  const v = d.entities[id]?.label
  return typeof v === 'string' ? v : id
}

/** entity.disabled flag read. */
export const isDisabled = (d: NormalizedData, id: string): boolean =>
  Boolean(d.entities[id]?.disabled)

/** entity.selected flag read. */
export const isSelected = (d: NormalizedData, id: string): boolean =>
  Boolean(d.entities[id]?.selected)

/** id 가 현재 focus 와 일치하는지. */
export const isFocused = (d: NormalizedData, id: string): boolean =>
  d.meta?.focus === id

/** id 가 `meta.open` 집합에 포함되는지 (popover/menu/dialog/combobox popup). */
export const isOpen = (d: NormalizedData, id: string): boolean =>
  d.meta?.open?.includes(id) ?? false

/** id 가 `meta.expanded` 집합에 포함되는지 (accordion/tree branch). */
export const isExpanded = (d: NormalizedData, id: string): boolean =>
  d.meta?.expanded?.includes(id) ?? false

/** ControlProps — data + onEvent. 상호작용 컴포넌트의 공용 prop shape. */
export interface ControlProps<
  E extends Record<string, unknown> = Record<string, unknown>,
  M extends Meta = Meta,
> {
  data: NormalizedData<E, M>
  /** 상호작용 컴포넌트는 필수. Display-only Collection은 생략 가능. */
  onEvent?: (e: UiEvent) => void
}

/**
 * CollectionProps<Extra, E, M> — 집합/계층 렌더 ui의 공용 루트 타입.
 * data 기반 컴포넌트는 반드시 이 타입을 props 시그니처로 써야 한다.
 */
export type CollectionProps<
  Extra = {},
  E extends Record<string, unknown> = Record<string, unknown>,
  M extends Meta = Meta,
> = ControlProps<E, M> & Extra

/** Tone — 의미 색 토큰 (default/info/success/warning/danger/primary). */
export type Tone = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'primary'

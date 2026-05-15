import type { UiEvent, NormalizedData } from '../intent/events'
import type { Trigger } from '../trigger'
import { parseTrigger } from '../trigger'
import { triggerMatches } from '../trigger'

export type Chord = string

/**
 * Axis — data 기반 APG 키/포인터 처리 primitive.
 *
 * 입력: data + focus id + Trigger (key 또는 click)
 * 출력: 적용할 UiEvent[] 또는 null(무반응).
 *
 * activate 는 Enter/Space 와 click 모두 반응. 나머지(navigate/expand/typeahead
 * /treeNavigate/treeExpand)는 key 만 반응하고 click 은 바로 null 반환 — 컴포넌트
 * 쪽에서 click 의 focus 이동은 별도 처리한다.
 */
/**
 * Axis — function-with-property. 호출 가능 (data + trigger → UiEvent[] | null) 하면서
 * `chords` 메타데이터로 자신이 응답하는 chord 목록을 노출.
 *
 * `chords` 는 phase 4 (PRD #38) 추가 — demo·문서가 `axis.chords` 직접 read 하여
 * 별도 probe 없이 chord 목록 추출 (`axisKeys(axis)` 는 key 부분만 추가 dedup).
 */
export type Axis = ((d: NormalizedData, id: string, t: Trigger) => UiEvent[] | null) & {
  /** axis 가 응답하는 shortcut 목록. 직렬화 가능. */
  readonly chords: readonly string[]
}

/** axis 함수에 chords 메타 부착하는 helper. axis wrapper 가 inner axis chords 흡수할 때 사용. */
export const tagAxis = (fn: (d: NormalizedData, id: string, t: Trigger) => UiEvent[] | null, chords: readonly string[]): Axis => {
  const tagged = fn as Axis
  Object.defineProperty(tagged, 'chords', { value: Object.freeze([...chords]), enumerable: true, configurable: true })
  return tagged
}

/**
 * composeAxes — 여러 Axis 를 우선순위 순으로 합성. 첫 non-null 반환을 채택, 나머지 axis 는 단락.
 * 합성된 Axis 의 `chords` 는 sub-axis chords 의 union (중복 제거).
 *
 * 같은 키를 두 axis 가 다루면 앞쪽이 이긴다 (예: treeExpand 가 Space 를 흡수해야 activate 가 leaf 에서만 발화).
 */
export const composeAxes = (...axes: Axis[]): Axis => {
  const fn = (d: NormalizedData, id: string, t: Trigger): UiEvent[] | null => {
    for (const a of axes) {
      const r = a(d, id, t)
      if (r) return r
    }
    return null
  }
  const seen = new Set<string>()
  for (const a of axes) for (const c of a.chords ?? []) seen.add(c)
  return tagAxis(fn, [...seen])
}

/** axisKeys — axis 가 응답하는 chord 의 key 부분만 추출 (display 용). */
export const axisKeys = (axis: Axis): readonly string[] => {
  const seen = new Set<string>()
  for (const c of axis.chords ?? []) {
    // chord 의 마지막 '+' 뒤가 key (Click / Space alias 처리는 표시 단계에서)
    const lp = c.lastIndexOf('+')
    const k = lp === -1 ? c : c.slice(lp + 1) || '+'
    seen.add(k === 'Space' ? ' ' : k)
  }
  return [...seen]
}

/**
 * KeyHandler — chord 매칭 시 호출되는 data-driven 함수. UiEvent[] 또는 null 반환.
 *
 * **언제 쓰나:** 결과 event 의 payload 가 axis 가 보는 entity 데이터에 의존할 때.
 *   - `numericStep`: clamp 산수 (`Math.min(max, value + step)`) 가 entity 의 value/min/max/step 을 읽어야 함.
 *   - `multiSelect`/`gridMultiSelect`: anchor↔current range 계산이 enabledSiblings/grid coord 를 읽어야 함.
 *   - leaf gate (자식 有 시 차단) 처럼 분기가 data 의존인 경우.
 *
 * 그 외 단순 의도 emit (navigate/expand/treeStep 등) 은 `UiEventTemplate` 으로 충분 —
 * 실제 id/좌표 산수는 reducer (resolveNavigate/resolveTreeStep) 가 담당.
 */
export type KeyHandler = (d: NormalizedData, id: string) => UiEvent[] | null

/**
 * UiEventTemplate — 100% 직렬화 의도형 entry. chord 매치 시 dispatcher 가
 * `id` 가 비어있으면 focusId 자동 주입.
 */
export type UiEventTemplate = Partial<UiEvent> & { type: UiEvent['type'] }

/** KeyMap entry 의 핸들러 칸 — template (정적 의도) 또는 KeyHandler (data-driven 산수). */
export type KeyMapEntryRhs = UiEventTemplate | UiEventTemplate[] | KeyHandler

/**
 * KeyMap — `[chord(s), handler|template]` tuple 의 선언적 배열.
 *
 * - chord 는 단일 shortcut string 또는 string[] (합집합 — 어느 하나만 매치되면 hit)
 * - 오른쪽 칸은 template (plain object/array) 또는 data-driven KeyHandler
 * - tuple 순서 = 우선순위 (앞쪽 항목 먼저 매칭, 첫 hit 의 결과 반환)
 * - chord 는 항상 `INTENT_CHORDS.X` 통과 — raw 리터럴 지양
 */
export type KeyMapChord = Chord | readonly Chord[]
export type KeyMap = ReadonlyArray<readonly [KeyMapChord, KeyMapEntryRhs]>

const isHandlerFn = (rhs: KeyMapEntryRhs): rhs is KeyHandler => typeof rhs === 'function'
const applyTemplate = (t: UiEventTemplate, focusId: string): UiEvent => {
  const hasId = typeof (t as { id?: unknown }).id === 'string' && (t as { id: string }).id.length > 0
  return (hasId ? t : { ...t, id: focusId }) as UiEvent
}

const toChords = (chord: KeyMapChord): readonly Chord[] =>
  Array.isArray(chord) ? chord : [chord as Chord]

/**
 * fromKeyMap — `KeyMap` 선언을 `Axis` 로 만든다. axis 가 imperative if-else 로 키
 * 분기하는 대신 chord ↔ template 1:1 선언으로만 표현되도록 강제하는 정본 factory.
 *
 * @example
 *   const activateAxis = fromKeyMap([
 *     [INTENT_CHORDS.activate.trigger, { type: 'activate' }],
 *   ])
 */
export const fromKeyMap = (entries: KeyMap): Axis => {
  const fn = (d: NormalizedData, id: string, t: Trigger): UiEvent[] | null => {
    const p = parseTrigger(t)
    if (p.kind !== 'key') return null
    for (const [chord, rhs] of entries) {
      const strings = toChords(chord)
      if (!strings.some((s) => triggerMatches(t, s))) continue
      if (isHandlerFn(rhs)) return rhs(d, id)
      const tmpls = Array.isArray(rhs) ? rhs : [rhs as UiEventTemplate]
      return tmpls.map((tmpl) => applyTemplate(tmpl, id))
    }
    return null
  }
  const chords: string[] = []
  const seen = new Set<string>()
  for (const [chord] of entries) {
    for (const s of toChords(chord)) {
      if (!seen.has(s)) { seen.add(s); chords.push(s) }
    }
  }
  return tagAxis(fn, chords)
}

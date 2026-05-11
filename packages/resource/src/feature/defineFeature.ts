/** defineFeature — 한 화면 = 한 spec. 4 슬롯, 1 컨셉("state 의 pure 함수들"). */

import type { QueryResult, QuerySpec } from './query'

/** 모든 command 의 base — discriminated union 의 `type` 필드. */
export interface CommandBase { type: string }

/** command type → 그 type 의 reducer 함수. exhaustive map 강제. */
export type ReducerMap<S, Cmd extends CommandBase> = {
  readonly [K in Cmd['type']]: (s: S, p: Extract<Cmd, { type: K }>) => S
}

/** query spec map → 같은 키에 QueryResult 가 채워진 결과 map. */
export type QueryResults<Q> = { readonly [K in keyof Q]: QueryResult<Q[K] extends QuerySpec<infer T> ? T : never> }

/**
 * Feature spec — 한 화면의 SSOT. `state`(초기값) · `on`(reducer map) · `query`(외부 데이터 선언) · `view`(뷰모델).
 * 직렬화 가능한 plain object — class/ref/closure 잔재 금지.
 */
export interface FeatureSpec<
  S,
  Cmd extends CommandBase,
  Q extends Record<string, QuerySpec<unknown>> = Record<string, never>,
  V = unknown,
> {
  /** 사용자 의도 = JSON. 직렬화 가능해야 함. */
  state: S
  /** (s, cmd) → s'. pure. 외부 호출 금지. */
  on: ReducerMap<S, Cmd>
  /** state 의 함수로 외부 데이터 선언. runtime 이 fetch + 캐시. */
  query?: (s: S) => Q
  /** state + query → ViewModel. slot 단위 데이터. */
  view: (s: S, q: QueryResults<Q>) => V
}

/**
 * Feature spec identity — 타입 추론 + 런타임 spec 통과 helper.
 * 라이프사이클: useFeature 가 spec 을 받아 useReducer 로 state 생성 → state 변화마다
 * query → view 재계산. 직렬화 가능성: state 는 plain JSON 가능해야 한다 (HMR/replay 지원).
 *
 * @example
 * const counter = defineFeature({
 *   state: { count: 0 },
 *   on: { inc: (s) => ({ count: s.count + 1 }) },
 *   view: (s) => ({ label: `count: ${s.count}` }),
 * })
 */
export function defineFeature<
  S,
  Cmd extends CommandBase,
  Q extends Record<string, QuerySpec<unknown>> = Record<string, never>,
  V = unknown,
>(spec: FeatureSpec<S, Cmd, Q, V>): FeatureSpec<S, Cmd, Q, V> {
  return spec
}

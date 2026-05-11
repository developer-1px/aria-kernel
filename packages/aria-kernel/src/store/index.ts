/**
 * @p/aria-kernel/store — 옵션 데이터 흐름 어댑터.
 *
 * - `useResource` / `defineResource` / `writeResource` — keyed external store with cache
 * - `useFeature` / `defineFeature` — single-spec mini reducer + query selector
 *
 * 정체성: ARIA 행동 인프라(`@p/aria-kernel`) 와 별개. 복잡한 데이터 흐름이 필요한
 * 앱(URL/cache/HMR/server 가 얽힘)을 위한 *옵션*. 단순 state 는 React `useState` /
 * `useReducer(reduceWithDefaults, items, fromList)` 직접 사용 (#148).
 */

export {
  type Resource, type ResourceEvent, type ResourceDispatch, type ResourceEventRouter,
  defineResource, useResource, writeResource,
} from './data'

export {
  defineFeature, useFeature,
  type FeatureSpec, type CommandBase, type ReducerMap, type QueryResults,
  type QuerySpec, type QueryResult,
  readQuery, invalidateQuery, subscribeQueries,
} from './feature'

export { routeUiEventToCrud, type CrudPort } from './routeUiEventToCrud'

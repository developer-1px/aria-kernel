/** 미니 query 캐시. TanStack 호환 시그니처(key, fn, enabled).
 *  의존성 0 — 추후 TanStack Query 로 교체할 때 host 만 갈아끼우면 된다. */

/** 외부 데이터 fetch 선언 — TanStack Query 호환 시그니처. */
export interface QuerySpec<T> {
  key: ReadonlyArray<unknown>
  fn: () => T | Promise<T>
  enabled?: boolean
}

/** Query 의 현재 상태 — data + isLoading + error. */
export interface QueryResult<T = unknown> {
  data: T | undefined
  isLoading: boolean
  error: unknown
}

/** 내부 query cache entry. */
interface Entry {
  key: string
  data: unknown
  isLoading: boolean
  error: unknown
  /** 마지막 fn 참조. 같은 key 인데 fn 이 바뀌면 refetch. */
  fn: () => unknown
}

const store = new Map<string, Entry>()
const subs = new Set<() => void>()
let version = 0
/** 모든 query 의 단일 version 카운터 — useSyncExternalStore snapshot. */
export const queryVersion = (): number => version

/** key array → 캐시 키 문자열. */
const keyOf = (k: ReadonlyArray<unknown>): string => JSON.stringify(k)
/** version 증가 + 모든 구독자에게 알림. */
const notify = (): void => { version++; for (const s of subs) s() }

/** query 변경 구독 — useFeature 가 view 재계산 트리거에 사용. */
export function subscribeQueries(fn: () => void): () => void {
  subs.add(fn)
  return () => { subs.delete(fn) }
}

/** spec 을 캐시에서 읽거나 첫 read 시 fn 실행. enabled=false 면 idle 상태 반환. */
export function readQuery<T>(spec: QuerySpec<T>): QueryResult<T> {
  if (spec.enabled === false) return { data: undefined, isLoading: false, error: null }
  const key = keyOf(spec.key)
  let entry = store.get(key)
  if (!entry) {
    entry = { key, data: undefined, isLoading: true, error: null, fn: spec.fn }
    store.set(key, entry)
    void Promise.resolve()
      .then(spec.fn)
      .then((data) => { const e = store.get(key); if (e) { e.data = data; e.isLoading = false; e.error = null; notify() } })
      .catch((error) => { const e = store.get(key); if (e) { e.error = error; e.isLoading = false; notify() } })
  }
  return { data: entry.data as T | undefined, isLoading: entry.isLoading, error: entry.error }
}

/** 명시적 invalidate — mutation 이후 호출. */
export function invalidateQuery(key: ReadonlyArray<unknown>): void {
  store.delete(keyOf(key))
  notify()
}

/** state 로부터 query map 도출 후 일괄 readQuery — useFeature 내부 helper. */
export function resolveQueries<S>(spec?: (s: S) => Record<string, QuerySpec<unknown>>, state?: S):
  Record<string, QueryResult> {
  if (!spec || state === undefined) return {}
  const declared = spec(state)
  const out: Record<string, QueryResult> = {}
  for (const [name, q] of Object.entries(declared)) out[name] = readQuery(q)
  return out
}

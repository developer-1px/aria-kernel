import { useEffect, useSyncExternalStore } from 'react'
import type { UiEvent as UiEvent } from '@p/aria-kernel'

/**
 * Resource — ui/ `(data, onEvent)`의 데이터 레이어 평행.
 * 모든 데이터 read/write는 `useResource(resource, ...args) → [value, dispatch]` 단일 인터페이스로 흐른다.
 * 종류별 훅(useFsTree/useFsText/useView…)은 만들지 않는다 — 인터페이스 분기는 ds 원칙 위반.
 *
 * onEvent 옵션: ui/ event를 직접 수용한다. (e, ctx) => 다음 값 (또는 undefined로 무시).
 * 도메인 라우트는 더 이상 UiEvent → resource action 매퍼를 매번 작성하지 않는다.
 */

/** Resource dispatch 가 받는 4 종 이벤트 — set(전체)/patch(부분)/refetch(다시 load)/invalidate(캐시 비움). */
export type ResourceEvent<T> =
  | { type: 'set'; value: T }
  | { type: 'patch'; partial: Partial<T> }
  | { type: 'refetch' }
  | { type: 'invalidate' }

/**
 * `(event) → void` — resource 쓰기 통로.
 * ResourceEvent (set/patch/refetch/invalidate) 또는 UiEvent (활성화/편집/네비 등) 모두 수용한다.
 * UiEvent 가 들어오면 `resource.onEvent` 라우터로 흘려 다음 값을 결정한다.
 */
export type ResourceDispatch<T> = (e: ResourceEvent<T> | UiEvent) => void

/** ui/ UiEvent 를 받아 resource 의 다음 값으로 매핑하는 라우터 (undefined 면 무시 = no-op). */
export type ResourceEventRouter<T> = (
  e: UiEvent,
  ctx: { value: T | undefined },
) => T | undefined

const RESOURCE_EVENT_TYPES = new Set<string>(['set', 'patch', 'refetch', 'invalidate'])

/** Resource 정의 — keyed external store spec. key/load/initial/subscribe/serialize/onEvent 슬롯. */
export interface Resource<T, Args extends unknown[] = []> {
  key: (...args: Args) => string
  load?: (...args: Args) => T | Promise<T>
  initial?: T | ((...args: Args) => T)
  /**
   * 외부 push 채널 attach. 외부 store 가 바뀌면 `push(newValue)` 를 부른다 — 캐시 갱신 + 구독자 자동 통지.
   * 값을 모르고 신호만 보낼 땐 `push(load())` 또는 `push(getCurrent())` 로 명시.
   */
  subscribe?: (key: string, push: (value: T) => void, ...args: Args) => () => void
  serialize?: (key: string, value: T, ...args: Args) => void
  /** ui/ event → 다음 값 매퍼. flow에서 intent 라우터로 사용. */
  onEvent?: ResourceEventRouter<T>
}

/** 내부 캐시 entry — value + load 상태 + 외부 push 채널 unsub + 구독 refCount. */
type Entry = { value: unknown; loaded: boolean; inflight?: Promise<unknown>; externalUnsub?: () => void; refCount: number }

const cache = new Map<string, Entry>()
const listeners = new Map<string, Set<() => void>>()

/** key 로 entry 가져오거나 생성. */
function getEntry(key: string): Entry {
  let e = cache.get(key)
  if (!e) {
    e = { value: undefined, loaded: false, refCount: 0 }
    cache.set(key, e)
  }
  return e
}

/** key 의 모든 구독자에게 알림. */
function notify(key: string) {
  listeners.get(key)?.forEach((l) => l())
}

/** key 에 value 쓰고 loaded=true + notify. */
function setValue<T>(key: string, value: T) {
  const e = getEntry(key)
  e.value = value
  e.loaded = true
  notify(key)
}

/** key 단위 listener 등록 + 빈 set 정리하는 unsub 반환. */
function subscribeKey(key: string, l: () => void): () => void {
  let set = listeners.get(key)
  if (!set) { set = new Set(); listeners.set(key, set) }
  set.add(l)
  return () => {
    set!.delete(l)
    if (set!.size === 0) listeners.delete(key)
  }
}

/** initial 또는 load 로 entry 를 1회 채운다. 이미 loaded 거나 inflight 면 no-op. */
function ensureLoaded<T, Args extends unknown[]>(
  key: string,
  resource: Resource<T, Args>,
  args: Args,
): void {
  const entry = getEntry(key)
  if (entry.loaded || entry.inflight) return
  if (resource.initial !== undefined) {
    const v = typeof resource.initial === 'function'
      ? (resource.initial as (...a: Args) => T)(...args)
      : resource.initial
    entry.value = v
    entry.loaded = true
    return
  }
  if (!resource.load) return
  const r = resource.load(...args)
  if (r instanceof Promise) {
    entry.inflight = r
    r.then((v) => {
      entry.value = v
      entry.loaded = true
      entry.inflight = undefined
      notify(key)
    }).catch(() => {
      entry.inflight = undefined
    })
  } else {
    entry.value = r
    entry.loaded = true
  }
}

/**
 * Resource spec identity — 타입 추론 + 런타임 spec 통과 helper.
 * 라이프사이클: 첫 useResource 호출 시 load/initial 로 hydrate → subscribe 로 외부 push 채널 attach
 * (refCount=1 시) → dispatch 로 set/patch/refetch/invalidate → 마지막 구독자 unmount 시 unsub.
 * 직렬화 가능성: value 는 plain object 권장 — serialize 가 호출되어 외부 저장소(URL/localStorage)와 왕복.
 */
export function defineResource<T, Args extends unknown[] = []>(
  spec: Resource<T, Args>,
): Resource<T, Args> {
  return spec
}

/**
 * Resource 를 React 에 연결 — 첫 read 시 load 트리거, 외부 채널 자동 attach/detach,
 * useSyncExternalStore 로 tearing-free 구독. 반환은 `[value, dispatch]` 단일 인터페이스.
 *
 * @example
 * const userResource = defineResource({
 *   key: (id: string) => `user:${id}`,
 *   load: (id) => fetch(`/api/user/${id}`).then(r => r.json()),
 * })
 * const [user, dispatch] = useResource(userResource, userId)
 * dispatch({ type: 'patch', partial: { name: 'New' } })
 */
export function useResource<T, Args extends unknown[] = []>(
  resource: Resource<T, Args>,
  ...args: Args
): [T | undefined, ResourceDispatch<T>] {
  const key = resource.key(...args)

  // 외부 push 채널(HMR 등) 1회 attach — 같은 key의 첫 구독자가 켜고, 마지막 구독자가 끈다.
  useEffect(() => {
    const entry = getEntry(key)
    entry.refCount += 1
    if (entry.refCount === 1 && resource.subscribe && !entry.externalUnsub) {
      entry.externalUnsub = resource.subscribe(key, (v) => setValue(key, v as T), ...args)
    }
    return () => {
      entry.refCount -= 1
      if (entry.refCount === 0 && entry.externalUnsub) {
        entry.externalUnsub()
        entry.externalUnsub = undefined
      }
    }
    // key/args 변경 시 재계산 — args는 key에 반영되어 있다고 가정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // 첫 read 시 load 트리거 (렌더 중 호출 OK — store side-effect는 idempotent)
  ensureLoaded(key, resource, args)

  const value = useSyncExternalStore(
    (l) => subscribeKey(key, l),
    () => getEntry(key).value as T | undefined,
    () => getEntry(key).value as T | undefined,
  )

  const dispatch: ResourceDispatch<T> = (e) => {
    const entry = getEntry(key)
    // UiEvent 분기 — onEvent 라우터로 위임.
    if (!RESOURCE_EVENT_TYPES.has(e.type)) {
      if (!resource.onEvent) return
      const next = resource.onEvent(e as UiEvent, { value: entry.value as T | undefined })
      if (next !== undefined) {
        setValue(key, next)
        resource.serialize?.(key, next, ...args)
      }
      return
    }
    // ResourceEvent 분기 — set/patch/refetch/invalidate.
    if (e.type === 'set') {
      setValue(key, e.value)
      resource.serialize?.(key, e.value, ...args)
    } else if (e.type === 'patch') {
      const next = { ...(entry.value as object), ...e.partial } as T
      setValue(key, next)
      resource.serialize?.(key, next, ...args)
    } else if (e.type === 'refetch') {
      entry.loaded = false
      entry.inflight = undefined
      ensureLoaded(key, resource, args)
    } else if (e.type === 'invalidate') {
      entry.value = undefined
      entry.loaded = false
      entry.inflight = undefined
      notify(key)
    }
  }

  return [value, dispatch]
}

/** 컴포넌트 외부(이벤트 핸들러·HMR 콜백 등)에서 자원에 직접 쓰기. */
export function writeResource<T, Args extends unknown[] = []>(
  resource: Resource<T, Args>,
  value: T,
  ...args: Args
): void {
  const key = resource.key(...args)
  setValue(key, value)
  resource.serialize?.(key, value, ...args)
}

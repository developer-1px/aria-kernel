/** useFeature — defineFeature spec 를 React 에 연결.
 *  반환은 [view, dispatch] 만 — state 직접 노출 X (selector 가 잘못된 SSOT 보는 버그 차단). */

import { useCallback, useMemo, useReducer, useSyncExternalStore } from 'react'
import type { CommandBase, FeatureSpec } from './defineFeature'
import type { QuerySpec } from './query'
import { queryVersion, resolveQueries, subscribeQueries } from './query'

/** subscribeQueries 를 useSyncExternalStore subscribe 시그니처로 어댑트. */
const subscribeToQueries = (cb: () => void) => subscribeQueries(cb)

/**
 * Feature spec → React 연결. 라이프사이클: useReducer 로 spec.state 시드 → cmd dispatch 시
 * spec.on[type] 적용 → state 변화마다 spec.query 재해석 → resolveQueries → spec.view 재계산.
 * 직렬화 가능성: state/cmd 모두 plain JSON — replay/HMR 가능.
 *
 * @example
 * const [view, send] = useFeature(counter)
 * <button onClick={() => send({ type: 'inc' })}>{view.label}</button>
 */
export function useFeature<S, Cmd extends CommandBase, Q extends Record<string, QuerySpec<unknown>>, V>(
  spec: FeatureSpec<S, Cmd, Q, V>,
): [V, (cmd: Cmd) => void] {
  const reducer = useCallback(
    (s: S, cmd: Cmd): S => {
      const handler = (spec.on as unknown as Record<string, (s: S, p: Cmd) => S>)[cmd.type]
      return handler ? handler(s, cmd) : s
    },
    [spec],
  )

  const [state, dispatch] = useReducer(reducer, spec.state)

  // query 갱신을 구독해서 view 재계산 트리거 (version 이 바뀌면 리렌더)
  const qv = useSyncExternalStore(subscribeToQueries, queryVersion, queryVersion)

  const queries = useMemo(() => resolveQueries(spec.query, state), [spec, state, qv])
  const view = useMemo(() => spec.view(state, queries as never), [spec, state, queries])

  return [view, dispatch as (cmd: Cmd) => void]
}

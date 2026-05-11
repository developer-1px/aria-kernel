import { useMemo, useReducer, useRef } from 'react'
import { reduce } from '../state/reduce'
import type { Meta, NormalizedData, UiEvent } from '../types'

const EMPTY: NormalizedData = { entities: {}, relationships: {} }
const SEED_KEYS = ['focus', 'expanded', 'typeahead'] as const satisfies readonly (keyof Meta)[]
type MetaKey = (typeof SEED_KEYS)[number]

/**
 * Meta 시드(focus/expanded/typeahead)가 base에 있으면 reducer 초기 state에 hydrate한다.
 * 그래야 첫 dispatch가 base 시드를 무시하고 빈 값 위에 덮어쓰는 버그가 없다.
 *
 * base 가 외부에서 갱신되면(URL→base bridge 등) 머지에서 base가 이긴다.
 * user dispatch 이후엔 local meta가 이긴다 — touched ref로 키 단위 추적.
 */
const hydrate = (base: NormalizedData): NormalizedData => {
  const meta: Meta = {}
  let any = false
  for (const k of SEED_KEYS) {
    if (base.meta?.[k] !== undefined) {
      ;(meta as Record<string, unknown>)[k] = base.meta[k]
      any = true
    }
  }
  return any ? { ...EMPTY, meta } : EMPTY
}

/**
 * `useControlState` — 외부 base 데이터 위에 로컬 control meta(focus/expanded/typeahead)를 얹는 SSOT hook.
 * base 가 갱신되면 사용자가 아직 건드리지 않은 키만 base 시드로 갱신, 사용자가 dispatch 한 키는 local 우선.
 * 반환은 `[merged data, dispatch]` — ui/ 의 (data, onEvent) 인터페이스에 그대로 꽂힌다.
 *
 * @example tree/listbox — persistent collection
 *   const [data, dispatch] = useControlState(fromTree(roots, { focusId: ROOT }))
 *   <ListView data={data} onEvent={dispatch} />
 *
 * @example chat composer — ephemeral derived list (per-keystroke 필터)
 *   const base = useMemo(() => fromList(filtered), [filtered])
 *   const [data, dispatch] = useControlState(base)
 *   const cb = useComboboxPattern(data, (e) => {
 *     dispatch(e)                              // keyboard nav meta 보존
 *     if (e.type === 'activate') commit(e.id)  // intent 처리
 *   })
 *   // base 가 filtered 갱신될 때마다 새 entities 로 swap, focus/expanded 는 dispatch 가 덮어쓴 키 우선
 */
export function useControlState(base: NormalizedData): [NormalizedData, (e: UiEvent) => void] {
  const [local, rawDispatch] = useReducer(reduce, base, hydrate)
  const touched = useRef<Set<MetaKey>>(new Set())
  const dispatch = (e: UiEvent) => {
    if (e.type === 'navigate') touched.current.add('focus')
    else if (e.type === 'expand' || e.type === 'open') touched.current.add('expanded')
    else if (e.type === 'typeahead') touched.current.add('typeahead')
    rawDispatch(e)
  }
  const data = useMemo<NormalizedData>(() => {
    const meta: Meta = { ...base.meta, ...local.meta }
    for (const k of SEED_KEYS) {
      // eslint-disable-next-line react-hooks/refs
      if (!touched.current.has(k) && base.meta?.[k] !== undefined) {
        ;(meta as Record<string, unknown>)[k] = base.meta[k]
      }
    }
    return {
      entities: { ...base.entities, ...local.entities },
      relationships: { ...base.relationships, ...local.relationships },
      meta,
    }
  }, [base, local])
  return [data, dispatch]
}

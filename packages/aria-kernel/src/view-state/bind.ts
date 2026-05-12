import type { KeyboardEvent, MouseEvent } from 'react'
import type { Axis } from '../input/keyboard/axes'
import { ROOT, type NormalizedData, type UiEvent, type ValueEvent } from '../intent/events'
import { eventToChord, clickTrigger } from '../trigger'
import { resolveIntent } from './resolveIntent'

/** axis 가 emit 한 UiEvent 를 React 의 onKeyDown/onClick 에 잇는 핸들러 페어. */
export interface AxisBindings {
  onKey: (ke: KeyboardEvent, id: string) => boolean
  onClick: (me: MouseEvent, id: string) => boolean
}

/**
 * axis(논리 네비게이션 함수) 를 React DOM 이벤트에 연결하는 어댑터.
 * keyboard/mouse → axis trigger → UiEvent[] → onEvent 로 흘린다. axis 가 이벤트를 소비했으면
 * `preventDefault` + `true` 반환 (브라우저 기본 동작 차단).
 *
 * @example
 * const { onKey, onClick } = bindAxis(rovingAxis, data, dispatch)
 * <li onKeyDown={(e) => onKey(e, item.id)} onClick={(e) => onClick(e, item.id)} />
 */
export const bindAxis = (
  axis: Axis,
  d: NormalizedData,
  onEvent: (e: UiEvent) => void,
): AxisBindings => ({
  onKey: (ke, id) => {
    const events = axis(d, id, eventToChord(ke as unknown as globalThis.KeyboardEvent))
    if (!events) return false
    events.flatMap((e) => resolveIntent(d, e as never)).forEach(onEvent)
    ke.preventDefault()
    return true
  },
  onClick: (me, id) => {
    const events = axis(d, id, clickTrigger({
      shift: me.shiftKey, ctrl: me.ctrlKey, alt: me.altKey, meta: me.metaKey,
    }))
    if (!events) return false
    events.flatMap((e) => resolveIntent(d, e as never)).forEach(onEvent)
    return true
  },
})

/**
 * 단일값 컨트롤(slider/switch/spinbutton/splitter)을 axis 인프라에 잇는 헬퍼.
 *
 * axis 는 NormalizedData 시그니처라 단일 entity 표현을 위해 ROOT 1개짜리 합성 데이터를
 * 만들어 통과시킨다. axis 가 emit 한 UiEvent 를 `pick` 으로 narrow 하여 `ValueEvent<T>`
 * 로 dispatch.
 *
 * @param entity ROOT 위치에 들어갈 entity ({value, min, max, step} 또는 {value, ...})
 * @param pick UiEvent → T | undefined. undefined 면 dispatch 안 함.
 */
export function bindValueAxis<T>(
  axis: Axis,
  entity: Record<string, unknown>,
  dispatch: ((e: ValueEvent<T>) => void) | undefined,
  pick: (e: UiEvent) => T | undefined,
): { onKey: (ke: KeyboardEvent) => boolean; onClick: (me: MouseEvent) => boolean } {
  const synth: NormalizedData = { entities: { [ROOT]: entity }, relationships: {} }
  const intent = (e: UiEvent) => {
    const v = pick(e)
    if (v !== undefined) dispatch?.({ type: 'value', value: v })
  }
  const inner = bindAxis(axis, synth, intent)
  return {
    onKey: (ke) => inner.onKey(ke, ROOT),
    onClick: (me) => inner.onClick(me, ROOT),
  }
}

/** 숫자 값 picker — slider/splitter/spinbutton 공통. */
export const pickNumericValue = (e: UiEvent): number | undefined =>
  e.type === 'value' && typeof e.value === 'number' ? e.value : undefined

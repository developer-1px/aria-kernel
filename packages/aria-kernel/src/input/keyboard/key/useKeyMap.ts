import { useEffect } from 'react'

import type { KeyMap } from '../axes/axis'
import type { UiEvent } from '../../../intent/events'

import { bindGlobalKeyMap } from './bindGlobalKeyMap'

/**
 * useKeyMap — React hook 으로 KeyMap 을 window keydown 에 바인딩.
 *
 * `useShortcut` 의 후계자. `useShortcut('mod+k', fn)` 의 단일 chord 형태를 같은
 * KeyMap 어휘로 흡수해서 axis 와 동일한 선언 형태를 사용한다.
 *
 * editable (input/textarea/contenteditable) 안에서 modifier 없는 단발 키는
 * 타이핑을 탈취하지 않는다.
 *
 * @example
 *   useKeyMap(
 *     [[k('k', { meta: true }), { type: 'palette.open' }]],
 *     (e) => dispatch(e),
 *   )
 */
export const useKeyMap = (km: KeyMap, onEvent: (e: UiEvent) => void): void => {
  useEffect(() => bindGlobalKeyMap(km, onEvent), [km, onEvent])
}

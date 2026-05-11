import type { Ref, MutableRefObject } from 'react'

/**
 * mergeRefs — 패턴이 rootProps.ref 를 부착하면서 소비자도 같은 DOM 노드에 ref 가
 * 필요할 때 (outside-click · ResizeObserver · 포털 focus-trap 등) 두 ref 를 합친다.
 *
 * Radix · React Aria · React-ARIA-Spectrum de facto. callback 과 RefObject 둘 다 지원.
 *
 * @example
 *   const userRef = useRef<HTMLDivElement | null>(null)
 *   const { rootProps } = useMenuPattern(data, onEvent)
 *   <div {...rootProps} ref={mergeRefs(userRef, rootProps.ref)} />
 */
export const mergeRefs = <T>(...refs: Array<Ref<T> | undefined>): ((node: T | null) => void) =>
  (node) => {
    for (const r of refs) {
      if (!r) continue
      if (typeof r === 'function') r(node)
      else (r as MutableRefObject<T | null>).current = node
    }
  }

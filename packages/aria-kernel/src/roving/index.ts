/**
 * roving — APG roving tabindex 의 두 축 + activedescendant 모드.
 *
 * - {@link useRovingTabIndex}: 데이터(관계 그래프) 기반 — APG canonical
 * - {@link useSpatialNavigation}: 시각 좌표 기반 — W3C CSS spatnav
 * - {@link useActiveDescendant}: combobox 1곳 예외 (포커스 input, 활성은 id 참조)
 */
export { useRovingTabIndex } from './useRovingTabIndex'
export { useSpatialNavigation, spatialNavigationKeys, type UseSpatialNavigationOptions } from './useSpatialNavigation'
export { useActiveDescendant } from './useActiveDescendant'

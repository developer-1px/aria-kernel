import { ROOT, getChildren, getExpanded, isDisabled, type NormalizedData } from '../intent/events'
import { visibleTreeItems } from '@interactive-os/keyboard-navigation'

/** enabled 만 남긴 visible tree order — 트리 nav 산수의 standard 입력. */
export const visibleEnabled = (d: NormalizedData): string[] => {
  const expanded = getExpanded(d)
  return visibleTreeItems({
    roots: getChildren(d, ROOT),
    children: (id) => getChildren(d, id),
    isExpanded: (id) => expanded.has(id),
  }).filter((id) => !isDisabled(d, id))
}

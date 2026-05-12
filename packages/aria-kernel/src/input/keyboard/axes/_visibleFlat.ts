import { ROOT, getChildren, getExpanded, isDisabled, type NormalizedData } from '../../../intent/events'

/**
 * visibleFlat — DFS visible 순회 (collapse 반영). 자식이 펼쳐진 (`meta.expanded`)
 * 노드만 재귀 진입. tree axis 들의 공유 유틸.
 */
export const visibleFlat = (
  d: NormalizedData,
  parent: string,
  exp: Set<string>,
  out: string[] = [],
): string[] => {
  for (const id of getChildren(d, parent)) {
    out.push(id)
    if (exp.has(id)) visibleFlat(d, id, exp, out)
  }
  return out
}

/** enabled 만 남긴 visibleFlat — 트리 nav 산수의 standard 입력. */
export const visibleEnabled = (d: NormalizedData): string[] =>
  visibleFlat(d, ROOT, getExpanded(d)).filter((id) => !isDisabled(d, id))

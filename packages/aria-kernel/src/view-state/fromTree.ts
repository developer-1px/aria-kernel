import type { CollectionData, NormalizedData } from '../intent/events'

/**
 * fromTree — convention-based tree builder. Input is `{id, children?, ...rest}` —
 * id and children are reserved keys; rest becomes the entity's user data.
 * No callbacks. No options for shape transformation.
 */
export function fromTree<T extends { id: string; children?: T[] }>(
  roots: T[],
  opts?: { focusId?: string | null; expanded?: string[] },
): CollectionData {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}

  const walk = (node: T) => {
    const { id, children, ...rest } = node as T & Record<string, unknown>
    entities[id] = rest as Record<string, unknown>
    if (children?.length) {
      relationships[id] = children.map((c) => c.id)
      for (const c of children) walk(c)
    }
  }
  for (const r of roots) walk(r)

  const meta: CollectionData['meta'] = { root: roots.map((r) => r.id) }
  if (opts?.focusId !== undefined) meta.focus = opts.focusId
  if (opts?.expanded) meta.expanded = opts.expanded

  return { entities, relationships, meta }
}

/**
 * fromList — flat array → NormalizedData. ad-hoc 컬렉션 (검색 suggestion, chat
 * @-mention 후보, /-command palette 등) 의 표준 빌더.
 *
 * Convention-based: `id` 와 나머지 키 모두 객체 그대로 spread. callback 없음 — 호출자가
 * map 으로 shape 을 맞춰서 넘긴다.
 *
 * @example
 *   // chat composer: @-mention 후보 (ephemeral, 키스트로크마다 재계산)
 *   const data = useMemo(
 *     () => fromList(filtered.map(u => ({ id: u.id, label: u.name, user: u }))),
 *     [filtered],
 *   )
 *   useComboboxPattern(data, onEvent)
 *
 * id 누락 시 `__0`, `__1`, ... synthetic id 자동 할당.
 */
export function fromList(items: Array<Record<string, unknown>>): CollectionData {
  const entities: NormalizedData['entities'] = {}
  const root: string[] = []
  items.forEach((item, i) => {
    const { id: rawId, ...rest } = item as Record<string, unknown>
    const id = (rawId as string | undefined) ?? `__${i}`
    entities[id] = rest
    root.push(id)
  })
  return { entities, relationships: {}, meta: { root } }
}

/**
 * path 문자열을 누적 prefix 배열로 — `/a/b/c` → `['/a', '/a/b', '/a/b/c']`.
 * tree 의 조상 id 가 path prefix 와 1:1 일 때 expanded 시드 계산에 사용.
 */
export const pathAncestors = (path: string, sep: string = '/'): string[] => {
  const segs = path.split(sep).filter(Boolean)
  return segs.reduce<string[]>(
    (acc, seg) => [...acc, `${acc.at(-1) ?? ''}${sep}${seg}`],
    [],
  )
}

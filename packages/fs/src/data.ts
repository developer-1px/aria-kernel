// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import { tree as initialTree } from 'virtual:fs-tree'
import type { FsNode } from './schema'
import { FsNodeSchema } from './schema'

/** virtual:fs-tree 는 외부 데이터 경계 — zod parse 로 진입 검증. */
const parseTree = (raw: unknown): FsNode => FsNodeSchema.parse(raw)
let currentTree: FsNode = (import.meta.hot?.data.tree as FsNode | undefined) ?? parseTree(initialTree)
const listeners: Set<() => void> = (import.meta.hot?.data.listeners as Set<() => void> | undefined) ?? new Set()
if (import.meta.hot) {
  import.meta.hot.data.listeners = listeners
  import.meta.hot.accept()
}

export const tree = initialTree
export function getTree(): FsNode { return currentTree }
export function subscribeTree(l: () => void): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

if (import.meta.hot) {
  import.meta.hot.on('fs-tree:update', (raw: unknown) => {
    const next = parseTree(raw)
    currentTree = next
    if (import.meta.hot) import.meta.hot.data.tree = next
    listeners.forEach((l) => l())
  })
}

/** monorepo 트리는 fs-tree plugin 이 dev=middleware / build=dist/_fs 카피로 정적 노출.
 *  loadText/getImageUrl 은 BASE_URL 을 prepend 한 fetch 로 단일화 — vite root 의존 0. */
const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '')
const fsUrl = (path: string): string => `${BASE}/_fs${path}`

export function getImageUrl(path: string): string | undefined {
  return fsUrl(path)
}

export async function loadText(path: string): Promise<string | null> {
  try {
    const r = await fetch(fsUrl(path))
    return r.ok ? await r.text() : null
  } catch { return null }
}

/** path를 / 세그먼트로 분해해 tree 경로를 따라가며 각 단계의 노드를 반환. */
export function walk(path: string): FsNode[] {
  const parts = path.split('/').filter(Boolean)
  const root = currentTree
  const chain: FsNode[] = [root]
  let cur: FsNode | undefined = root
  for (const p of parts) {
    cur = cur?.children?.find((c) => c.name === p)
    if (!cur) break
    chain.push(cur)
  }
  return chain
}

export function formatSize(n?: number): string {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function formatDate(ms?: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('ko-KR')
}

export function collectByAge(node: FsNode, predicate: (mtime: number) => boolean): FsNode[] {
  const out: FsNode[] = []
  const visit = (n: FsNode) => {
    if (n.type === 'file' && n.mtime != null && predicate(n.mtime)) out.push(n)
    n.children?.forEach(visit)
  }
  visit(node)
  return out.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0))
}
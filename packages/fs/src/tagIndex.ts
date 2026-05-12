/**
 * tagIndex — `docs` 트리의 모든 md frontmatter를 빌드 타임에 파싱하여 tag → file 인덱스를 만든다.
 *
 * Smart 폴더(today/yesterday/...)는 캘린더 폴더 alias였다면, tag 폴더는
 * frontmatter.tags 기반 가상 폴더다. 한 파일이 N tag에 동시에 속할 수 있다.
 *
 * @invariant pure — vite glob eager raw로 모듈 로드 시 1회 인덱싱
 * @invariant docs/ 만 대상 (src/는 frontmatter 관행 없음)
 * @invariant tag → DocEntry[] 정렬 키: updated desc → created desc → path asc
 */
import { extractFrontmatter, normalizeFrontmatter, type DocFrontmatter } from './frontmatter'

export type DocEntry = {
  /** source document path */
  path: string
  /** 표시용 파일명 — fm.title > body H1 > basename */
  label: string
  frontmatter: DocFrontmatter
}

const docsRaw = import.meta.glob('/docs/**/*.{md,mdx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const entries: DocEntry[] = []
const tagToPaths = new Map<string, string[]>()

for (const [path, source] of Object.entries(docsRaw)) {
  const ex = extractFrontmatter(source)
  const fm = normalizeFrontmatter(ex.rawFrontmatter)
  const label = fm.title ?? ex.title ?? basename(path)
  const entry: DocEntry = { path, label, frontmatter: fm }
  entries.push(entry)
  for (const tag of fm.tags ?? []) {
    const bucket = tagToPaths.get(tag)
    if (bucket) bucket.push(path)
    else tagToPaths.set(tag, [path])
  }
}

const sortKey = (p: string): string => {
  const e = entryByPath.get(p)
  if (!e) return p
  return (e.frontmatter.updated ?? '') + '|' + (e.frontmatter.created ?? '') + '|' + p
}

const entryByPath = new Map(entries.map((e) => [e.path, e]))

for (const [tag, paths] of tagToPaths) {
  paths.sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
  tagToPaths.set(tag, paths)
}

function basename(p: string): string {
  const segs = p.split('/')
  return segs[segs.length - 1] ?? p
}

/** 모든 tag — 빈도 desc 정렬 */
export function allTags(): { tag: string; count: number }[] {
  return Array.from(tagToPaths.entries())
    .map(([tag, paths]) => ({ tag, count: paths.length }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function entriesByTag(tag: string): DocEntry[] {
  const paths = tagToPaths.get(tag) ?? []
  return paths.map((p) => entryByPath.get(p)!).filter(Boolean)
}

export function entryOf(path: string): DocEntry | undefined {
  return entryByPath.get(path)
}

export const TAG_PATH_PREFIX = '/_tag/' as const

export function tagPath(tag: string): string {
  return TAG_PATH_PREFIX + encodeURIComponent(tag)
}

export function isTagPath(path: string): boolean {
  return path.startsWith(TAG_PATH_PREFIX)
}

export function tagFromPath(path: string): string | undefined {
  if (!isTagPath(path)) return undefined
  return decodeURIComponent(path.slice(TAG_PATH_PREFIX.length))
}

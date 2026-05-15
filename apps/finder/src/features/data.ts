import {
  tree, getTree, subscribeTree, getImageUrl, loadText, walk,
  formatSize, formatDate, collectByAge,
  allTags, entriesByTag, tagPath, isTagPath as _isTagPath,
} from '@interactive-os/fs'
import type { FsNode } from '@interactive-os/fs'
import type { SidebarItem, SmartGroupItem, TagGroupItem } from '../entities/types'
import { extToIcon } from '../entities/types'

// fs primitives는 @interactive-os/fs 가 owner — finder는 re-export 만 (cross-app 호환).
export {
  tree, getTree, subscribeTree, getImageUrl, loadText, walk,
  formatSize, formatDate, collectByAge,
}

/** Smart 그룹 = docs/YYYY/YYYY-MM/YYYY-MM-DD/ 캘린더 폴더로의 직접 alias.
 *  파일 수집 가상 뷰가 아니라 실제 폴더 경로를 만들어 navigate. 별도 스마트 라우팅 불필요. */
const pad2 = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const ym = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`

function todayFolder(): string {
  const d = new Date()
  return `/docs/${d.getFullYear()}/${ym(d)}/${ymd(d)}`
}
function yesterdayFolder(): string {
  const d = new Date(); d.setDate(d.getDate() - 1)
  return `/docs/${d.getFullYear()}/${ym(d)}/${ymd(d)}`
}
function thisMonthFolder(): string {
  const d = new Date()
  return `/docs/${d.getFullYear()}/${ym(d)}`
}
function thisYearFolder(): string {
  return `/docs/${new Date().getFullYear()}`
}

export const smartGroups: SmartGroupItem[] = [
  { id: 'today',     label: '오늘',     path: todayFolder(),     icon: 'inbox' },
  { id: 'yesterday', label: '어제',     path: yesterdayFolder(), icon: 'archive' },
  { id: 'thisMonth', label: '이번 달',  path: thisMonthFolder(), icon: 'calendar-days' },
  { id: 'thisYear',  label: '올해',     path: thisYearFolder(),  icon: 'calendar-range' },
]

/** Tag 가상 폴더 sidebar 항목 — frontmatter.tags 기반.
 *  smartGroups가 캘린더 alias라면 tagGroups는 tag 인덱스 alias. */
export function tagGroups(): TagGroupItem[] {
  return allTags().map(({ tag, count }) => ({
    id: tag,
    label: tag,
    path: tagPath(tag),
    icon: 'hash',
    count,
  }))
}

export const isTagPath = _isTagPath

/** Tag 폴더 항목 — `/_tag/<tag>` path를 columns view가 들어왔을 때 보여줄 file node 목록. */
export function tagItems(tag: string): FsNode[] {
  return entriesByTag(tag).map((e): FsNode => {
    const ext = e.path.split('.').pop()
    return {
      name: e.label,
      path: e.path,
      type: 'file',
      ext,
    }
  })
}

void extToIcon

export const sidebar: SidebarItem[] = [
  { id: 'root',     label: tree.name,           path: '/',                          icon: 'home' },
  { id: 'headless', label: '@interactive-os/aria-kernel',       path: '/packages/aria-kernel/src',     icon: 'dir' },
  { id: 'docs',     label: 'docs',              path: '/docs',                      icon: 'dir' },
]

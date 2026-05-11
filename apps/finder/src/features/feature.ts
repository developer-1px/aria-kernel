/** finder.feature — 단일 spec 으로 finder 화면 전체 정의.
 *
 *  state    사용자 의도 (URL = url, fav 클릭 결과 = pinned, 보기 모드 = mode)
 *  on       (s, cmd) → s'  pure
 *  query    외부 데이터 = state 의 함수 (tree / 파일 텍스트 / 이미지)
 *  view     state + query → ViewModel { titlebar, sidebar, columns, preview }
 *
 *  proof: 아직 라우트에 wiring 되지 않음. /devtools/finder-feature 에서 단독 검증. */

import {
  fromList,
  fromTree,
  pathAncestors,
  type NormalizedData,
} from '@p/aria-kernel'
import { defineFeature, type QuerySpec } from '@p/aria-kernel/store'
import {
  getTree, loadText, getImageUrl, sidebar as favItems, smartGroups, walk,
  tagGroups, tagItems, isTagPath,
} from './data'
import { tagFromPath } from '@p/fs'
import type { FsNode, ViewMode } from '../entities/types'
import { extToIcon } from '../entities/types'

import type { FinderState, FinderCmd, PreviewVM } from '../entities/schema'
import type { FinderCmdType, FinderViewKey } from '../entities/spec'
export type { PreviewVM }

/** on 핸들러 타입 — spec.cmds 키 1:1 강제. 추가/삭제 시 양쪽 동시 변경 강제. */
type CmdReducers = {
  [K in FinderCmdType]: (s: FinderState, p: Extract<FinderCmd, { type: K }>) => FinderState
}

const todayPath = smartGroups[0]?.path ?? '/'
const initial: FinderState = { url: todayPath, pinned: todayPath, mode: 'columns', query: '' }

// ── 헬퍼 ─────────────────────────────────────────────────────────────────
const parentPath = (p: string): string => {
  const i = p.lastIndexOf('/')
  return i <= 0 ? '/' : p.slice(0, i)
}

const isImagePath = (p: string): boolean =>
  /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(p)

// path 문자열만으로는 file/dir 구분 불가 (확장자 없는 file, 존재 안 하는 today 폴더 등).
// tree 노드 lookup 으로 실제 'file' 인지 확인 — 디렉토리·미존재 경로는 loadText 미요청 → 404 회피.
const isFilePath = (p: string): boolean => {
  if (p === '/' || p.endsWith('/')) return false
  return walk(p).at(-1)?.type === 'file'
}

type FlatNode = { id: string; label: string; icon: string; selected: boolean; children?: FlatNode[] }
const fsToFlat = (n: FsNode, url: string): FlatNode => ({
  id: n.path,
  label: n.name,
  icon: n.type === 'dir' ? 'dir' : extToIcon(n.ext),
  selected: n.path === url,
  children: n.children?.map((c) => fsToFlat(c, url)),
})

const buildColumns = (tree: FsNode | undefined, url: string, pinned: string) => {
  // Tag 가상 폴더 — pinned가 tag path면 frontmatter 인덱스 기반 flat file list.
  if (isTagPath(pinned)) {
    const tag = tagFromPath(pinned)
    const files = tag ? tagItems(tag) : []
    return fromTree(
      files.map((n) => ({ id: n.path, label: n.name, icon: extToIcon(n.ext), selected: n.path === url })),
      { focusId: url === pinned ? (files[0]?.path ?? url) : url },
    )
  }
  if (!tree) return { entities: {}, relationships: {}, meta: { root: [] } }
  const rootNode = pinned === '/' ? tree : (walk(pinned).at(-1) ?? tree)
  return fromTree(
    (rootNode.children ?? []).map((n) => fsToFlat(n, url)),
    { focusId: url, expanded: pathAncestors(url) },
  )
}

// Listbox tabIndex={focusId===id?0:-1} — focusId가 어떤 항목과도 매칭 안 되면
// Tab 진입 자체가 막혀 키보드 nav 가 죽는다. 매칭되지 않을 땐 첫 항목으로 fallback.
const matchOrFirst = <T extends { path: string }>(items: T[], pinned: string): string | undefined => {
  const hit = items.find((x) => x.path === pinned)
  return hit?.path ?? items[0]?.path
}

/** sidebar listbox 섹션 공통 빌더 — items.path 가 selected/focus 결정. */
const buildSidebarSection = <T extends { path: string; label: string; icon: string }>(
  items: T[],
  pinned: string,
  labelFor: (x: T) => string = (x) => x.label,
) =>
  fromTree(
    items.map((x) => ({ id: x.path, label: labelFor(x), icon: x.icon, selected: x.path === pinned })),
    { focusId: matchOrFirst(items, pinned) },
  )

const buildRecent = (pinned: string) => buildSidebarSection(smartGroups, pinned)
const buildFav = (pinned: string) => buildSidebarSection(favItems, pinned)
const buildTags = (pinned: string) =>
  buildSidebarSection(tagGroups(), pinned, (g) => `${g.label} (${g.count})`)

const VIEW_MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'icons',   label: '아이콘',  icon: 'layout-grid' },
  { id: 'list',    label: '리스트',  icon: 'list' },
  { id: 'columns', label: '컬럼',    icon: 'columns-3' },
  { id: 'gallery', label: '갤러리',  icon: 'gallery-vertical' },
]

const buildToolbar = (mode: ViewMode): NormalizedData =>
  fromList(VIEW_MODES.map((m) => ({ id: m.id, label: m.label, icon: m.icon, pressed: mode === m.id })))

const buildPreview = (
  url: string,
  tree: FsNode | undefined,
  text: string | null | undefined,
  image: string | null | undefined,
) => {
  if (!tree) return { kind: 'empty' as const }
  const node = walk(url).at(-1)
  if (!node) return { kind: 'empty' as const }
  if (node.type === 'dir') return { kind: 'dir' as const, node }
  if (isImagePath(url)) return { kind: 'image' as const, node, src: image ?? null }
  return { kind: 'text' as const, node, text: text ?? null }
}

// ── Feature ─────────────────────────────────────────────────────────────
export const finderFeature = defineFeature<FinderState, FinderCmd, {
  tree:  QuerySpec<FsNode>
  text:  QuerySpec<string | null>
  image: QuerySpec<string | null>
}, ReturnType<typeof viewFn>>({
  state: initial,

  on: {
    goto:        (s, { to })   => ({ ...s, url: to }),
    pinFav:      (s, { id })   => ({ ...s, pinned: id, url: id }),
    setMode:     (s, { mode }) => ({ ...s, mode }),
    setQuery:    (s, { q })    => ({ ...s, query: q }),
    activateCol: (s, { id })   => ({ ...s, url: id }),
    activateRec: (s, { id })   => ({ ...s, pinned: id, url: id }),
    expandCol:   (s, { id, open }) => ({ ...s, url: open ? id : parentPath(id) }),
    back:        (s) => {
      const chain = walk(s.url)
      const prev = chain[chain.length - 2]?.path ?? '/'
      return { ...s, url: prev }
    },
  } satisfies CmdReducers,

  query: (s) => ({
    tree:  { key: ['finder', 'tree'],          fn: getTree },
    text:  { key: ['finder', 'text', s.url],   fn: () => loadText(s.url),         enabled: isFilePath(s.url) && !isImagePath(s.url) },
    image: { key: ['finder', 'image', s.url],  fn: () => getImageUrl(s.url) ?? null, enabled: isFilePath(s.url) && isImagePath(s.url) },
  }),

  view: viewFn,
})

/** Finder view 모델 — FinderViewSpec 키와 1:1 매칭, 각 슬롯은 실제 shape. */
export interface FinderView {
  titlebar: { path: string; mode: ViewMode; query: string; busy: boolean }
  toolbar: NormalizedData
  sidebar: { recent: NormalizedData; fav: NormalizedData; tags: NormalizedData }
  columns: NormalizedData
  preview: PreviewVM
}

function viewFn(s: FinderState, q: {
  tree: { data: FsNode | undefined; isLoading: boolean; error: unknown }
  text: { data: string | null | undefined; isLoading: boolean; error: unknown }
  image: { data: string | null | undefined; isLoading: boolean; error: unknown }
}): FinderView {
  // satisfies → FinderViewSpec 키 완전성 컴파일타임 가드 (누락/잉여 시 에러)
  return {
    titlebar: { path: s.url, mode: s.mode, query: s.query, busy: q.text.isLoading || q.image.isLoading },
    toolbar: buildToolbar(s.mode),
    sidebar: {
      recent: buildRecent(s.pinned),
      fav:    buildFav(s.pinned),
      tags:   buildTags(s.pinned),
    },
    columns: buildColumns(q.tree.data, s.url, s.pinned),
    preview: buildPreview(s.url, q.tree.data, q.text.data, q.image.data),
  } satisfies Record<FinderViewKey, unknown>
}

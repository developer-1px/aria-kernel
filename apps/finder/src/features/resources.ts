// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import { parentOf, ROOT } from '@p/aria-kernel'
import { defineResource, writeResource } from '@p/aria-kernel/store'
import { finderNavigate } from './nav'
import {
  loadText,
  getImageUrl,
  getTree,
  subscribeTree,
} from './data'
import { highlightCode, renderMarkdown } from '@p/fs'
import type { FsNode, ViewMode } from '../entities/types'

/** Finder의 모든 데이터는 이 모듈의 Resource 정의를 통해서만 노출된다.
 *  컴포넌트는 useResource(...) 단일 인터페이스로만 read/write.
 *  data.ts의 currentTree/loadText/imageUrls 등은 이 파일이 흡수하여 위로 노출하지 않는다. */

export const treeResource = defineResource<FsNode>({
  key: () => 'finder/tree',
  initial: () => getTree(),
  subscribe: (_k, notify) =>
    subscribeTree(() => {
      writeResource(treeResource, getTree())
      notify()
    }),
})

export const viewResource = defineResource<ViewMode>({
  key: () => 'finder/view',
  initial: 'columns',
})

export const pinnedRootResource = defineResource<string>({
  key: () => 'finder/pinnedRoot',
  initial: '/',
})

/** path는 URL이 진실 원천. dispatch({type:'set'})는 router로 위임,
 *  URL → store 역방향은 Finder.tsx의 bridge effect 1회로 채운다.
 *
 *  onEvent: ui/ 의 raw event 를 path 변경으로 직접 흡수한다. activate/navigate 는
 *  대상 id 로, expand 는 open=true 면 자식, false 면 부모 경로로 이동. */
export const pathResource = defineResource<string>({
  key: () => 'finder/path',
  initial: '/',
  serialize: (_k, v) => {
    finderNavigate(v.replace(/^\//, ''))
  },
  onEvent: (e, { data }) => {
    if (e.type === 'activate' || e.type === 'navigate') return e.id
    if (e.type === 'expand') {
      if (e.open) return e.id
      const parent = parentOf(data, e.id)
      return !parent || parent === ROOT ? '/' : parent
    }
    return undefined
  },
})

export const textResource = defineResource<string | null, [string]>({
  key: (path) => `finder/text:${path}`,
  load: (path) => loadText(path),
})

export const imageResource = defineResource<string | null, [string]>({
  key: (path) => `finder/image:${path}`,
  load: (path) => getImageUrl(path) ?? null,
})

export const codeHtmlResource = defineResource<string | null, [string, string]>({
  key: (path, lang) => `finder/code-html:${path}:${lang}`,
  load: async (path, lang) => {
    const text = await loadText(path)
    if (text == null) return null
    return highlightCode(text, lang)
  },
})

export const markdownHtmlResource = defineResource<string | null, [string]>({
  key: (path) => `finder/md-html:${path}`,
  load: async (path) => {
    const text = await loadText(path)
    if (text == null) return null
    return renderMarkdown(text)
  },
})
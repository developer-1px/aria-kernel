// @ts-nocheck — pre-existing zod-crud API drift / virtual module, tracked in #132
import type { FsNode, PreviewKind } from './schema'

type IconToken = string

export type {
  FsNode, SidebarItem, SmartGroupId, SmartGroupItem,
  TagGroupItem, ViewMode, PreviewKind,
} from './schema'
export {
  FsNodeSchema, SidebarItemSchema, SmartGroupIdSchema, SmartGroupItemSchema,
  TagGroupItemSchema, ViewModeSchema, PreviewKindSchema,
} from './schema'

declare module 'virtual:fs-tree' {
  export const tree: FsNode
  export const rootPath: string
}

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'])
const MARKDOWN_EXT = new Set(['md', 'mdx'])
const CODE_EXT = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'json', 'yml', 'yaml', 'toml',
  'css', 'scss', 'sass',
  'html', 'svg',
])
const TEXT_EXT = new Set(['txt'])

export function extToPreviewKind(ext?: string): PreviewKind {
  if (!ext) return 'text'
  const e = ext.toLowerCase()
  if (IMAGE_EXT.has(e)) return 'image'
  if (MARKDOWN_EXT.has(e)) return 'markdown'
  if (CODE_EXT.has(e)) return 'code'
  if (TEXT_EXT.has(e)) return 'text'
  return 'binary'
}

/** shiki 언어 토큰 매핑 */
export function extToLang(ext?: string): string {
  const map: Record<string, string> = {
    ts: 'ts', tsx: 'tsx', js: 'js', jsx: 'jsx', mjs: 'js', cjs: 'js',
    json: 'json', yml: 'yaml', yaml: 'yaml', toml: 'toml',
    css: 'css', scss: 'scss', sass: 'sass',
    html: 'html', svg: 'xml',
    md: 'md', mdx: 'mdx',
  }
  return map[ext?.toLowerCase() ?? ''] ?? 'txt'
}

export function extToIcon(ext?: string): IconToken {
  if (!ext) return 'file'
  if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'fileCode'
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return 'fileConfig'
  if (['md', 'mdx', 'txt'].includes(ext)) return 'fileText'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'fileImage'
  if (['css', 'scss', 'sass'].includes(ext)) return 'filePalette'
  if (['html'].includes(ext)) return 'fileGlobe'
  return 'file'
}
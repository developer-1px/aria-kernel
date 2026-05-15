import { marked } from 'marked'
import { extractFrontmatter } from '@interactive-os/fs'
import {
  DocFrontmatterSchema,
  DocRecordSchema,
  type DocRecord,
  type DocSection,
  type Heading,
} from './schema'

const sources = import.meta.glob<string>('../../../../docs/site/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

type ParsedDoc = Omit<DocRecord, 'html' | 'headings'>

const SITE_MARKER = 'docs/site/'

const parsedDocs = Object.entries(sources)
  .map(([path, raw]) => parseDoc(path, raw))
  .filter((doc): doc is ParsedDoc => doc != null)

const slugByRelPath = new Map(parsedDocs.map((doc) => [doc.relPath, doc.slug]))

export const DOCS: DocRecord[] = parsedDocs
  .map((doc) => DocRecordSchema.parse({
    ...doc,
    ...renderDoc(doc.relPath, doc.body),
  }))
  .sort(compareDocs)

export const DOCS_BY_SLUG = new Map(DOCS.map((doc) => [doc.slug, doc]))
export const DEFAULT_DOC_SLUG = DOCS[0]?.slug ?? 'overview'

export const DOC_SECTIONS: DocSection[] = (() => {
  const groups = new Map<string, DocSection>()
  for (const doc of DOCS) {
    const prev = groups.get(doc.section)
    if (prev) {
      prev.docs.push(doc)
      prev.order = Math.min(prev.order, doc.sectionOrder)
    } else {
      groups.set(doc.section, {
        id: doc.section,
        label: doc.sectionLabel,
        order: doc.sectionOrder,
        docs: [doc],
      })
    }
  }
  return [...groups.values()]
    .map((section) => ({ ...section, docs: [...section.docs].sort(compareDocs) }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
})()

export function getDoc(slug: string | undefined): DocRecord | undefined {
  return DOCS_BY_SLUG.get(slug || DEFAULT_DOC_SLUG)
}

export function adjacentDocs(slug: string): { previous?: DocRecord; next?: DocRecord } {
  const index = DOCS.findIndex((doc) => doc.slug === slug)
  return {
    previous: index > 0 ? DOCS[index - 1] : undefined,
    next: index >= 0 && index < DOCS.length - 1 ? DOCS[index + 1] : undefined,
  }
}

function parseDoc(path: string, raw: string): ParsedDoc | null {
  const extracted = extractFrontmatter(raw)
  const parsed = DocFrontmatterSchema.safeParse(extracted.rawFrontmatter)
  if (!parsed.success) return null

  const matter = parsed.data
  const relPath = toRelPath(path)
  const slug = matter.slug ?? defaultSlug(relPath)
  return {
    relPath,
    slug,
    href: `/docs/${slug}`,
    title: matter.title,
    description: matter.description,
    section: matter.section,
    sectionLabel: matter.sectionLabel ?? matter.section,
    sectionOrder: matter.sectionOrder,
    order: matter.order,
    status: matter.status,
    source: matter.source,
    tags: matter.tags,
    raw,
    body: extracted.body,
  }
}

function renderDoc(relPath: string, body: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = []
  const usedIds = new Map<string, number>()
  const renderer = new marked.Renderer()

  renderer.heading = ({ text, depth }) => {
    if (depth === 1) return ''
    const plain = stripHtml(text)
    const id = uniqueHeadingId(slugify(plain), usedIds)
    if (depth === 2 || depth === 3) headings.push({ id, text: plain, level: depth })
    return `<h${depth} id="${escapeAttr(id)}"><a class="anchor" href="#${escapeAttr(id)}">#</a>${text}</h${depth}>`
  }

  renderer.code = ({ text, lang }) => {
    const safeLang = lang || 'txt'
    return `<pre data-lang="${escapeAttr(safeLang)}"><code>${escapeHtml(text)}</code></pre>`
  }

  renderer.link = ({ href, title, text }) => {
    const nextHref = resolveMarkdownHref(relPath, href ?? '')
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
    return `<a href="${escapeAttr(nextHref)}"${titleAttr}>${text}</a>`
  }

  return {
    html: marked.parse(body, { async: false, renderer }) as string,
    headings,
  }
}

function compareDocs(a: DocRecord, b: DocRecord): number {
  return a.sectionOrder - b.sectionOrder
    || a.order - b.order
    || a.title.localeCompare(b.title)
}

function toRelPath(path: string): string {
  const at = path.indexOf(SITE_MARKER)
  return at === -1 ? path : path.slice(at + SITE_MARKER.length)
}

function defaultSlug(relPath: string): string {
  return relPath
    .replace(/\.md$/, '')
    .replace(/(^|\/)(README|index)$/i, '$1')
    .replace(/\/$/, '')
    .replace(/(^|\/)\d+-/g, '$1')
    || 'overview'
}

function resolveMarkdownHref(currentRelPath: string, href: string): string {
  if (
    !href ||
    href.startsWith('#') ||
    href.startsWith('/') ||
    /^[a-z][a-z0-9+.-]*:/i.test(href)
  ) {
    return href
  }

  const [pathPart, hashPart] = splitHash(href)
  const normalized = normalizeRelPath(`${dirname(currentRelPath)}/${pathPart}`)
  const candidates = candidateMarkdownPaths(normalized)
  for (const candidate of candidates) {
    const slug = slugByRelPath.get(candidate)
    if (slug) return `/docs/${slug}${hashPart}`
  }
  return href
}

function splitHash(href: string): [string, string] {
  const at = href.indexOf('#')
  if (at === -1) return [href, '']
  return [href.slice(0, at), href.slice(at)]
}

function dirname(path: string): string {
  const at = path.lastIndexOf('/')
  return at === -1 ? '' : path.slice(0, at)
}

function candidateMarkdownPaths(path: string): string[] {
  if (path.endsWith('/')) return [`${path}README.md`, `${path}index.md`]
  if (path.endsWith('.md')) return [path]
  return [`${path}.md`, `${path}/README.md`, `${path}/index.md`]
}

function normalizeRelPath(path: string): string {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim()
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-|-$/g, '')
  return slug || 'section'
}

function uniqueHeadingId(base: string, usedIds: Map<string, number>): string {
  const count = usedIds.get(base) ?? 0
  usedIds.set(base, count + 1)
  return count === 0 ? base : `${base}-${count + 1}`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))
}

function escapeAttr(value: string): string {
  return value.replace(/["&<>]/g, (c) => ({
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  }[c] as string))
}

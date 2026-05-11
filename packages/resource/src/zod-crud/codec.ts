/**
 * Pure clipboard codec for @p/aria-kernel collection patterns.
 *
 * Triple-MIME encoding (Lexical/ProseMirror convergence):
 *   - application/x-p-headless+json — canonical JSON.stringify(value)
 *   - text/html — kind-shaped DOM (list/tree=ul/li, grid=table/tr/td) for cross-app paste
 *   - text/plain — label-flatten fallback for plain text targets
 *
 * Decode priority: json → html → plain. Optional zod schema gates each candidate.
 */
import type {ZodType} from 'zod'

export const MIME_HEADLESS_JSON = 'application/x-p-headless+json'
const MIME_HTML = 'text/html'
const MIME_PLAIN = 'text/plain'

type Kind = 'list' | 'tree' | 'grid'

interface EncodedClipboard {
  json: string
  html: string
  plain: string
}

interface LabelNode {
  label?: unknown
  children?: unknown
  [k: string]: unknown
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value])

const labelOf = (node: unknown): string => {
  if (node == null) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number' || typeof node === 'boolean') return String(node)
  if (typeof node === 'object') {
    const label = (node as LabelNode).label
    if (typeof label === 'string') return label
    if (label != null) return String(label)
  }
  return ''
}

const childrenOf = (node: unknown): unknown[] => {
  if (node && typeof node === 'object') {
    const c = (node as LabelNode).children
    if (Array.isArray(c)) return c
  }
  return []
}

// ── encode ──────────────────────────────────────────────────────────────────
const renderListItems = (items: unknown[]): string =>
  items.map((it) => `<li>${escapeHtml(labelOf(it))}</li>`).join('')

const renderTreeItems = (items: unknown[]): string =>
  items
    .map((it) => {
      const kids = childrenOf(it)
      const inner = kids.length > 0 ? `<ul>${renderTreeItems(kids)}</ul>` : ''
      return `<li>${escapeHtml(labelOf(it))}${inner}</li>`
    })
    .join('')

const renderGrid = (rows: unknown[]): string => {
  const tr = rows
    .map((row) => {
      const cells = Array.isArray(row) ? row : childrenOf(row)
      const td = (cells.length > 0 ? cells : [row])
        .map((c) => `<td>${escapeHtml(labelOf(c))}</td>`)
        .join('')
      return `<tr>${td}</tr>`
    })
    .join('')
  return `<table>${tr}</table>`
}

const renderHtml = (value: unknown, kind: Kind): string => {
  const items = toArray(value)
  if (kind === 'grid') return renderGrid(items)
  if (kind === 'tree') return `<ul>${renderTreeItems(items)}</ul>`
  return `<ul>${renderListItems(items)}</ul>`
}

const flattenPlain = (value: unknown, kind: Kind): string => {
  const items = toArray(value)
  if (kind === 'grid') {
    return items
      .map((row) => {
        const cells = Array.isArray(row) ? row : childrenOf(row)
        return (cells.length > 0 ? cells : [row]).map(labelOf).join('\t')
      })
      .join('\n')
  }
  if (kind === 'tree') {
    const lines: string[] = []
    const walk = (nodes: unknown[], depth: number): void => {
      for (const n of nodes) {
        lines.push(`${'  '.repeat(depth)}${labelOf(n)}`)
        const kids = childrenOf(n)
        if (kids.length > 0) walk(kids, depth + 1)
      }
    }
    walk(items, 0)
    return lines.join('\n')
  }
  return items.map(labelOf).join('\n')
}

export function encode(value: unknown, opts: {kind: Kind}): EncodedClipboard {
  return {
    json: JSON.stringify(value),
    html: renderHtml(value, opts.kind),
    plain: flattenPlain(value, opts.kind),
  }
}

// ── decode ──────────────────────────────────────────────────────────────────
const parseListLi = (li: Element): LabelNode => ({label: (li.firstChild?.textContent ?? li.textContent ?? '').trim()})

const parseTreeLi = (li: Element): LabelNode => {
  let label = ''
  const children: LabelNode[] = []
  for (const child of Array.from(li.childNodes)) {
    if (child.nodeType === 3) {
      label += child.textContent ?? ''
    } else if (child instanceof Element) {
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        for (const sub of Array.from(child.children)) {
          if (sub.tagName === 'LI') children.push(parseTreeLi(sub))
        }
      } else {
        label += child.textContent ?? ''
      }
    }
  }
  const node: LabelNode = {label: label.trim()}
  if (children.length > 0) node.children = children
  return node
}

const decodeHtml = (html: string, kind: Kind): unknown => {
  if (typeof DOMParser === 'undefined') return null
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(html, 'text/html')
  } catch {
    return null
  }
  if (kind === 'grid') {
    const table = doc.querySelector('table')
    if (!table) return null
    return Array.from(table.querySelectorAll('tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td,th')).map((c) => (c.textContent ?? '').trim()),
    )
  }
  const ul = doc.querySelector('ul,ol')
  if (!ul) return null
  const lis = Array.from(ul.children).filter((c) => c.tagName === 'LI')
  if (kind === 'tree') return lis.map(parseTreeLi)
  return lis.map(parseListLi)
}

const decodePlain = (plain: string, kind: Kind): unknown => {
  if (kind === 'grid') return plain.split('\n').map((line) => line.split('\t'))
  return plain.split('\n')
}

const tryParse = (raw: string): unknown | undefined => {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const validate = (candidate: unknown, schema: ZodType | undefined): {ok: boolean; value: unknown} => {
  if (!schema) return {ok: true, value: candidate}
  const result = schema.safeParse(candidate)
  return result.success ? {ok: true, value: result.data} : {ok: false, value: null}
}

export function decode(
  clipboardData: DataTransfer | null,
  opts: {schema?: ZodType; kind: Kind},
): unknown | null {
  if (!clipboardData) return null
  const {schema, kind} = opts

  const jsonRaw = clipboardData.getData(MIME_HEADLESS_JSON)
  if (jsonRaw) {
    const parsed = tryParse(jsonRaw)
    if (parsed !== undefined) {
      const v = validate(parsed, schema)
      if (v.ok) return v.value
    }
  }

  const htmlRaw = clipboardData.getData(MIME_HTML)
  if (htmlRaw) {
    const parsed = decodeHtml(htmlRaw, kind)
    if (parsed != null) {
      const v = validate(parsed, schema)
      if (v.ok) return v.value
    }
  }

  const plainRaw = clipboardData.getData(MIME_PLAIN)
  if (plainRaw) {
    const parsed = decodePlain(plainRaw, kind)
    const v = validate(parsed, schema)
    if (v.ok) return v.value
  }

  return null
}

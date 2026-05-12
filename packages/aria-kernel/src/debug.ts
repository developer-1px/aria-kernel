/**
 * debug — NormalizedData 트리를 사람이 읽을 수 있는 ASCII 트리로 직렬화.
 * 잉여 컨테이너/heading skip 등 위계 hint 도 함께 표시.
 */
import { ROOT, type NormalizedData } from './intent/events'

interface PrintOptions {
  /** 잉여 그룹 라벨 후보를 ⚠로 표시한다. */
  hints?: boolean
  /** 한 줄당 최대 길이. 초과 시 …으로 자른다. */
  maxLineLength?: number
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

const summarize = (id: string, data: Record<string, unknown> | undefined): string => {
  if (!data) return id
  const parts: string[] = [id]
  const type = data.type as string | undefined
  const component = data.component as string | undefined
  const variant = data.variant as string | undefined
  const content = data.content as unknown
  const label = data.label as string | undefined
  const role = (data.roledescription as string | undefined) ?? (data.role as string | undefined)
  const props = data.props as Record<string, unknown> | undefined
  const ariaLabel = props?.['aria-label'] as string | undefined
  const flow = data.flow as string | undefined
  const emphasis = data.emphasis as string | undefined

  const tag = component ?? type
  if (tag) parts.push(`<${tag}${variant ? `.${variant}` : ''}>`)
  if (flow) parts.push(`flow=${flow}`)
  if (emphasis) parts.push(`em=${emphasis}`)
  if (role) parts.push(`role=${role}`)
  if (ariaLabel) parts.push(`aria=${JSON.stringify(ariaLabel)}`)
  if (label) parts.push(`label=${JSON.stringify(label)}`)
  if (typeof content === 'string' && content) parts.push(JSON.stringify(content))
  return parts.join(' ')
}

/** 위계 잉여/이상 후보 감지. id별 reason 리스트를 반환. */
const findHints = (d: NormalizedData): Map<string, string[]> => {
  const hints = new Map<string, string[]>()
  const add = (id: string, reason: string) => {
    const cur = hints.get(id) ?? []
    cur.push(reason)
    hints.set(id, cur)
  }
  // (1) 형제 ui의 aria-label과 동일 content를 가진 Text 라벨
  for (const [, kids] of Object.entries(d.relationships)) {
    if (!kids || kids.length < 2) continue
    const uiAriaLabels = new Set<string>()
    for (const k of kids) {
      const data = d.entities[k]
      const props = data?.props as Record<string, unknown> | undefined
      const aria = props?.['aria-label']
      if (typeof aria === 'string') uiAriaLabels.add(aria)
    }
    for (const k of kids) {
      const data = d.entities[k]
      if (!data) continue
      if (data.type === 'Text' && typeof data.content === 'string' && uiAriaLabels.has(data.content)) {
        add(k, 'duplicates sibling aria-label')
      }
    }
  }
  // (2) 단일 자식 컨테이너 — 그룹의 의미가 없음
  for (const [parentId, kids] of Object.entries(d.relationships)) {
    if (!kids || kids.length !== 1) continue
    const data = d.entities[parentId]
    const t = data?.type
    if (t === 'Row' || t === 'Column' || t === 'Grid' || t === 'Section') {
      add(parentId, 'single-child container — flatten?')
    }
  }
  // (3) 빈 컨테이너 — 자식 0개
  for (const [id, ent] of Object.entries(d.entities)) {
    const t = ent?.type
    if (t === 'Row' || t === 'Column' || t === 'Grid' || t === 'Section' || t === 'Header' || t === 'Footer') {
      const kids = d.relationships[id]
      if (!kids || kids.length === 0) add(id, 'empty container')
    }
  }
  // (4) heading skip — h2 다음에 h3 없이 strong/h4가 section header로 쓰이는 케이스
  //   strong이 sibling으로 형제 컨테이너의 라벨처럼 쓰이면 의미적으로 h3여야 함
  for (const [, kids] of Object.entries(d.relationships)) {
    if (!kids) continue
    for (let i = 0; i < kids.length - 1; i++) {
      const a = d.entities[kids[i]]
      const b = d.entities[kids[i + 1]]
      if (a?.type === 'Text' && a.variant === 'strong'
          && (b?.type === 'Ui' || b?.type === 'Column' || b?.type === 'Row')) {
        add(kids[i], 'strong used as section header — should be h3?')
      }
    }
  }
  return hints
}

/** NormalizedData → ASCII 트리 문자열. hints=true 면 잉여 컨테이너/heading skip 등을 ⚠ 로 표시. */
export function printTree(d: NormalizedData, opts: PrintOptions = {}): string {
  const { hints = true, maxLineLength = 140 } = opts
  const flagged = hints ? findHints(d) : new Map<string, string[]>()
  const lines: string[] = []
  const seen = new Set<string>()

  const walk = (id: string, prefix: string, isLast: boolean, isRoot: boolean) => {
    if (seen.has(id)) {
      lines.push(`${prefix}${isRoot ? '' : isLast ? '└── ' : '├── '}↻ ${id}`)
      return
    }
    seen.add(id)
    const ent = d.entities[id]
    const summary = summarize(id, ent)
    const reasons = flagged.get(id)
    const flag = reasons ? `  ⚠ ${reasons.join('; ')}` : ''
    const branch = isRoot ? '' : isLast ? '└── ' : '├── '
    lines.push(truncate(`${prefix}${branch}${summary}${flag}`, maxLineLength))
    const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ')
    const kids = d.relationships[id] ?? []
    kids.forEach((k, i) => walk(k, childPrefix, i === kids.length - 1, false))
  }

  walk(ROOT, '', true, true)

  if (hints && flagged.size > 0) {
    lines.push('')
    lines.push(`⚠ ${flagged.size} hint(s) — review marked nodes above.`)
  }
  return lines.join('\n')
}

/** 의미 위계만 추출 — Text variant h1~h3 + strong을 트리 깊이로 들여쓰기. */
export function printHeadingOutline(d: NormalizedData): string {
  const lines: string[] = []
  const rank = (variant: string | undefined): number => {
    if (variant === 'h1') return 1
    if (variant === 'h2') return 2
    if (variant === 'h3') return 3
    if (variant === 'h4') return 4
    if (variant === 'strong') return 5
    return 0
  }
  const seen = new Set<string>()
  const walk = (id: string, depth: number) => {
    if (seen.has(id)) return
    seen.add(id)
    const ent = d.entities[id]
    const data = ent
    if (data?.type === 'Text') {
      const r = rank(data.variant as string | undefined)
      const content = data.content
      if (r > 0 && typeof content === 'string') {
        lines.push(`${'  '.repeat(r - 1)}${data.variant} · ${content}`)
      }
    }
    const kids = d.relationships[id] ?? []
    for (const k of kids) walk(k, depth + 1)
  }
  walk(ROOT, 0)
  return lines.length ? lines.join('\n') : '(no headings)'
}

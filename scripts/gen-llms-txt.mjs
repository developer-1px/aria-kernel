#!/usr/bin/env node
/**
 * gen-llms-txt.mjs — typedoc JSON → llms.txt + llms-full.txt
 *
 * https://llmstxt.org/ 명세 — 두 파일 페어:
 *   • llms.txt       — 인덱스 (export 이름 + 한 줄 + 시그니처 hint)
 *   • llms-full.txt  — 전문 (TSDoc 본문 + 시그니처 + @example 보존)
 *
 * 사용:
 *   pnpm docs:llms          # api.json 재생성 후 자동 호출
 *   node scripts/gen-llms-txt.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const JSON_PATH = path.join(ROOT, 'docs/api.json')

if (!fs.existsSync(JSON_PATH)) {
  console.error(`❌ ${JSON_PATH} not found. Run: pnpm docs:api`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))

// ────────────────────────────────────────────────
// Comment extraction
// ────────────────────────────────────────────────

const renderComment = (parts = []) =>
  parts
    .map((c) => {
      if (c.kind === 'text' || c.kind === 'code') return c.text ?? ''
      if (c.kind === 'inline-tag' && c.tag === '@link') return c.text ?? ''
      return c.text ?? ''
    })
    .join('')

const summaryOf = (node) => {
  // Functions: prefer signature comment (own description), fall back to top comment.
  // Re-exported functions inherit the module-level comment on .comment, so signatures[0] is more specific.
  const sig = renderComment(node.signatures?.[0]?.comment?.summary)
  if (sig.trim()) return sig.trim()
  return renderComment(node.comment?.summary).trim()
}

const blockTagsOf = (node) => [
  ...(node.comment?.blockTags ?? []),
  ...(node.signatures?.[0]?.comment?.blockTags ?? []),
]

const seeUrlOf = (node) => {
  const see = blockTagsOf(node).find((t) => t.tag === '@see')
  if (!see) return ''
  const text = renderComment(see.content)
  return text.match(/https?:\S+/)?.[0] ?? ''
}

const exampleOf = (node) => {
  const ex = blockTagsOf(node).find((t) => t.tag === '@example')
  return ex ? renderComment(ex.content).trim() : ''
}

const oneLine = (s) =>
  s.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim()

// ────────────────────────────────────────────────
// Signature reconstruction
// ────────────────────────────────────────────────

const renderType = (t) => {
  if (!t) return 'unknown'
  switch (t.type) {
    case 'intrinsic': return t.name
    case 'literal': return JSON.stringify(t.value)
    case 'reference': return t.name + (t.typeArguments?.length ? `<${t.typeArguments.map(renderType).join(', ')}>` : '')
    case 'array': return `${renderType(t.elementType)}[]`
    case 'union': return t.types.map(renderType).join(' | ')
    case 'intersection': return t.types.map(renderType).join(' & ')
    case 'tuple': return `[${(t.elements ?? []).map(renderType).join(', ')}]`
    case 'reflection': {
      const sig = t.declaration?.signatures?.[0]
      if (sig) return renderSignature(sig, true)
      return 'object'
    }
    case 'predicate': return `${t.name} is ${renderType(t.targetType)}`
    case 'typeOperator': return `${t.operator} ${renderType(t.target)}`
    case 'query': return `typeof ${renderType(t.queryType)}`
    case 'indexedAccess': return `${renderType(t.objectType)}[${renderType(t.indexType)}]`
    case 'mapped': return 'mapped'
    case 'conditional': return 'conditional'
    case 'templateLiteral': return 'string-template'
    default: return t.name ?? t.type ?? 'unknown'
  }
}

const renderSignature = (sig, arrow = false) => {
  const params = (sig.parameters ?? [])
    .map((p) => {
      const opt = p.flags?.isOptional ? '?' : ''
      return `${p.name}${opt}: ${renderType(p.type)}`
    })
    .join(', ')
  const ret = renderType(sig.type)
  return arrow ? `(${params}) => ${ret}` : `(${params}): ${ret}`
}

const signatureHint = (node) => {
  if (node.signatures?.[0]) return renderSignature(node.signatures[0])
  if (node.type) return `: ${renderType(node.type)}`
  return ''
}

// ────────────────────────────────────────────────
// Module ordering + filtering
// ────────────────────────────────────────────────

const KIND_ORDER = {
  patterns: 1, axes: 2, state: 3, store: 4,
  roving: 5, key: 6, gesture: 7, local: 8, index: 9,
}

const modules = (data.children ?? [])
  .filter((m) => m.kind === 2)
  .sort((a, b) => (KIND_ORDER[a.name] ?? 99) - (KIND_ORDER[b.name] ?? 99))

const exportsOf = (mod) =>
  (mod.children ?? []).filter(
    (c) => c.kind !== 2 && !c.flags?.isPrivate && !c.flags?.isInternal,
  )

// ────────────────────────────────────────────────
// llms.txt — concise index
// ────────────────────────────────────────────────

const writeIndex = () => {
  const out = []
  out.push('# @p/aria-kernel')
  out.push('')
  out.push(
    'ARIA 행동 인프라(Behavior infrastructure for WAI-ARIA). Roving tabindex, axis composition, 24 APG patterns — zero markup vocabulary, zero CSS.',
  )
  out.push('')
  out.push('> 시각은 소비자가 Tailwind utility class 로 직접 구성. 이름·구조는 W3C ARIA/APG 어휘 그대로.')
  out.push('')
  out.push('## Docs')
  out.push('- [llms-full.txt](llms-full.txt): 전체 시그니처·@example 포함 (LLM 컨텍스트용)')
  out.push('- [INVARIANTS.md](packages/aria-kernel/INVARIANTS.md): 헤드리스 invariant')
  out.push('- [PATTERNS.md](packages/aria-kernel/PATTERNS.md): pattern recipe 시그니처')
  out.push('- [ADR 0003](docs/adr/0003-aria-punt-absorption-line.md): ARIA-punt 흡수 책임선')
  out.push('- [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/): 정본 어휘 출처')
  out.push('')
  out.push('## 책임선 (ARIA-punt absorption)')
  out.push('')
  out.push('kernel = **W3C 표준 어휘로 표현 가능한 모든 행동 결정 흡수 + 입력 이벤트(dialog·keyboard·clipboard) transport**.')
  out.push('ARIA spec 이 "implementation-defined" 로 punt 한 지점(backdrop close, controlled selection, outside close, edit chord 등)을 kernel 이 흡수한다.')
  out.push('소비자는 시각(Tailwind) + 데이터만 결정. §B-ter invariants 참조.')
  out.push('')
  out.push('## /lab — ARIA-punt 흡수 PoC')
  out.push('')
  out.push('각 lab entry = 하나의 ARIA-punt 흡수 결정. 데모 + black-box 테스트 + adopter 추적.')
  out.push('- **dialog-backdrop** (§B-ter.1) — `backdropProps` self-target close')
  out.push('- **tabs-controlled** (§B-ter.2) — `active` controlled prop')
  out.push('- **menu-outside-close** (§B-ter.3) — `onInteractOutside` document mousedown')
  out.push('- **grid-edit-start** (§B-ter.4) — F2/Enter → `editStart` UiEvent')
  out.push('- **dialog-on-keymap** (§B-ter.5) — `on: { chord: fn }` middleware')
  out.push('')

  for (const mod of modules) {
    out.push(`## ${mod.name}`)
    const modSummary = oneLine(summaryOf(mod))
    if (modSummary) out.push('', modSummary)
    out.push('')
    for (const ex of exportsOf(mod)) {
      const summary = oneLine(summaryOf(ex)) || '(undocumented)'
      const see = seeUrlOf(ex)
      const suffix = see ? ` ${see}` : ''
      out.push(`- **${ex.name}** — ${summary}${suffix}`)
    }
    out.push('')
  }

  return out.join('\n')
}

// ────────────────────────────────────────────────
// llms-full.txt — full content
// ────────────────────────────────────────────────

const writeFull = () => {
  const out = []
  out.push('# @p/aria-kernel — 전체 API')
  out.push('')
  out.push('이 파일은 LLM 컨텍스트 주입용 — 모든 public export 의 시그니처 + TSDoc + @example 을 한 문서에 직렬화한다.')
  out.push('')

  for (const mod of modules) {
    out.push(`# Module: ${mod.name}`)
    out.push('')
    const modSummary = summaryOf(mod)
    if (modSummary) out.push(modSummary, '')

    for (const ex of exportsOf(mod)) {
      out.push(`## ${ex.name}`)
      const sig = signatureHint(ex)
      if (sig) {
        out.push('')
        out.push('```ts')
        out.push(`${ex.name}${sig.startsWith(':') ? sig : ' ' + sig}`)
        out.push('```')
      }
      const summary = summaryOf(ex)
      if (summary) out.push('', summary)

      const see = seeUrlOf(ex)
      if (see) out.push('', `See: ${see}`)

      const example = exampleOf(ex)
      if (example) {
        out.push('', '**Example**')
        out.push('')
        // example may already contain code fence
        if (!example.startsWith('```')) {
          out.push('```ts')
          out.push(example)
          out.push('```')
        } else {
          out.push(example)
        }
      }
      out.push('')
    }
  }

  return out.join('\n')
}

// ────────────────────────────────────────────────
// Write
// ────────────────────────────────────────────────

const indexBody = writeIndex()
const fullBody = writeFull()

// 1) 루트 — 저장소 가시성 (GitHub README 등)
// 2) apps/site/public — vite serves at /llms.txt, /llms-full.txt
const targets = [
  { dir: ROOT, label: 'root' },
  { dir: path.join(ROOT, 'apps/site/public'), label: 'site/public' },
]

for (const { dir, label } of targets) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'llms.txt'), indexBody)
  fs.writeFileSync(path.join(dir, 'llms-full.txt'), fullBody)
  const i = fs.statSync(path.join(dir, 'llms.txt')).size
  const f = fs.statSync(path.join(dir, 'llms-full.txt')).size
  console.log(`✅ ${label.padEnd(12)} llms.txt ${(i / 1024).toFixed(1)} kB · llms-full.txt ${(f / 1024).toFixed(1)} kB`)
}

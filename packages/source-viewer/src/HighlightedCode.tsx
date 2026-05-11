import { useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'
import { parse } from '@babel/parser'
import type { Statement } from '@babel/types'

const langFromFilename = (f: string): string => {
  if (f.endsWith('.tsx')) return 'tsx'
  if (f.endsWith('.ts')) return 'ts'
  if (f.endsWith('.jsx')) return 'jsx'
  if (f.endsWith('.js')) return 'js'
  return 'tsx'
}

/**
 * AST 기반 highlight set — 각 symbol 의 top-level export 선언이 차지하는 라인 (0-indexed) 모음.
 * babel parser 의 `loc.start.line` / `loc.end.line` (1-indexed) 를 그대로 활용.
 */
const computeHighlightSet = (source: string, symbols: string[]): Set<number> => {
  const out = new Set<number>()
  if (symbols.length === 0) return out
  let ast
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    })
  } catch {
    return out
  }
  const wanted = new Set(symbols)
  for (const node of ast.program.body as Statement[]) {
    if (node.type !== 'ExportNamedDeclaration' && node.type !== 'ExportDefaultDeclaration') continue
    if (!node.loc) continue
    const startLine = node.loc.start.line - 1
    const endLine = node.loc.end.line - 1
    let matches = false
    if (node.type === 'ExportNamedDeclaration') {
      const d = node.declaration
      if (d) {
        if ('id' in d && d.id && d.id.type === 'Identifier' && wanted.has(d.id.name)) matches = true
        if (d.type === 'VariableDeclaration') {
          for (const v of d.declarations) {
            if (v.id.type === 'Identifier' && wanted.has(v.id.name)) matches = true
          }
        }
      }
      for (const s of node.specifiers) {
        if (s.type !== 'ExportSpecifier') continue
        const exportedName = s.exported.type === 'Identifier' ? s.exported.name : s.exported.value
        if (wanted.has(exportedName)) matches = true
      }
    }
    if (matches) {
      for (let i = startLine; i <= endLine; i++) out.add(i)
    }
  }
  return out
}

export function HighlightedCode({
  source,
  filename,
  highlightSymbols,
}: {
  source: string
  filename: string
  highlightSymbols?: string[]
}) {
  const [html, setHtml] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    codeToHtml(source, { lang: langFromFilename(filename), theme: 'github-dark' })
      .then((h) => { if (!cancelled) setHtml(h) })
      .catch(() => { if (!cancelled) setHtml(null) })
    return () => { cancelled = true }
  }, [source, filename])

  useEffect(() => {
    if (!html || !ref.current) return
    const lineEls = ref.current.querySelectorAll<HTMLElement>('.line')
    if (!highlightSymbols || highlightSymbols.length === 0) {
      lineEls.forEach((el) => { delete el.dataset.hl })
      return
    }
    const set = computeHighlightSet(source, highlightSymbols)
    lineEls.forEach((el, i) => {
      if (set.has(i)) el.dataset.hl = 'true'
      else delete el.dataset.hl
    })
  }, [html, highlightSymbols, source])

  if (html) {
    return (
      <div
        ref={ref}
        className="flex-1 text-xs leading-relaxed font-mono md:overflow-auto [&_pre]:!bg-transparent [&_pre]:py-4 [&_pre]:pl-2 [&_pre]:pr-4 [&_pre]:h-full [&_pre]:whitespace-normal [&_pre]:break-normal [&_.line]:block [&_.line]:whitespace-pre-wrap [&_.line]:break-all [counter-reset:lineno] [&_.line]:before:content-[counter(lineno)] [&_.line]:before:[counter-increment:lineno] [&_.line]:before:inline-block [&_.line]:before:w-8 [&_.line]:before:pr-3 [&_.line]:before:text-right [&_.line]:before:text-stone-600 [&_.line]:before:select-none [&_.line[data-hl=true]]:bg-stone-700/40 [&_.line[data-hl=true]]:before:text-stone-300"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  const lines = source.split('\n')
  return (
    <pre className="flex-1 p-4 text-xs leading-relaxed text-stone-100 font-mono md:overflow-auto whitespace-pre-wrap break-all">
      <code>
        {lines.map((line, i) => (
          <span key={i} className="block">
            <span className="inline-block w-8 pr-3 text-right text-stone-600 select-none">{i + 1}</span>
            {line}
          </span>
        ))}
      </code>
    </pre>
  )
}

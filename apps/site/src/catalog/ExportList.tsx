/**
 * Subpath index.ts 의 raw 소스를 받아 `export ...` 식별자를 추출해 렌더.
 * SSOT = 코드. 새 export 추가 시 메뉴/리스트 자동 반영.
 */

interface ExportEntry {
  name: string
  kind: 'function' | 'const' | 'type' | 'interface' | 'reexport'
}

const extractExports = (src: string): ExportEntry[] => {
  const out: ExportEntry[] = []
  const seen = new Set<string>()
  const push = (name: string, kind: ExportEntry['kind']) => {
    if (seen.has(name)) return
    seen.add(name)
    out.push({ name, kind })
  }

  // `export { a, b as c, type T }` (멀티라인 포함)
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const raw of m[1].split(',')) {
      const cleaned = raw.replace(/\s+/g, ' ').trim()
      if (!cleaned) continue
      const isType = /^type\s/.test(cleaned)
      const ident = cleaned.replace(/^type\s+/, '').split(/\s+as\s+/).pop()!.trim()
      if (ident) push(ident, isType ? 'type' : 'reexport')
    }
  }
  // `export function|const|type|interface NAME`
  for (const m of src.matchAll(/export\s+(function|const|let|var|type|interface)\s+([A-Za-z_]\w*)/g)) {
    const kind = m[1] === 'function' ? 'function' : m[1] === 'interface' ? 'interface' : m[1] === 'type' ? 'type' : 'const'
    push(m[2], kind)
  }
  return out
}

export function ExportList({ title, sub, src }: { title: string; sub?: string; src: string }) {
  const entries = extractExports(src)
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto max-w-4xl px-8 pt-12 pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-stone-600">{sub}</p>}
        <p className="mt-2 text-[13px] text-stone-400">{entries.length} exports · SSOT = src/index.ts</p>
      </header>
      <main className="mx-auto max-w-4xl px-8 pb-20">
        <ul className="divide-y divide-stone-100">
          {entries.map((e) => (
            <li key={e.name} className="grid grid-cols-[1fr_auto] items-center py-2">
              <code className="font-mono text-[15px] text-stone-900">{e.name}</code>
              <span className="text-[12px] uppercase tracking-wide text-stone-400">{e.kind}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

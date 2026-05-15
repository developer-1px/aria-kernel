import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { fromList, fromTree, pathAncestors } from '@interactive-os/aria-kernel'
import { SnapPage } from '../layout/SnapPage'

export const Route = createFileRoute('/data')({
  component: DataApp,
  staticData: {
    palette: {
      label: 'Data',
      to: '/data',
      sub: 'NormalizedData 진입점 — fromList · fromTree · pathAncestors',
    },
  },
})

function DataApp() {
  return (
    <SnapPage>
      <Intro />
      <FromListSection />
      <FromTreeSection />
      <PathAncestorsSection />
    </SnapPage>
  )
}

function Intro() {
  return (
    <section className="snap-start min-h-screen flex items-center">
      <div className="mx-auto max-w-5xl px-8 py-12 w-full">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Data construction
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-stone-900">NormalizedData 만들기</h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-600">
          모든 데모와 wrapper 의 첫 줄. <code className="rounded bg-stone-100 px-1.5 font-mono text-base">{'fromList'}</code>·
          <code className="rounded bg-stone-100 px-1.5 font-mono text-base">{'fromTree'}</code>·
          <code className="rounded bg-stone-100 px-1.5 font-mono text-base">{'pathAncestors'}</code> 가
          {' '}<code className="font-mono">{`{entities, relationships, meta}`}</code> 의 표준 shape 으로 변환.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title="fromList(items)" body="평평한 array → entities + meta.root. id 없으면 __0,__1 자동 부여." anchor="from-list" />
          <Card title="fromTree(roots, opts?)" body="중첩 children 트리 → entities + relationships + meta.{root,expanded,focus}." anchor="from-tree" />
          <Card title="pathAncestors(path)" body="`/a/b/c` → `[/a, /a/b, /a/b/c]`. tree expanded 시드 계산." anchor="path-ancestors" />
        </div>
      </div>
    </section>
  )
}

function Card({ title, body, anchor }: { title: string; body: string; anchor: string }) {
  return (
    <a
      href={`#${anchor}`}
      className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-900"
    >
      <h3 className="font-mono text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
    </a>
  )
}

function FromListSection() {
  const [text, setText] = useState(
    JSON.stringify(
      [
        { id: 'apple', label: '🍎 Apple' },
        { id: 'banana', label: '🍌 Banana' },
        { label: '🍒 Cherry (no id)' },
      ],
      null,
      2,
    ),
  )
  let parsed: ReturnType<typeof fromList> | { error: string }
  try {
    parsed = fromList(JSON.parse(text))
  } catch (e) {
    parsed = { error: (e as Error).message }
  }
  return <Section anchor="from-list" title="fromList" subtitle="array → entities + meta.root" input={text} onChange={setText} output={parsed} />
}

function FromTreeSection() {
  const [text, setText] = useState(
    JSON.stringify(
      [
        {
          id: 'src',
          label: 'src',
          children: [
            { id: 'src/main.tsx', label: 'main.tsx' },
            {
              id: 'src/components',
              label: 'components',
              children: [
                { id: 'src/components/Button.tsx', label: 'Button.tsx' },
              ],
            },
          ],
        },
        { id: 'README.md', label: 'README.md' },
      ],
      null,
      2,
    ),
  )
  let parsed: ReturnType<typeof fromTree> | { error: string }
  try {
    parsed = fromTree(JSON.parse(text), { expanded: ['src', 'src/components'] })
  } catch (e) {
    parsed = { error: (e as Error).message }
  }
  return (
    <Section
      anchor="from-tree"
      title="fromTree"
      subtitle="중첩 children → entities + relationships + meta"
      input={text}
      onChange={setText}
      output={parsed}
      hint={`fromTree(roots, { expanded: ['src', 'src/components'] })`}
    />
  )
}

function PathAncestorsSection() {
  const [path, setPath] = useState('/a/b/c/d')
  const ancestors = pathAncestors(path)
  return (
    <section id="path-ancestors" tabIndex={-1} className="snap-start min-h-screen flex flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-mono text-xl font-bold text-stone-900">pathAncestors</h2>
        <p className="text-sm text-stone-600">
          path 문자열을 누적 prefix 배열로 변환 — tree 의 expanded 시드 계산에 사용
        </p>
      </header>
      <div className="grid flex-1 grid-cols-2 gap-6 overflow-hidden p-8">
        <div className="flex flex-col">
          <label className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Input — path
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="rounded border border-stone-300 bg-white px-3 py-2 font-mono text-sm"
          />
          <p className="mt-2 text-xs text-stone-500">기본 separator: <code className="font-mono">'/'</code></p>
        </div>
        <div className="flex flex-col overflow-hidden">
          <label className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Output — string[]
          </label>
          <pre className="flex-1 overflow-auto rounded bg-stone-950 p-4 text-xs leading-relaxed text-stone-100 font-mono">
            <code>{JSON.stringify(ancestors, null, 2)}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

function Section({
  anchor,
  title,
  subtitle,
  input,
  onChange,
  output,
  hint,
}: {
  anchor: string
  title: string
  subtitle: string
  input: string
  onChange: (s: string) => void
  output: unknown
  hint?: string
}) {
  return (
    <section id={anchor} tabIndex={-1} className="snap-start min-h-screen flex flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-mono text-xl font-bold text-stone-900">{title}</h2>
        <p className="text-sm text-stone-600">{subtitle}</p>
        {hint && (
          <code className="mt-1 block font-mono text-xs text-stone-500">{hint}</code>
        )}
      </header>
      <div className="grid flex-1 grid-cols-2 gap-6 overflow-hidden p-8">
        <div className="flex flex-col overflow-hidden">
          <label className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Input (JSON)
          </label>
          <textarea
            value={input}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="flex-1 resize-none rounded border border-stone-300 bg-white p-3 font-mono text-xs leading-relaxed"
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <label className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Output — NormalizedData
          </label>
          <pre className="flex-1 overflow-auto rounded bg-stone-950 p-4 text-xs leading-relaxed text-stone-100 font-mono">
            <code>{JSON.stringify(output, null, 2)}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

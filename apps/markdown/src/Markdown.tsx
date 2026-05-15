import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { loadText, renderMarkdown } from '@interactive-os/fs'

export function Markdown() {
  const { _splat } = useParams({ strict: false }) as { _splat?: string }
  const path = '/' + (_splat ?? '')
  const text = useText(path)
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    if (text == null) return
    let alive = true
    renderMarkdown(text).then((h) => { if (alive) setHtml(h) })
    return () => { alive = false }
  }, [text])

  const proseHtml: string =
    text == null ? '<p aria-busy="true">로드 중…</p>' :
    html == null ? '' :
    html

  return (
    <main
      aria-roledescription="markdown-app"
      aria-label="Markdown 뷰어"
      className="mx-auto flex h-svh w-full max-w-3xl flex-col gap-4 p-6"
    >
      <nav aria-label="경로" className="flex items-center gap-3 text-xs text-neutral-500">
        <Link to="/apps/finder/$" params={{ _splat: '' }} className="text-blue-600 hover:underline">← Finder</Link>
        <span>{path}</span>
      </nav>
      <article
        aria-label="문서 본문"
        className="prose-style flex-1 overflow-auto text-sm leading-relaxed text-neutral-800 [&_h1]:mt-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:my-2 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:bg-neutral-50 [&_pre]:p-3"
        dangerouslySetInnerHTML={{ __html: proseHtml }}
      />
    </main>
  )
}

function useText(path: string) {
  const [loaded, setLoaded] = useState<{ path: string; text: string }>()
  useEffect(() => {
    let alive = true
    loadText(path).then((t) => { if (alive && typeof t === 'string') setLoaded({ path, text: t }) })
    return () => { alive = false }
  }, [path])
  return loaded?.path === path ? loaded.text : null
}

import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { MarkdownArticle } from '../docs/MarkdownArticle'
import {
  DOC_SECTIONS,
  adjacentDocs,
  getDoc,
} from '../docs/catalog'
import type { DocRecord, Heading } from '../docs/schema'

export const Route = createFileRoute('/docs/$slug')({
  component: DocPage,
  staticData: {
    palette: {
      label: 'Docs',
      to: '/docs/$slug',
      params: { slug: 'overview' },
      sub: 'Korean technical documentation from markdown',
    },
  },
  loader: ({ params }) => {
    const doc = getDoc(params.slug)
    if (!doc) throw notFound()
    return doc
  },
})

function DocPage() {
  const doc = Route.useLoaderData()
  const adjacent = adjacentDocs(doc.slug)

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-5 md:px-8 md:py-8 lg:grid-cols-[240px_minmax(0,1fr)_230px]">
        <DocsNav active={doc.slug} />
        <main className="min-w-0 rounded-md border border-stone-200 bg-white px-5 py-6 shadow-sm md:px-8 md:py-8">
          <DocHeader doc={doc} />
          <MarkdownArticle html={doc.html} />
          <DocPager previous={adjacent.previous} next={adjacent.next} />
        </main>
        <PageToc headings={doc.headings} />
      </div>
    </div>
  )
}

function DocHeader({ doc }: { doc: DocRecord }) {
  return (
    <header className="mb-8 border-b border-stone-200 pb-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span>{doc.sectionLabel}</span>
        <span aria-hidden="true">/</span>
        <span>{doc.status}</span>
      </div>
      <h1 className="text-3xl font-semibold text-stone-950 md:text-4xl">
        {doc.title}
      </h1>
      {doc.description && (
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          {doc.description}
        </p>
      )}
      {(doc.source.length > 0 || doc.tags.length > 0) && (
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          {doc.source.length > 0 && (
            <div>
              <dt className="text-xs font-semibold uppercase text-stone-500">근거 소스</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {doc.source.map((source) => (
                  <code key={source} className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700">
                    {source}
                  </code>
                ))}
              </dd>
            </div>
          )}
          {doc.tags.length > 0 && (
            <div>
              <dt className="text-xs font-semibold uppercase text-stone-500">태그</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {doc.tags.map((tag) => (
                  <span key={tag} className="rounded border border-stone-200 px-1.5 py-0.5 text-xs text-stone-600">
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      )}
    </header>
  )
}

function DocsNav({ active }: { active: string }) {
  return (
    <nav aria-label="Docs index" className="self-start text-sm lg:sticky lg:top-8">
      <div className="rounded-md border border-stone-200 bg-white p-3 shadow-sm">
        <h2 className="px-2 pb-2 text-[10px] font-semibold uppercase text-stone-500">
          문서
        </h2>
        <div className="flex gap-2 overflow-x-auto lg:block lg:space-y-4">
          {DOC_SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`docs-section-${section.id}`} className="min-w-56 lg:min-w-0">
              <h3 id={`docs-section-${section.id}`} className="px-2 text-[10px] font-semibold uppercase text-stone-400">
                {section.label}
              </h3>
              <ul className="mt-1 space-y-0.5">
                {section.docs.map((doc) => (
                  <li key={doc.slug}>
                    <DocLink doc={doc} active={doc.slug === active} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-4 border-t border-stone-200 pt-3">
          <h3 className="px-2 text-[10px] font-semibold uppercase text-stone-400">
            레퍼런스
          </h3>
          <ul className="mt-1 space-y-0.5">
            <li><Link to="/patterns" className="block rounded px-2 py-1.5 text-stone-700 hover:bg-stone-100">Patterns</Link></li>
            <li><Link to="/wrappers" className="block rounded px-2 py-1.5 text-stone-700 hover:bg-stone-100">Wrappers</Link></li>
            <li><Link to="/data" className="block rounded px-2 py-1.5 text-stone-700 hover:bg-stone-100">Data</Link></li>
            <li><Link to="/uievents" className="block rounded px-2 py-1.5 text-stone-700 hover:bg-stone-100">UiEvents</Link></li>
            <li><Link to="/axes" className="block rounded px-2 py-1.5 text-stone-700 hover:bg-stone-100">Axes</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

function DocLink({ doc, active }: { doc: DocRecord; active: boolean }) {
  return (
    <Link
      to="/docs/$slug"
      params={{ slug: doc.slug }}
      className={`block rounded px-2 py-1.5 ${
        active ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
      }`}
    >
      {doc.title}
    </Link>
  )
}

function PageToc({ headings }: { headings: Heading[] }) {
  if (!headings.length) return <div />
  return (
    <nav aria-label="On this page" className="hidden self-start text-sm lg:sticky lg:top-8 lg:block">
      <div className="rounded-md border border-stone-200 bg-white p-3 shadow-sm">
        <h2 className="px-2 pb-2 text-[10px] font-semibold uppercase text-stone-500">
          이 문서
        </h2>
        <ul className="space-y-0.5">
          {headings.map((heading) => (
            <li key={heading.id} className={heading.level === 3 ? 'pl-3' : ''}>
              <a
                href={`#${heading.id}`}
                className="block rounded px-2 py-1 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

function DocPager({ previous, next }: { previous?: DocRecord; next?: DocRecord }) {
  if (!previous && !next) return null
  return (
    <nav aria-label="Docs pagination" className="mt-10 grid gap-3 border-t border-stone-200 pt-6 md:grid-cols-2">
      <PagerLink label="이전" doc={previous} />
      <PagerLink label="다음" doc={next} align="right" />
    </nav>
  )
}

function PagerLink({
  label,
  doc,
  align,
}: {
  label: string
  doc?: DocRecord
  align?: 'right'
}) {
  if (!doc) return <div />
  return (
    <Link
      to="/docs/$slug"
      params={{ slug: doc.slug }}
      className={`rounded-md border border-stone-200 p-3 hover:border-stone-400 hover:bg-stone-50 ${align === 'right' ? 'text-right' : ''}`}
    >
      <span className="block text-xs font-semibold uppercase text-stone-500">{label}</span>
      <span className="mt-1 block text-sm font-medium text-stone-900">{doc.title}</span>
    </Link>
  )
}

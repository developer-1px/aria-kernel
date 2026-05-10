import { Link } from '@tanstack/react-router'
import { LAB_ENTRIES } from './labCatalog'

export function LabIndex() {
  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">실험실 (Lab)</h1>
        <p className="text-sm text-neutral-500">
          공식 site 로 승격하기 전 PoC. ARIA punt 자리를 kernel 이 흡수하는지 검증한다.
        </p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2">
        {LAB_ENTRIES.map((e) => (
          <li key={e.slug}>
            <Link
              to="/lab/$slug"
              params={{ slug: e.slug }}
              className="block rounded border border-neutral-200 p-4 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{e.title}</h2>
                <span
                  className={
                    'rounded px-2 py-0.5 text-xs ' +
                    (e.status === 'Promoted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : e.status === 'Candidate'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-neutral-100 text-neutral-800')
                  }
                >
                  {e.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-600">{e.purpose}</p>
              {e.adoptedBy && e.adoptedBy.length > 0 && (
                <p className="mt-2 text-xs text-neutral-500">
                  적용: {e.adoptedBy.join(', ')}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

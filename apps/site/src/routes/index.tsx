/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { collectPalette, paletteCategory } from '../nav/palette'

function Landing() {
  const router = useRouter()
  const entries = collectPalette(router)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">@interactive-os/aria-kernel</h1>
        <p className="text-base text-neutral-600">
          ARIA-correct headless behavior infra — axes, roving tabindex, gesture/intent split,
          declarative page tree, single resource interface. Visuals via Tailwind. No tokens, no CSS-in-JS.
        </p>
      </header>
      <section aria-labelledby="surfaces-h" className="flex flex-col gap-3">
        <h2 id="surfaces-h" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Verification surfaces
        </h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {entries.map((a) => (
            <li key={a.id}>
              <Link
                to={a.to as never}
                params={a.params as never}
                className="block rounded border border-neutral-200 bg-white p-4 hover:border-neutral-900 hover:shadow-sm"
              >
                <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  {paletteCategory(a)}
                </div>
                <div className="mt-1 text-sm font-medium text-neutral-900">{a.label}</div>
                {a.sub && <div className="mt-1 text-xs text-neutral-500">{a.sub}</div>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export const Route = createFileRoute('/')({
  component: Landing,
})

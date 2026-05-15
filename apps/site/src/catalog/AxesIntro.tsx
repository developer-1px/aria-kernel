import { AXES, PATTERNS, slugForAxis } from './registry.axes'

/**
 * Axes 페이지 첫 진입 = 풀스크린 슬라이드 2장.
 * Slide 1 = 정체성 (axes 가 무엇이며 왜 분리되었는가)
 * Slide 2 = axis × pattern 인덱스
 */
export function AxesIntro() {
  return (
    <>
      <SlideHero />
      <SlideIndex />
    </>
  )
}

function SlideHero() {
  return (
    <section
      id="intro"
      tabIndex={-1}
      className="md:snap-start md:min-h-screen flex items-center bg-gradient-to-b from-white to-stone-50"
    >
      <div className="mx-auto w-full max-w-5xl px-8 py-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
          {AXES.length} axes · {PATTERNS.length} patterns compose them
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-stone-900">Axes</h1>
        <p className="mt-6 max-w-2xl text-2xl leading-relaxed text-stone-600">
          Behavior primitives below patterns.{' '}
          <span className="font-medium text-stone-900">composeAxes(...)</span> stitches them with
          priority + short-circuit — pattern recipes are just compositions.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Pillar
            title="Composable"
            body="Each axis owns one concern (navigate · activate · typeahead · expand …). Stack them with composeAxes."
          />
          <Pillar
            title="Priority + short-circuit"
            body="Earlier axis handles the key first; downstream sees only what's left. Predictable conflict resolution."
          />
          <Pillar
            title="Recipe = composition"
            body="useListboxPattern is composeAxes(navigate, activate, typeahead). Read the source, no magic."
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <code className="rounded-md bg-stone-900 px-3 py-2 text-sm font-mono text-white">
            import {'{ composeAxes, navigate, activate }'} from '@interactive-os/aria-kernel'
          </code>
        </div>

        <div className="mt-16 flex items-center gap-2 text-xs text-stone-400">
          <span>scroll</span>
          <span className="animate-bounce">↓</span>
        </div>
      </div>
    </section>
  )
}

function SlideIndex() {
  return (
    <section
      id="index"
      tabIndex={-1}
      className="md:snap-start md:min-h-screen flex flex-col justify-center bg-white"
    >
      <div className="mx-auto w-full max-w-[1400px] px-8 py-12">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">
          Axis × Pattern coverage.
        </h2>
        <p className="mt-3 max-w-3xl text-lg text-stone-600">
          Every axis lists which pattern recipes call it. Click an axis to jump — left pane lets
          you pick a pattern, right pane shows its raw source.
        </p>

        <div className="mt-8 columns-2 gap-x-8 md:columns-3 lg:columns-4 [&>div]:break-inside-avoid [&>div]:mb-6">
          {AXES.map((entry) => (
            <div key={entry.axis}>
              <a
                href={`#${slugForAxis(entry.axis)}`}
                className="block rounded px-2 py-1 font-mono text-sm font-semibold text-stone-900 hover:bg-stone-200"
              >
                {entry.axis}{' '}
                <span className="text-[10px] text-stone-400">({entry.patterns.length})</span>
              </a>
              <ul className="mt-1 space-y-0.5">
                {entry.patterns.map((p) => (
                  <li key={p.name}>
                    <span className="block px-2 py-0.5 font-mono text-xs text-stone-500">
                      {p.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import {
  APG_KEYBOARD_SPEC,
  IMPL_CHORDS,
  normalizeChord,
  normalizeChordSet,
  PATTERN_APG_WAIVE,
  PATTERN_EXTRA_ALLOW,
  UNIVERSAL_EXTRA,
} from '@interactive-os/aria-kernel'

/**
 * /coverage — APG ↔ axis 3-way SSOT 매트릭스 (EPIC #121).
 *
 * 본 view 는 테스트(apgCoverage.test.ts) 와 동일한 정규화 + allowlist 정책을 적용한다.
 * 정본은 axis 소스 + APG_KEYBOARD_SPEC + apgCoverageAllowlist — 본 컴포넌트는 가공만.
 */

type Cell = '✅' | '❌' | '⚠️' | '🛡' | '·'

const cellFor = (
  chord: string,
  apgSet: Set<string>,
  implSet: Set<string>,
  allow: Set<string>,
  waive: Set<string>,
): Cell => {
  const inApg = apgSet.has(chord)
  const inImpl = implSet.has(chord)
  if (inApg && inImpl) return '✅'
  if (inApg && !inImpl) return waive.has(chord) ? '🛡' : '❌'
  if (!inApg && inImpl) return allow.has(chord) ? '✅' : '⚠️'
  return '·'
}

function CoverageMatrix() {
  const universal = new Set(UNIVERSAL_EXTRA.map(normalizeChord))
  const patterns = Object.keys(APG_KEYBOARD_SPEC).sort()

  // 모든 chord 수집 (정규화 후)
  const allChords = new Set<string>()
  for (const p of patterns) {
    for (const e of APG_KEYBOARD_SPEC[p]) allChords.add(normalizeChord(e.chord))
    const get = IMPL_CHORDS[p]
    if (get) for (const c of normalizeChordSet(get())) allChords.add(c)
  }
  const chords = [...allChords].sort()

  // 카운트 (정책 적용 후 신호만)
  let signalGap = 0
  let signalExtra = 0
  for (const p of patterns) {
    const apgSet = normalizeChordSet(APG_KEYBOARD_SPEC[p].map((e) => e.chord))
    const implSet = normalizeChordSet(IMPL_CHORDS[p]?.() ?? [])
    const allow = new Set([...universal, ...(PATTERN_EXTRA_ALLOW[p] ?? []).map(normalizeChord)])
    const waive = new Set((PATTERN_APG_WAIVE[p] ?? []).map(normalizeChord))
    for (const c of chords) {
      const cell = cellFor(c, apgSet, implSet, allow, waive)
      if (cell === '❌') signalGap++
      if (cell === '⚠️') signalExtra++
    }
  }

  return (
    <div className="p-6 max-w-full overflow-x-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">APG ↔ axis Coverage Matrix</h1>
        <p className="text-sm opacity-70 mt-1">
          ✅ 일치 (또는 의도된 확장) · ❌ 미구현 — 신호 · ⚠️ APG 외 axis advertise — 신호 · 🛡 focusTrap 면제 · · 무관
        </p>
        <p className="text-sm mt-2">
          <strong>{patterns.length}</strong> patterns · <strong>{chords.length}</strong> distinct chords ·{' '}
          <span className="text-red-600">❌ {signalGap}</span> ·{' '}
          <span className="text-yellow-600">⚠️ {signalExtra}</span>
        </p>
      </header>

      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white border px-2 py-1 text-left">pattern</th>
            {chords.map((c) => (
              <th key={c} className="border px-1 py-1 align-bottom">
                <span
                  className="inline-block whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {c}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patterns.map((p) => {
            const apgSet = normalizeChordSet(APG_KEYBOARD_SPEC[p].map((e) => e.chord))
            const implSet = normalizeChordSet(IMPL_CHORDS[p]?.() ?? [])
            const allow = new Set([...universal, ...(PATTERN_EXTRA_ALLOW[p] ?? []).map(normalizeChord)])
            const waive = new Set((PATTERN_APG_WAIVE[p] ?? []).map(normalizeChord))
            return (
              <tr key={p}>
                <th className="sticky left-0 bg-white border px-2 py-1 text-left font-mono">{p}</th>
                {chords.map((c) => {
                  const cell = cellFor(c, apgSet, implSet, allow, waive)
                  const apgEntry = APG_KEYBOARD_SPEC[p].find((e) => normalizeChord(e.chord) === c)
                  return (
                    <td
                      key={c}
                      className="border w-6 text-center"
                      title={apgEntry ? `${c}: ${apgEntry.action}` : c}
                    >
                      {cell === '·' ? '' : cell}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const Route = createFileRoute('/coverage')({
  component: CoverageMatrix,
  staticData: { palette: { label: 'Coverage', to: '/coverage' } },
})

import { fmtChord } from './fmtChord'

interface CommandDescriptor {
  chord: string
  command?: string  // new shape (TreeCommandDescriptor)
  uiEvent?: string  // legacy shape (KeyDescriptor)
  description?: string
}

/** KeymapPanel — chord registry SSOT 표 렌더. clipboard:* 의사 chord 는 표시 제외. */
export function KeymapPanel({ chords, title }: { chords: readonly CommandDescriptor[]; title: string }) {
  const visible = chords.filter((c) => !c.chord.startsWith('clipboard:'))
  return (
    <section className="border-b border-neutral-200 p-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      <table className="w-full text-xs">
        <tbody>
          {visible.map((c, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0">
              <td className="py-1 pr-3 align-top">
                <kbd className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-neutral-700 shadow-[0_1px_0_0_#d6d3d1]">
                  {fmtChord(c.chord)}
                </kbd>
              </td>
              <td className="py-1 pr-3 align-top font-mono text-[11px] text-blue-600">{c.command ?? c.uiEvent}</td>
              <td className="py-1 align-top text-neutral-600">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

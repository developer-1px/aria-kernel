import { useState } from 'react'
import { axisKeys } from '@interactive-os/aria-kernel'
import { switchAxis } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Switch · checkbox input',
  apg: 'switch',
  kind: 'collection' as const,
  blurb: 'Native <input type="checkbox" role="switch"> — UA semantics with switch role.',
  keys: () => axisKeys(switchAxis()),
}

const SETTINGS = [
  { id: 'high-contrast', label: 'High contrast' },
  { id: 'reduce-motion', label: 'Reduce motion' },
]

export default function SwitchCheckboxDemo() {
  const [state, setState] = useState<Record<string, boolean>>({ 'high-contrast': false, 'reduce-motion': true })

  return (
    <fieldset className="rounded-md border border-stone-200 bg-white p-3 text-sm">
      <legend className="px-1 text-xs font-medium text-stone-500">Accessibility</legend>
      <div className="flex flex-col gap-2">
        {SETTINGS.map((s) => (
          <label key={s.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              role="switch"
              checked={state[s.id]}
              onChange={(e) => setState((p) => ({ ...p, [s.id]: e.target.checked }))}
              className="h-4 w-4"
            />
            <span>{s.label}</span>
            <span className="ml-auto text-xs text-stone-500">{state[s.id] ? 'On' : 'Off'}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

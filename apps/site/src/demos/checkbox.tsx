import { useState } from 'react'
import { axisKeys, toggle } from '@p/aria-kernel'
import { checkboxPattern, type CheckboxState } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Checkbox',
  apg: 'checkbox',
  kind: 'collection' as const,
  blurb: 'Two-state checkbox built on a button — toggle with Space.',
  keys: () => axisKeys(toggle),
}

export default function CheckboxDemo() {
  const [checked, setChecked] = useState<CheckboxState>(false)
  const { checkboxProps } = checkboxPattern(checked, (e) => setChecked(e.value), {
    label: 'Subscribe to newsletter',
  })

  return (
    <label className="flex w-fit items-center gap-2 text-sm">
      <button
        {...checkboxProps}
        className="grid h-5 w-5 place-items-center rounded border border-stone-300 bg-white aria-checked:border-stone-900 aria-checked:bg-stone-900 aria-checked:text-white"
      >
        {checked === true ? '✓' : checked === 'mixed' ? '–' : ''}
      </button>
      <span>Subscribe to newsletter</span>
    </label>
  )
}

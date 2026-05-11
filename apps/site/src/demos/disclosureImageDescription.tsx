import { useReducer } from 'react'
import { axisKeys, fromList, isExpanded, reduceWithDefaults } from '@p/aria-kernel'
import { disclosureAxis, disclosurePattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Disclosure · Image Description',
  apg: 'disclosure',
  kind: 'single-value' as const,
  blurb: 'Toggle a long description for an image (alt-text supplement).',
  keys: () => axisKeys(disclosureAxis()),
}

const ID = 'desc'

export default function DisclosureImageDescriptionDemo() {
  const [data, dispatch] = useReducer(reduceWithDefaults, [{ id: ID }], fromList)
  const open = isExpanded(data, ID)
  const { triggerProps, panelProps } = disclosurePattern(data, ID, dispatch)

  return (
    <figure className="w-72 space-y-2">
      <div className="grid h-32 place-items-center rounded-md bg-gradient-to-br from-amber-200 to-rose-200 text-sm font-medium text-stone-700">
        🌅 Sunset
      </div>
      <button
        {...triggerProps}
        className="text-xs text-stone-600 underline-offset-4 hover:underline"
      >
        {open ? 'Hide description' : 'Show description'}
      </button>
      <figcaption {...panelProps} className="text-xs text-stone-600">
        A panoramic view of a coastal sunset, with warm amber tones blending into rose-pink across
        the sky and reflecting on the calm sea.
      </figcaption>
    </figure>
  )
}

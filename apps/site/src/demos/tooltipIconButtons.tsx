import { tooltipKeys, useTooltipPattern } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Tooltip · Icon Buttons',
  apg: 'tooltip',
  kind: 'overlay' as const,
  blurb: 'Icon-only buttons whose labels surface on hover or focus.',
  keys: () => tooltipKeys(),
}

const ACTIONS: { id: string; icon: string; label: string }[] = [
  { id: 'bold', icon: 'B', label: 'Bold (Ctrl+B)' },
  { id: 'italic', icon: 'I', label: 'Italic (Ctrl+I)' },
  { id: 'link', icon: '🔗', label: 'Insert link (Ctrl+K)' },
  { id: 'image', icon: '🖼️', label: 'Insert image' },
]

function IconAction({ icon, label }: { icon: string; label: string }) {
  const { open, triggerProps, tipProps } = useTooltipPattern({
    delayShow: 600,
    delayHide: 100,
  })
  return (
    <span className="relative">
      <button
        {...triggerProps}
        aria-label={label}
        className="grid h-9 w-9 place-items-center rounded-md border border-stone-300 bg-white text-sm hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
      >
        {icon}
      </button>
      {open && (
        <span
          {...tipProps}
          className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-xs text-white shadow"
        >
          {label}
        </span>
      )}
    </span>
  )
}

export default function TooltipIconButtonsDemo() {
  return (
    <div className="flex gap-1 rounded-md border border-stone-200 bg-white p-1">
      {ACTIONS.map((a) => (
        <IconAction key={a.id} icon={a.icon} label={a.label} />
      ))}
    </div>
  )
}

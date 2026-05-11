import { axisKeys } from '@p/aria-kernel'
import { toolbarAxis, useToolbarPattern, useToolbarReducer } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Toolbar · Mixed Items',
  apg: 'toolbar',
  kind: 'collection' as const,
  blurb: 'Toggle, radios, menu button, spinbutton, checkbox, and link share one toolbar.',
  keys: () => axisKeys(toolbarAxis()),
}

const ITEMS = [
  { id: 'bold', label: 'B', itemRole: 'toggle', pressed: true },
  { id: 'italic', label: 'I', itemRole: 'toggle', pressed: false },
  { id: 'sep1', label: '', separator: true },
  { id: 'align-left', label: '⫷', itemRole: 'radio', pressed: true },
  { id: 'align-center', label: '⊟', itemRole: 'radio', pressed: false },
  { id: 'align-right', label: '⫸', itemRole: 'radio', pressed: false },
  { id: 'sep2', label: '', separator: true },
  { id: 'format', label: 'Format ▾', itemRole: 'menubutton', expanded: false },
  { id: 'fontsize', label: '14', itemRole: 'spinbutton', value: 14, min: 8, max: 72 },
  { id: 'sep3', label: '', separator: true },
  { id: 'visible', label: 'Visible', itemRole: 'checkbox', pressed: true },
  { id: 'help', label: 'Help', itemRole: 'link', href: '#help' },
]

export default function ToolbarMixedDemo() {
  const [data, dispatch] = useToolbarReducer(ITEMS)
  const { rootProps, toolbarItemProps, items } = useToolbarPattern(data, dispatch, {
    label: 'Editor toolbar',
  })

  return (
    <div
      {...rootProps}
      className="flex w-fit items-center gap-1 rounded-md border border-stone-200 bg-white p-1 text-sm"
    >
      {items.map((item) => {
        const ent = data.entities[item.id] ?? {}
        const role = ent.itemRole as string | undefined
        if (item.separator) {
          return (
            <span
              key={item.id}
              {...toolbarItemProps(item.id)}
              aria-orientation="vertical"
              className="mx-0.5 h-5 w-px bg-stone-200"
            />
          )
        }
        if (role === 'link') {
          return (
            <a
              key={item.id}
              href={ent.href as string}
              {...toolbarItemProps(item.id)}
              className="rounded px-2 py-1 text-stone-600 underline-offset-4 hover:underline"
            >
              {item.label}
            </a>
          )
        }
        return (
          <button
            key={item.id}
            type="button"
            {...toolbarItemProps(item.id)}
            className="rounded px-2 py-1 [&:not([aria-pressed=true])]:[&:not([aria-checked=true])]:hover:bg-stone-200 aria-pressed:bg-stone-900 aria-pressed:text-white aria-checked:bg-stone-900 aria-checked:text-white"
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

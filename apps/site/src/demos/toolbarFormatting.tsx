import { useId, useMemo, useState } from 'react'
import type React from 'react'
import { fromList, type UiEvent, axisKeys } from '@p/aria-kernel'
import { toolbarAxis, useToolbarPattern, useMenuPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Toolbar · APG Editor Example',
  apg: 'toolbar',
  kind: 'collection' as const,
  blurb: 'W3C APG toolbar example — toggles, radio group, disabled buttons, font menu, spinbutton, checkbox, link, all driving a live textarea.',
  keys: () => axisKeys(toolbarAxis()),
  wide: true,
}

const FONTS = [
  { id: 'sans-serif', label: 'Sans-serif' },
  { id: 'serif', label: 'Serif' },
  { id: 'monospace', label: 'Monospace' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'cursive', label: 'Cursive' },
] as const
type FontId = typeof FONTS[number]['id']

const ALIGN_IDS = ['align-left', 'align-center', 'align-right'] as const
type AlignId = typeof ALIGN_IDS[number]

export default function ToolbarFormattingDemo() {
  const taId = useId()

  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [underline, setUnderline] = useState(false)
  const [align, setAlign] = useState<AlignId>('align-left')
  const [font, setFont] = useState<FontId>('sans-serif')
  const [size, setSize] = useState(14)
  const [night, setNight] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)

  // Font menu — useMenuPattern 자체 open state 소유.
  const fontMenuData = useMemo(
    () => fromList(FONTS.map((f) => ({ id: f.id, label: f.label, kind: 'menuitemradio', checked: font === f.id }))),
    [font],
  )
  const menu = useMenuPattern(fontMenuData, (e) => {
    if (e.type === 'check' && e.to && e.ids.length === 1) {
      setFont(e.ids[0] as FontId)
      menu.setOpen(false)
    }
  }, { label: 'Font Family', autoFocus: true })

  const items = useMemo(() => [
    { id: 'bold', label: 'B', itemRole: 'toggle', pressed: bold, title: 'Bold' },
    { id: 'italic', label: 'I', itemRole: 'toggle', pressed: italic, title: 'Italic' },
    { id: 'underline', label: 'U', itemRole: 'toggle', pressed: underline, title: 'Underline' },
    { id: 'sep1', separator: true },
    { id: 'align-left', label: '⫷', itemRole: 'radio', pressed: align === 'align-left', title: 'Text Align Left' },
    { id: 'align-center', label: '☰', itemRole: 'radio', pressed: align === 'align-center', title: 'Text Align Center' },
    { id: 'align-right', label: '⫸', itemRole: 'radio', pressed: align === 'align-right', title: 'Text Align Right' },
    { id: 'sep2', separator: true },
    { id: 'copy', label: 'Copy', itemRole: 'button', disabled: true },
    { id: 'paste', label: 'Paste', itemRole: 'button', disabled: true },
    { id: 'cut', label: 'Cut', itemRole: 'button', disabled: true },
    { id: 'sep3', separator: true },
    { id: 'font', label: 'Font', itemRole: 'menubutton', expanded: menu.open },
    { id: 'sep4', separator: true },
    { id: 'size-dec', label: '▼', itemRole: 'button', title: 'Decrease font size' },
    { id: 'size-val', label: `${size}pt`, itemRole: 'spinbutton', value: size, min: 8, max: 40 },
    { id: 'size-inc', label: '▲', itemRole: 'button', title: 'Increase font size' },
    { id: 'sep5', separator: true },
    { id: 'night', label: 'Night Mode', itemRole: 'checkbox', pressed: night },
    { id: 'help', label: 'Help', itemRole: 'link', href: '#help' },
  ], [bold, italic, underline, align, size, night, menu.open])

  const toolbarData = useMemo(() => {
    const d = fromList(items)
    if (focusId) d.meta = { ...d.meta, focus: focusId }
    return d
  }, [items, focusId])

  const handleToolbar = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) return setFocusId(e.id)
    if (e.type !== 'activate') return
    switch (e.id) {
      case 'bold':      return setBold((v) => !v)
      case 'italic':    return setItalic((v) => !v)
      case 'underline': return setUnderline((v) => !v)
      case 'align-left':
      case 'align-center':
      case 'align-right':
        return setAlign(e.id)
      case 'night':     return setNight((v) => !v)
      case 'font':      return menu.setOpen(!menu.open)
      case 'size-inc':  return setSize((v) => Math.min(40, v + 1))
      case 'size-dec':  return setSize((v) => Math.max(8, v - 1))
    }
  }

  const focusedId = (e: KeyboardEvent | Event): string | null =>
    (e.target as HTMLElement | null)?.getAttribute?.('data-id') ?? null
  const isSizeItem = (id: string | null) => id === 'size-val' || id === 'size-inc' || id === 'size-dec'
  const isAlignItem = (id: string | null): id is AlignId =>
    !!id && (ALIGN_IDS as readonly string[]).includes(id)

  const { rootProps, toolbarItemProps } = useToolbarPattern(toolbarData, handleToolbar, {
    label: 'Text Formatting',
    on: {
      ArrowDown: (e, original) => {
        const id = focusedId(e)
        if (id === 'font') { e.preventDefault(); menu.setOpen(true); return }
        if (isSizeItem(id)) { e.preventDefault(); setSize((v) => Math.max(8, v - 1)); return }
        if (isAlignItem(id)) {
          e.preventDefault()
          const next = ALIGN_IDS[(ALIGN_IDS.indexOf(id) + 1) % ALIGN_IDS.length]
          setAlign(next); setFocusId(next); return
        }
        original()
      },
      ArrowUp: (e, original) => {
        const id = focusedId(e)
        if (isSizeItem(id)) { e.preventDefault(); setSize((v) => Math.min(40, v + 1)); return }
        if (isAlignItem(id)) {
          e.preventDefault()
          const next = ALIGN_IDS[(ALIGN_IDS.indexOf(id) - 1 + ALIGN_IDS.length) % ALIGN_IDS.length]
          setAlign(next); setFocusId(next); return
        }
        original()
      },
      PageUp: (e) => {
        if (!isSizeItem(focusedId(e))) return
        e.preventDefault(); setSize((v) => Math.min(40, v + 5))
      },
      PageDown: (e) => {
        if (!isSizeItem(focusedId(e))) return
        e.preventDefault(); setSize((v) => Math.max(8, v - 5))
      },
    },
  })

  // 합성 ref — toolbar bindFocus + menu triggerRef. Escape close 시 자동 focus 복귀 위해.
  const composeRef = (...refs: Array<React.Ref<HTMLElement> | undefined>) => (el: HTMLElement | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(el)
      else if (r && typeof r === 'object') (r as React.MutableRefObject<HTMLElement | null>).current = el
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          {...rootProps}
          aria-controls={taId}
          className="flex w-full items-stretch gap-1 overflow-x-auto whitespace-nowrap rounded-md border-2 border-stone-200 bg-white p-1 text-sm focus-within:border-stone-900"
        >
          {items.map((item) => {
            if (item.separator) {
              return (
                <span
                  key={item.id}
                  {...toolbarItemProps(item.id)}
                  aria-orientation="vertical"
                  className="mx-0.5 my-1 w-px bg-stone-200"
                />
              )
            }
            const role = item.itemRole as string
            if (role === 'link') {
              return (
                <a
                  key={item.id}
                  href={(item as { href?: string }).href}
                  {...toolbarItemProps(item.id)}
                  className="rounded px-2 py-1 text-stone-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-stone-900"
                >
                  {item.label}
                </a>
              )
            }
            const label = role === 'menubutton'
              ? FONTS.find((f) => f.id === font)?.label ?? 'Font'
              : item.label
            const ariaLabel = role === 'menubutton'
              ? `Font: ${label}`
              : (item as { title?: string }).title
            const tProps = toolbarItemProps(item.id)
            const ref = role === 'menubutton'
              ? composeRef((tProps as { ref?: React.Ref<HTMLElement> }).ref as React.Ref<HTMLElement>, (menu.buttonProps as { ref?: React.Ref<HTMLElement> }).ref as React.Ref<HTMLElement>) as React.Ref<HTMLButtonElement>
              : (tProps as { ref?: React.Ref<HTMLButtonElement> }).ref
            return (
              <button
                key={item.id}
                type="button"
                aria-label={ariaLabel}
                {...tProps}
                ref={ref}
                className="min-w-[1.75rem] rounded px-2 py-1 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-stone-900 aria-disabled:opacity-40 aria-disabled:cursor-not-allowed aria-pressed:bg-stone-900 aria-pressed:text-white aria-checked:bg-stone-900 aria-checked:text-white"
              >
                {label}
              </button>
            )
          })}
        </div>

        {menu.open && (
          <ul
            {...menu.rootProps}
            className="absolute left-0 top-full z-10 mt-1 min-w-[10rem] rounded-md border border-stone-200 bg-white p-1 shadow-md"
          >
            {menu.items.map((mi) => (
              <li
                key={mi.id}
                {...menu.menuitemProps(mi.id)}
                style={{ fontFamily: mi.id }}
                className="cursor-pointer rounded px-3 py-1 hover:bg-stone-100 aria-checked:bg-stone-900 aria-checked:text-white focus:outline-2 focus:outline-stone-900"
              >
                {mi.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <label htmlFor={taId} className="sr-only">Text Sample</label>
      <textarea
        id={taId}
        rows={10}
        style={{
          fontFamily: font,
          fontWeight: bold ? 'bold' : 'normal',
          fontStyle: italic ? 'italic' : 'normal',
          textDecoration: underline ? 'underline' : 'none',
          textAlign: align === 'align-left' ? 'left' : align === 'align-center' ? 'center' : 'right',
          fontSize: `${size}pt`,
          backgroundColor: night ? '#1c1917' : '#ffffff',
          color: night ? '#fafaf9' : '#1c1917',
        }}
        className="w-full rounded-md border border-stone-200 p-3 outline-none focus-visible:border-stone-900"
        defaultValue={`Abraham Lincoln's Gettysburg Address\n\nFour score and seven years ago our fathers brought forth on this continent a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.`}
      />
    </div>
  )
}

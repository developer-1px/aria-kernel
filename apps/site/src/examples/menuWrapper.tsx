/* eslint-disable react-refresh/only-export-components */
import { useReducer } from 'react'
import { reduceWithDefaults, type NormalizedData } from '@p/aria-kernel'
import { Menu, type MenuSlots, menuWrapperKeys } from './_menuWrapper'
import type { SlotProps } from '../catalog/slots'

interface MenuItem extends Record<string, unknown> {
  label: string
  icon?: string
  shortcut?: string
  kind?: 'menuitem' | 'separator'
  disabled?: boolean
}

const initialData: NormalizedData = {
  entities: {
    new:           { label: 'New file',    icon: '+', shortcut: '⌘N' } satisfies MenuItem,
    open:          { label: 'Open…',       icon: '↑', shortcut: '⌘O' } satisfies MenuItem,
    'open-recent': { label: 'Open recent', icon: '⏱' } satisfies MenuItem,
    'recent-1':    { label: 'project.tsx' } satisfies MenuItem,
    'recent-2':    { label: 'README.md' } satisfies MenuItem,
    'recent-3':    { label: 'package.json' } satisfies MenuItem,
    'sep-1':       { label: '', kind: 'separator', disabled: true } satisfies MenuItem,
    save:          { label: 'Save',     icon: '💾', shortcut: '⌘S' } satisfies MenuItem,
    'save-as':     { label: 'Save as…', shortcut: '⇧⌘S' } satisfies MenuItem,
    export:        { label: 'Export',   icon: '↗' } satisfies MenuItem,
    'export-pdf':  { label: 'PDF' } satisfies MenuItem,
    'export-png':  { label: 'PNG' } satisfies MenuItem,
    'export-html': { label: 'HTML' } satisfies MenuItem,
    'sep-2':       { label: '', kind: 'separator', disabled: true } satisfies MenuItem,
    close:         { label: 'Close', icon: '✕', shortcut: '⌘W' } satisfies MenuItem,
  },
  relationships: {
    'open-recent': ['recent-1', 'recent-2', 'recent-3'],
    export: ['export-pdf', 'export-png', 'export-html'],
  },
  meta: {
    root: ['new', 'open', 'open-recent', 'sep-1', 'save', 'save-as', 'export', 'sep-2', 'close'],
  },
}

const slots: MenuSlots<MenuItem> = {
  icon: ({ data }: SlotProps<MenuItem>) =>
    typeof data.icon === 'string' ? data.icon : null,
  shortcut: ({ data }: SlotProps<MenuItem>) =>
    typeof data.shortcut === 'string' ? data.shortcut : null,
}

export const meta = {
  title: 'Menu Wrapper',
  apg: 'menu',
  blurb:
    'A reusable file menu with nested choices, separators, shortcuts, and close behavior built in.',
  keys: menuWrapperKeys,
}

export default function MenuWrapperDemo() {
  const [data, onEvent] = useReducer(reduceWithDefaults, undefined, () => initialData)

  return <Menu aria-label="File" data={data} onEvent={onEvent} slots={slots as MenuSlots} />
}

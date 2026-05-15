/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import type { NormalizedData } from '@interactive-os/aria-kernel'
import { Nav, navigationListWrapperKeys } from './_navigationListWrapper'

const buildData = (currentId: string): NormalizedData => ({
  entities: {
    Surfaces: { label: 'Surfaces' },
    Apps: { label: 'Apps' },
    home: { label: 'Home', href: '#home', current: currentId === 'home' },
    docs: { label: 'Docs', href: '#docs', current: currentId === 'docs' },
    kanban: { label: 'Kanban', href: '#kanban', current: currentId === 'kanban' },
    outliner: { label: 'Outliner', href: '#outliner', current: currentId === 'outliner' },
  },
  relationships: {
    Surfaces: ['home', 'docs'],
    Apps: ['kanban', 'outliner'],
  },
  meta: { root: ['Surfaces', 'Apps'] },
})

export const meta = {
  title: 'NavigationList Wrapper',
  apg: 'navigationList',
  blurb:
    'A `<nav>` landmark with grouped links. `aria-current="page"` follows the host route, click emits `activate` for the host to navigate.',
  keys: navigationListWrapperKeys,
}

export default function NavigationListWrapperDemo() {
  const [currentId, setCurrentId] = useState('home')
  return (
    <Nav
      aria-label="Demo navigation"
      data={buildData(currentId)}
      onEvent={(e) => {
        if (e.type === 'activate') setCurrentId(e.id)
      }}
    />
  )
}

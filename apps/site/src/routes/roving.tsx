import { createFileRoute } from '@tanstack/react-router'
import src from '@p/aria-kernel/roving/index.ts?raw'
import { ExportList } from '../catalog/ExportList'

export const Route = createFileRoute('/roving')({
  component: () => (
    <ExportList
      title="Roving"
      sub="W3C APG 관계 그래프 기반 1 tab stop roving. 좌표 기반은 useSpatialNavigation."
      src={src}
    />
  ),
  staticData: {
    palette: {
      label: 'Roving',
      to: '/roving',
      sub: 'useRovingTabIndex · useSpatialNavigation · useActiveDescendant',
    },
  },
})

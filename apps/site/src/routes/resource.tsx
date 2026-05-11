import { createFileRoute } from '@tanstack/react-router'
import src from '@p/resource/index.ts?raw'
import { ExportList } from '../catalog/ExportList'

export const Route = createFileRoute('/resource')({
  component: () => (
    <ExportList
      title="Resource"
      sub="@p/resource — 외부 state management 어댑터(옵션). cross-widget shared state · async fetch · UiEvent ↔ CRUD bridge. aria-kernel 정체성 밖."
      src={src}
    />
  ),
  staticData: {
    palette: {
      label: 'Resource',
      to: '/resource',
      sub: 'useResource · defineResource · useFeature · routeUiEventToCrud',
    },
  },
})

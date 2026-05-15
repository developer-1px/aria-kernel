import { createFileRoute } from '@tanstack/react-router'
import src from '@interactive-os/aria-kernel/key/index.ts?raw'
import { ExportList } from '../catalog/ExportList'

export const Route = createFileRoute('/key')({
  component: () => (
    <ExportList
      title="Key"
      sub="chord 정규화 + shortcut binding + insideEditable gating. UiEvent transport 의 keyboard 자리."
      src={src}
    />
  ),
  staticData: {
    palette: {
      label: 'Key',
      to: '/key',
      sub: 'useShortcut · bindGlobalKeyMap · useKeyMap · routeInsideEditable',
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import src from '@interactive-os/aria-kernel/gesture/index.ts?raw'
import { ExportList } from '../catalog/ExportList'

export const Route = createFileRoute('/gesture')({
  component: () => (
    <ExportList
      title="Gesture"
      sub="제스처(activate) → 의도(navigate · expand · select) 이벤트 분해 헬퍼. 키보드 axes 와 대칭."
      src={src}
    />
  ),
  staticData: {
    palette: {
      label: 'Gesture',
      to: '/gesture',
      sub: 'composeGestures · navigateOnActivate · selectionFollowsFocus · expandBranchOnActivate',
    },
  },
})

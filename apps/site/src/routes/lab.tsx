import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/lab')({
  component: () => <Outlet />,
  staticData: {
    palette: {
      label: 'Lab',
      to: '/lab',
      sub: '실험실 — ARIA punt 자리 흡수 PoC',
    },
  },
})

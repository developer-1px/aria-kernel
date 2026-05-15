import '@oddbird/popover-polyfill'
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

// devtools overlay 는 DEV 에서만 lazy 로드.
const Devtools = import.meta.env.DEV
  ? lazy(() => import('@interactive-os/devtools').then((m) => ({
      default: () => <m.ReproRecorderOverlay />,
    })))
  : null

const loadAppsLayer = async () => {
  const [
    { setFinderNav },
  ] = await Promise.all([
    import('@apps/finder'),
  ])
  setFinderNav((splat) => {
    void router.navigate({ to: '/apps/finder/$', params: { _splat: splat } })
  })
}

const idle = (cb: () => void) => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
  if (ric) ric(cb)
  else setTimeout(cb, 0)
}
idle(() => { void loadAppsLayer() })

if (import.meta.env.DEV) {
  import('@interactive-os/devtools/guides')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    {Devtools && (
      <Suspense fallback={null}>
        <Devtools />
      </Suspense>
    )}
  </StrictMode>,
)

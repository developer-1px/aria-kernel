import type { RootProps } from './types'

/**
 * alert — ARIA `alert` role.
 * https://www.w3.org/TR/wai-aria-1.2/#alert
 *
 * 즉시 announce. live region 자동 (role=alert 가 aria-live=assertive 묵시).
 */
export function alertPattern(): { rootProps: RootProps } {
  return { rootProps: { role: 'alert' } as RootProps }
}


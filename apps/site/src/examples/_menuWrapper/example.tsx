import { activate, axisKeys, composeAxes, navigate } from '@interactive-os/aria-kernel'

/**
 * menuWrapperKeys — 이 wrapper 가 직렬 박제하는 키 매핑 (SSOT).
 * axis.chords 가 정본 — composeAxes 가 chord union 자동 합성.
 */
export const menuWrapperKeys = () =>
  [...axisKeys(composeAxes(navigate('vertical'), activate)), 'A-Z']

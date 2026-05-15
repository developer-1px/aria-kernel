import { activate, axisKeys, composeAxes, treeExpand, treeNavigate } from '@interactive-os/aria-kernel'

/**
 * treeWrapperKeys — 이 wrapper 가 직렬 박제하는 키 매핑 (SSOT).
 * axis.chords 가 정본 — composeAxes 가 chord union 자동 합성.
 */
export const treeWrapperKeys = () =>
  [...axisKeys(composeAxes(treeNavigate, treeExpand, activate)), 'A-Z']

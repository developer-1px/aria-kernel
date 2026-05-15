import { isEditableTarget } from '@interactive-os/keyboard'

export type InsideEditableMode = 'forward' | 'native' | 'preventDefault'

export type RouterDecision = 'emit' | 'skip' | 'emit-prevent'

export const isEditable = isEditableTarget

/**
 * activeElement 가 editable 인지 + mode 에 따라 router decision 반환.
 *
 * - 'forward' (default) : input 안이어도 emit, native 안 막음
 * - 'native'            : input 안이면 'skip' (native 만 동작)
 * - 'preventDefault'    : 항상 emit + native 막음
 *
 * input 밖이면 mode 무관 'emit-prevent'.
 */
export const routeInsideEditable = (
  activeElement: EventTarget | Event | null,
  mode: InsideEditableMode = 'forward',
): RouterDecision => {
  if (!isEditableTarget(activeElement)) return 'emit-prevent'
  if (mode === 'forward') return 'emit'
  if (mode === 'native') return 'skip'
  return 'emit-prevent'
}

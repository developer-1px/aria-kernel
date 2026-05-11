/**
 * insideEditable — activeElement editable 여부 + mode 분기 router.
 *
 * 패턴 hook 이 clipboard event / 단축키 처리 직전 호출하여
 * native 입력 컨텍스트를 침범하지 않고 emit 여부를 결정한다.
 */

export type InsideEditableMode = 'forward' | 'native' | 'preventDefault'

export type RouterDecision = 'emit' | 'skip' | 'emit-prevent'

const TEXTUAL_INPUT_TYPES = new Set([
  'text', 'search', 'email', 'password', 'url', 'tel', 'number',
])

export const isEditable = (el: Element | null): boolean => {
  if (!el) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLSelectElement) return true
  if (el instanceof HTMLInputElement) {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase()
    return TEXTUAL_INPUT_TYPES.has(type)
  }
  if (el instanceof HTMLElement && el.isContentEditable) return true
  return false
}

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
  activeElement: Element | null,
  mode: InsideEditableMode = 'forward',
): RouterDecision => {
  if (!isEditable(activeElement)) return 'emit-prevent'
  if (mode === 'forward') return 'emit'
  if (mode === 'native') return 'skip'
  return 'emit-prevent'
}

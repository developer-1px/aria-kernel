import { useEffect } from 'react'
import { isEditableTarget, matches, parseShortcut } from '@interactive-os/keyboard'

/**
 * shortcut — global shortcut binding over `@interactive-os/keyboard`.
 *
 * 우선순위 규약 (focus ⊃ global):
 *  1) 포커스된 컴포넌트의 onKeyDown 이 먼저 버블. e.preventDefault() 로 global 을 덮어쓸 수 있다.
 *  2) editable(input/textarea/contenteditable) 안에서 modifier 없는 단축키는 타이핑을 탈취하지 않는다.
 *  3) 위 두 가드를 통과하면 global 핸들러 발동.
 */

const hasModifier = (spec: string): boolean =>
  parseShortcut(spec).some((shortcut) => shortcut.meta || shortcut.control || shortcut.alt)

/**
 * onShortcut — window 'keydown' 에 단축키 spec 을 등록. 해제 함수 반환.
 * React 외부(vanilla/effect) 에서 사용. React 컴포넌트는 {@link useShortcut} 를 쓴다.
 *
 * @param spec - `Mod+k` 같은 shortcut notation.
 * @param handler - 매치 시 호출 (preventDefault 자동)
 * @returns 해제 함수
 */
export function onShortcut(spec: string, handler: (e: KeyboardEvent) => void): () => void {
  const modified = hasModifier(spec)
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return                              // (1) 로컬 override
    if (!modified && isEditableTarget(e.target)) return         // (2) 편집 중 단일 키 탈취 금지
    if (!matches(e, spec)) return
    e.preventDefault()
    handler(e)
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

/**
 * useShortcut — `Mod+k` 같은 표기를 받아 글로벌 단축키 등록. 단발 keydown 처리.
 *
 * 우선순위: 포커스된 컴포넌트 onKeyDown 이 먼저 (e.preventDefault 로 override 가능),
 * editable 안에선 modifier 없는 단일 키 탈취 X.
 *
 * @param spec - "Mod+k" / "Shift+/" / "Escape" 등.
 * @param handler - 매치 시 호출
 *
 * @example
 * useShortcut('Mod+k', () => openCommandPalette())
 */
export function useShortcut(spec: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => onShortcut(spec, handler), [spec, handler])
}

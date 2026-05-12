import { useEffect } from 'react'

/**
 * shortcut — 글로벌 단축키 de facto 표준(tinykeys 스타일) 수렴.
 * "mod+k" 의 mod 는 mac=Meta, 그 외=Ctrl 자동. "+" 로 모디파이어 결합.
 * 토큰: mod | meta | ctrl | alt | shift | <key>  (대소문자 무시, key 는 e.key 매칭)
 *
 * 우선순위 규약 (focus ⊃ global):
 *  1) 포커스된 컴포넌트의 onKeyDown 이 먼저 버블. e.preventDefault() 로 global 을 덮어쓸 수 있다.
 *  2) editable(input/textarea/contenteditable) 안에서 modifier 없는 단축키는 타이핑을 탈취하지 않는다.
 *  3) 위 두 가드를 통과하면 global 핸들러 발동.
 */

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|od|ad)/.test(navigator.platform)

type Parsed = { key: string; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean }

const parse = (spec: string): Parsed => {
  // 모디파이어는 트림(가독성), 마지막 segment(=key)는 preserve — KeyboardEvent.key
  // 표준값(' ', 'Enter', 'ArrowRight', '+', 등)을 손실 없이 그대로 매칭하려면 트림 X.
  const parts = spec.split('+')
  const flags = { meta: false, ctrl: false, alt: false, shift: false }
  let key = ''
  parts.forEach((raw, i) => {
    const isLast = i === parts.length - 1
    const p = raw.trim().toLowerCase()
    if (!isLast && p === 'mod') { if (isMac) flags.meta = true; else flags.ctrl = true }
    else if (!isLast && p in flags) flags[p as keyof typeof flags] = true
    else key = raw.toLowerCase()
  })
  return { key, ...flags }
}

const match = (e: KeyboardEvent, s: Parsed): boolean =>
  (e.key.toLowerCase() === s.key || e.code.toLowerCase() === s.key) &&
  e.metaKey === s.meta && e.ctrlKey === s.ctrl &&
  e.altKey === s.alt && e.shiftKey === s.shift

const hasModifier = (s: Parsed): boolean => s.meta || s.ctrl || s.alt
const isEditable = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * onShortcut — window 'keydown' 에 단축키 spec 을 등록. 해제 함수 반환.
 * React 외부(vanilla/effect) 에서 사용. React 컴포넌트는 {@link useShortcut} 를 쓴다.
 *
 * @param spec - "mod+k" 같은 표기. mod = mac:Meta / 그 외:Ctrl
 * @param handler - 매치 시 호출 (preventDefault 자동)
 * @returns 해제 함수
 */
export function onShortcut(spec: string, handler: (e: KeyboardEvent) => void): () => void {
  const parsed = parse(spec)
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return                              // (1) 로컬 override
    if (!hasModifier(parsed) && isEditable(e.target)) return    // (2) 편집 중 단일 키 탈취 금지
    if (!match(e, parsed)) return
    e.preventDefault()
    handler(e)
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

/**
 * useShortcut — `mod+k` 같은 표기를 받아 글로벌 단축키 등록. 단발 keydown 처리.
 *
 * 우선순위: 포커스된 컴포넌트 onKeyDown 이 먼저 (e.preventDefault 로 override 가능),
 * editable 안에선 modifier 없는 단일 키 탈취 X.
 *
 * @param spec - "mod+k" / "shift+/" / "Escape" 등 (mod = mac:Meta / 그 외:Ctrl)
 * @param handler - 매치 시 호출
 *
 * @example
 * useShortcut('mod+k', () => openCommandPalette())
 */
export function useShortcut(spec: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => onShortcut(spec, handler), [spec, handler])
}

/**
 * usePatternClipboard — tree/listbox 등 컬렉션 패턴이 공유하는
 * clipboard event handler + clipboard/history chord 라우터 + `on` 미들웨어.
 *
 * 책임:
 *  1) onCopy/onCut/onPaste rootProps 핸들러 — routeInsideEditable 통과 후 UiEvent emit.
 *  2) handleKeyDown — builtin chord(undo/redo/delete/paste-child) 매칭 + emit.
 *  3) `on` 미들웨어 — user 가 chord 별 wrapper 등록. default win 정책:
 *     userFn(event, originalFn) 형태로 default 를 wrap. user 가 originalFn 호출 여부 결정.
 *     chord 가 builtin 에 없으면 originalFn = noop.
 *
 * pattern 별 edit-mode chord(Enter/Tab/Shift+Tab) 는 패턴 내부에 둔다 — 컨텍스트(findParent 등) 의존.
 */
import type React from 'react'
import { matches } from '@interactive-os/keyboard'
import type { UiEvent } from '../../intent/events'
import { routeInsideEditable, isEditable, type InsideEditableMode } from '../../key/insideEditable'
import type { KeyDescriptor } from '../../patterns/types'

/**
 * 패턴 hook 들이 자기 args 에 펼쳐 받아 usePatternClipboard 로 전달하는 슬롯 묶음.
 * 라이브러리 default(JSON ↔ application/json + text/plain) 가 있고,
 * grid/richtext 처럼 TSV/HTML 이 필요한 패턴은 toClipboard 만 override.
 */
export interface ClipboardSerializerOptions {
  serialize?: (id: string) => unknown
  toClipboard?: (payload: unknown) => Record<string, string>
  fromClipboard?: (data: DataTransfer) => unknown
}

export type ClipboardOnMiddleware = Record<
  string,
  (event: Event, originalFn: () => void) => void
>

export interface UsePatternClipboardArgs {
  onEvent?: (e: UiEvent) => void
  activeId: string | null
  insideEditable?: InsideEditableMode
  /**
   * 사용자 custom chord 등록. key + mouse 통합.
   * default 와 충돌 시: userFn(event, originalFn) 으로 wrap — originalFn 호출 여부로 default 실행 결정.
   * default 없는 chord 면 originalFn = noop.
   */
  on?: ClipboardOnMiddleware
  /** 패턴이 자기 builtin chord 목록 주입 — descriptor 기반 라우팅 */
  builtinChords?: readonly KeyDescriptor[]
  /**
   * tree 처럼 패턴이 자체 commands 로 chord dispatch 를 흡수했을 때 true.
   * DEFAULT_CHORDS 비활성, 'on' middleware 만 작동 (default 없이 user chord 만 처리).
   */
  disableBuiltinChords?: boolean
  /**
   * id → 직렬화 payload. 미지정 시 setData/getData 를 건드리지 않고 emit-only 동작.
   * 지정하면 copy/cut 시 toClipboard(serialize(id)) 결과를 DataTransfer.setData 로 write.
   */
  serialize?: (id: string) => unknown
  /**
   * payload → mime → text. 기본: { 'application/json': JSON.stringify, 'text/plain': JSON.stringify }.
   * serialize 가 지정되었을 때만 호출.
   */
  toClipboard?: (payload: unknown) => Record<string, string>
  /**
   * DataTransfer → payload. 기본: 'application/json' JSON.parse → 실패 시 'text/plain' raw.
   * paste UiEvent 의 payload 필드로 전달.
   */
  fromClipboard?: (data: DataTransfer) => unknown
}

const DEFAULT_TO_CLIPBOARD = (payload: unknown): Record<string, string> => {
  const json = JSON.stringify(payload)
  return { 'application/json': json, 'text/plain': json }
}

const DEFAULT_FROM_CLIPBOARD = (data: DataTransfer): unknown => {
  const json = data.getData('application/json')
  if (json) {
    try { return JSON.parse(json) } catch { /* fall through */ }
  }
  const text = data.getData('text/plain')
  if (!text) return undefined
  try { return JSON.parse(text) } catch { return text }
}

export interface UsePatternClipboardReturn {
  onCopy: (e: React.ClipboardEvent) => void
  onCut: (e: React.ClipboardEvent) => void
  onPaste: (e: React.ClipboardEvent) => void
  /** 패턴의 onKeyDown chain 끝에 호출. */
  handleKeyDown: (e: React.KeyboardEvent) => void
}

/**
 * 디폴트로 emit 하는 chord → UiEvent 빌더 매핑.
 * activeId 가 필요한 경우 null 이면 default action skip(미들웨어는 여전히 실행).
 */
type DefaultBuilder = (activeId: string | null) => UiEvent | null

const DEFAULT_CHORDS: ReadonlyArray<{ chord: string; build: DefaultBuilder }> = [
  { chord: 'mod+z',       build: () => ({ type: 'undo' }) },
  { chord: 'mod+shift+z', build: () => ({ type: 'redo' }) },
  { chord: 'mod+y',       build: () => ({ type: 'redo' }) },
  { chord: 'Backspace',   build: (id) => (id ? { type: 'remove', id } : null) },
  { chord: 'Delete',      build: (id) => (id ? { type: 'remove', id } : null) },
  { chord: 'mod+shift+v', build: (id) => (id ? { type: 'paste', targetId: id, mode: 'child' } : null) },
]

const HAS_MODIFIER = /(?:Control|Ctrl|Alt|Meta|\$mod|mod)\+/i

export function usePatternClipboard(args: UsePatternClipboardArgs): UsePatternClipboardReturn {
  const {
    onEvent,
    activeId,
    insideEditable = 'forward',
    on,
    disableBuiltinChords = false,
    serialize,
    toClipboard = DEFAULT_TO_CLIPBOARD,
    fromClipboard = DEFAULT_FROM_CLIPBOARD,
  } = args

  const routeAndEmit = (e: React.ClipboardEvent, ev: UiEvent) => {
    if (!onEvent) return
    const decision = routeInsideEditable(
      typeof document !== 'undefined' ? document.activeElement : null,
      insideEditable,
    )
    if (decision === 'skip') return
    onEvent(ev)
    if (decision === 'emit-prevent') e.preventDefault()
  }

  /** serialize + toClipboard 로 native DataTransfer 에 write. preventDefault 는 호출자 책임. */
  const writeToDataTransfer = (e: React.ClipboardEvent, id: string) => {
    if (!serialize) return
    const data = e.nativeEvent.clipboardData
    if (!data) return
    const payload = serialize(id)
    if (payload === undefined) return
    const mimeMap = toClipboard(payload)
    for (const [mime, text] of Object.entries(mimeMap)) data.setData(mime, text)
    // serialize 가 있다는 건 라이브러리가 DataTransfer 를 점유한다는 뜻 → 브라우저 default suppress.
    e.preventDefault()
  }

  const onCopy = (e: React.ClipboardEvent) => {
    if (!activeId) return
    writeToDataTransfer(e, activeId)
    routeAndEmit(e, { type: 'copy', id: activeId, event: e.nativeEvent })
  }
  const onCut = (e: React.ClipboardEvent) => {
    if (!activeId) return
    writeToDataTransfer(e, activeId)
    routeAndEmit(e, { type: 'cut', id: activeId, event: e.nativeEvent })
  }
  const onPaste = (e: React.ClipboardEvent) => {
    if (!activeId) return
    const data = e.nativeEvent.clipboardData
    const payload = data ? fromClipboard(data) : undefined
    routeAndEmit(e, { type: 'paste', targetId: activeId, mode: 'auto', payload, event: e.nativeEvent })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.defaultPrevented) return
    const ke = e.nativeEvent as unknown as KeyboardEvent
    const userMap = on ?? {}
    const userKeys = Object.keys(userMap)
    const consumed = new Set<string>()

    // editable surface(input/textarea/contenteditable) 안의 non-modifier 단일 키는
     // native 타이핑(Backspace/Delete 등) 을 탈취하지 않는다 — bindGlobalKeyMap 의 가드 어휘와 동일.
    const targetEditable = isEditable(e.target as Element | null)

    // 1) builtin default chord 매칭 (disableBuiltinChords 면 skip — tree 가 자체 흡수)
    if (!disableBuiltinChords) for (const { chord, build } of DEFAULT_CHORDS) {
      if (!matches(ke, chord)) continue
      if (targetEditable && !HAS_MODIFIER.test(chord)) return
      const ev = build(activeId)
      const orig = () => { if (ev && onEvent) onEvent(ev) }
      const userFn = userMap[chord]
      if (userFn) {
        userFn(ke as unknown as Event, orig)
        consumed.add(chord)
      } else {
        orig()
      }
      e.preventDefault()
      return
    }

    // 2) on 등록 chord 중 builtin 미포함 — noop original 로 호출
    for (const chord of userKeys) {
      if (consumed.has(chord)) continue
      if (!disableBuiltinChords && DEFAULT_CHORDS.some((d) => d.chord === chord)) continue
      if (!matches(ke, chord)) continue
      const noop = () => {}
      userMap[chord](ke as unknown as Event, noop)
      // user chord 는 default win 정책 밖 — preventDefault 책임도 user 에게
      return
    }
  }

  return { onCopy, onCut, onPaste, handleKeyDown }
}

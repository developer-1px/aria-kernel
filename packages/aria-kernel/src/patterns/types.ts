/**
 * @interactive-os/aria-kernel/patterns 공용 타입 — recipe 시그니처 통일을 위한 building blocks.
 * PATTERNS.md 의 통일 시그니처 참조.
 */

import type { HTMLAttributes, Ref } from 'react'
import type { NormalizedData, UiEvent } from '../intent/events'

/**
 * Wrapper 의 표준 props base — 모든 컬렉션 wrapper 가 공유.
 *  data    : single data interface (NormalizedData)
 *  onEvent : single dispatch interface (모든 변화 통과)
 *  aria-label / aria-labelledby : accessible name (둘 중 하나 ARIA 강제)
 *
 * wrapper-specific 옵션(slots/placeholder/orientation 등)은 extends 로 추가.
 */
export interface PatternProps {
  data: NormalizedData
  onEvent: (e: UiEvent) => void
  'aria-label'?: string
  'aria-labelledby'?: string
}

/**
 * Control 패턴(switch · checkbox · radio · slider · spinbutton · textbox · combobox 입력)의
 * wrapper props base. collection 패턴(`PatternProps`)과 형제 — `data` 를 들지 않고 단일 T value 만 다룸.
 * Radix · React Aria de facto: value + defaultValue + single dispatch via onEvent.
 *
 *  T = string  — combobox 입력 · textbox · spinbutton 표시값
 *  T = number  — slider · progressbar · meter
 *  T = boolean — switch · checkbox · disclosure
 *
 * value 주입   → controlled
 * value 미주입 → 패턴 내부 useState (defaultValue 시작값)
 *
 * 표준 어댑터: `useControlValue` (patterns/_useControlValue).
 */
export interface ControlProps<T> {
  value?: T
  defaultValue?: T
  onEvent: (e: UiEvent) => void
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** 모든 recipe 의 item view 공통 필드. pattern 별로 추가 필드 확장. */
export interface BaseItem {
  id: string
  label: string
  selected: boolean
  disabled: boolean
  posinset: number
  setsize: number
}

/** Tree/treegrid item view — BaseItem + level/expanded/hasChildren. */
export interface TreeItem extends BaseItem {
  level: number
  expanded: boolean
  hasChildren: boolean
}


/**
 * Builtin chord descriptor — pattern 이 자기 디폴트로 흡수하는 chord 한 entry.
 * llms.txt / 문서 자동 추출 + 사용자/LLM 이 어떤 chord 가 reserved 인지 알게 함.
 *  chord       : `@interactive-os/keyboard` shortcut notation (e.g. 'Mod+z', 'Shift+Tab')
 *  uiEvent     : emit 되는 UiEvent['type']
 *  description : 한 줄 설명
 *  scope       : 'root' (default) | 'item' (focused item 필요)
 */
export interface KeyDescriptor {
  chord: string
  uiEvent: string
  description: string
  scope?: 'root' | 'item'
}

/**
 * TreeAxis — focus 노드 기준 관계 selector. resolveAxis 가 NormalizedData 위에서 평가.
 * 'self' 기본. 다중 결과(`*Siblings`)는 step source 로만 의미 있음.
 */
export type TreeAxis =
  | 'self' | 'parent'
  | 'prevSibling' | 'nextSibling'
  | 'firstChild' | 'lastChild'
  | 'followingSiblings' | 'precedingSiblings'

/**
 * EffectStep — 한 atomic UiEvent 를 데이터로 표현. command 의 명령형 분기를 흡수.
 *  op       : emit 할 UiEvent['type']
 *  source   : id 결정 axis. default 'self'. 결과가 비면 step skip → fallback 시도.
 *  target   : move/paste 의 targetId axis. 결과가 비면 step skip.
 *  mode     : move/paste 의 mode.
 *  fallback : source/target 미해결 시 대신 실행할 step (예: insertAfter→appendChild).
 */
export interface EffectStep {
  op: 'editStart' | 'insertAfter' | 'appendChild' | 'remove'
    | 'move' | 'paste' | 'copy' | 'cut' | 'undo' | 'redo'
  source?: TreeAxis
  target?: TreeAxis
  mode?: 'child' | 'sibling-after' | 'sibling-before' | 'auto' | 'overwrite'
  fallback?: EffectStep
}

/** Effect — 단일 step 또는 순차 step 배열. multi-step 은 promote 류 합성에 쓰임. */
export type Effect = EffectStep | readonly EffectStep[]

/**
 * TreeCommand — 의미 식별자(메뉴/팔레트 라벨링). 라이브러리 switch 에서는 더 이상 사용하지
 * 않음 — 실제 동작은 descriptor.effect 가 결정. 자유 문자열로 확장 가능.
 */
export type TreeCommand = string

/**
 * TreeCommandDescriptor — chord ↔ effect 매핑 SSOT.
 *  effect 는 데이터로 표현된 비즈니스 로직 — 새 command 추가 = 라이브러리 변경 없이 entry 1개.
 */
export interface TreeCommandDescriptor {
  chord: string
  command?: TreeCommand
  description?: string
  effect: Effect
}

/** rootProps — pattern 컨테이너에 spread. role/aria-* 필수, ref/onKey 포함. */
export type RootProps = HTMLAttributes<HTMLElement> & {
  role: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref?: Ref<any>
}

/** itemProps(id) 형태의 part-getter 반환 타입. */
export type ItemProps = HTMLAttributes<HTMLElement> & {
  role?: string
  tabIndex?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref?: Ref<any>
  'data-id'?: string
  'aria-selected'?: boolean
  'aria-disabled'?: boolean
  'aria-current'?: 'page' | 'location' | 'date' | 'time' | 'true' | 'false'
}

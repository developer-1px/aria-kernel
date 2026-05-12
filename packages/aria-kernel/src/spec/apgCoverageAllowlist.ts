/**
 * apgCoverageAllowlist — apg-coverage 매트릭스의 합법 ⚠️ allowlist.
 *
 * APG 정본에는 없는데 axis 가 advertise 하는 chord 중, 라이브러리 차원에서 의도한
 * 확장은 `extraAllow` 에 명시. 그 외 ⚠️ 는 신호 (drift) 로 본다.
 *
 * 또한 일부 패턴의 `Tab`/`Shift+Tab` 은 focusTrap 명령형 mechanic 으로 처리되어 axis
 * spec 에 안 잡힌다 — `apgWaive` 로 매트릭스 비교에서 일시 면제.
 *
 * 본 allowlist 가 비어 있을수록 정합. 새 항목 추가 시 PR 에서 사유를 commit message
 * 에 기록 (memory: feedback_canonical_source_w3c_aria — 정본 우선).
 */

/** 모든 패턴 공통: APG keyboard table 외 chord 중 axis 가 1급 advertise 한 universal alias. */
export const UNIVERSAL_EXTRA: readonly string[] = [
  'Click',           // APG 는 keyboard table 만 — axis 는 click 1급
  '<printable>',     // typeahead sentinel — APG 는 'Type-ahead' 자연어
]

/**
 * 다중선택 패턴 공통 확장 — multiSelect axis 가 advertise 하는 chord 중 APG 가
 * tree/treegrid/grid 표에는 명시 안 한 chord (listbox 만 명시). 같은 axis 합성이라
 * 자동 통과. listbox 자체는 axis ↔ APG 정합 후 본 list 가 필요 없다 — listbox
 * 항목에서 분리해 사용.
 */
const MULTI_SELECT_EXTENSION: readonly string[] = [
  '$mod+a',           // selectAll — APG listbox 명시, 다른 패턴 표에는 없음
  '$mod+Click',       // modifier-click toggle (de facto)
  'Shift+Click',      // range click (de facto)
  'Shift+ArrowDown',  // range extend (APG listbox 만)
  'Shift+ArrowUp',
  'Shift+ArrowLeft',
  'Shift+ArrowRight',
  'Shift+Space',      // range from anchor (APG listbox 만)
  '$mod+Space',       // multi-select toggle variant (de facto)
  '$mod+Shift+Home',  // range to first (APG listbox 만)
  '$mod+Shift+End',   // range to last (APG listbox 만)
]

/** per-pattern extra allowlist — APG 외 chord 중 의도된 확장. 정규화된 chord 기준. */
export const PATTERN_EXTRA_ALLOW: Record<string, readonly string[]> = {
  // listbox: axis ↔ APG 정합 (7a53b37 후) — 외부 확장만 인정.
  listbox: ['$mod+Click', 'Shift+Click', '$mod+Space'],
  // tree: APG 는 Home/End 만 명시. 라이브러리는 visible-flat 정점/끝점 chord 도 advertise.
  treeview: [...MULTI_SELECT_EXTENSION, '$mod+Home', '$mod+End'],
  treegrid: [...MULTI_SELECT_EXTENSION, 'Space'],
  grid: [...MULTI_SELECT_EXTENSION, 'Space'],

  // checkbox: Click 외에 APG 는 Space 만 — Click 은 universal
  // switch: Enter — 라이브러리 정책 (APG 'optional')
  switch: ['Enter'],

  // menuButton: 일부 chord 는 menu 가 열린 후 menu axis 가 처리하나 menuButtonAxis 가
  // 미리 advertise (Home/End/Escape/ArrowLeft/ArrowRight)
  menuButton: ['ArrowLeft', 'ArrowRight', 'End', 'Escape', 'Home'],

  // radio: Home/End 추가 advertise (APG 표에 없음 — 라이브러리 확장)
  radio: ['End', 'Enter', 'Home'],

  // spinbutton: ArrowLeft/Right 도 step 으로 advertise (APG 는 Up/Down 만)
  spinbutton: ['ArrowLeft', 'ArrowRight'],

  // splitter: PageUp/Down 큰 step (APG 는 Arrow 만)
  windowsplitter: ['PageDown', 'PageUp'],

  // toolbar: Enter/Space 는 toolbar item 의 activate (APG 표에 없으나 자연 함의)
  toolbar: ['Enter', 'Space'],

  // combobox: Space 는 textbox typing 의 일부 — alias
  combobox: ['Space'],

  // link: activate axis 는 Enter+Space+Click — APG link 표는 Enter 만, Space 는 활성화
  // 시맨틱 외 (브라우저는 link 에 Space scroll). axis 공유 정책상 Space advertise 인정.
  link: ['Space'],

  // comboboxGrid: $mod+Home/End 는 grid 의 corner jump alias
  comboboxGrid: ['$mod+End', '$mod+Home', 'Space'],
}

/**
 * apgWaive — APG 가 요구하나 axis spec 에 안 잡히는 chord (focusTrap 등 명령형
 * mechanic). 매트릭스에서 일시 면제하고 ❌ 카운트에서 제외.
 *
 * 후속: focusTrap 도 chord-as-data 로 끌어올리면 본 항목 정리 가능.
 */
export const PATTERN_APG_WAIVE: Record<string, readonly string[]> = {
  accordion: ['Tab', 'Shift+Tab'],
  alertdialog: ['Tab', 'Shift+Tab'],
  // combobox Tab: tab-out 시 commit. native focus + onBlur 처리 영역 — axis chord 아님.
  combobox: ['Tab'],
  dialogModal: ['Tab', 'Shift+Tab'],
  // grid Tab: cell 내부 focusable 순회 (native). PageUp/Down: APG 'optional, author-defined'.
  // F2: APG 'Optional cell edit-mode entry' — editable: true 옵션 시 cellProps onKeyDown 에서
  // 처리되며 axis 가 advertise 하지 않는다(per-cell onKeyDown). drift 아닌 의도된 분리.
  grid: ['Tab', 'PageUp', 'PageDown', 'F2'],
  menu: ['Tab', 'Shift+Tab'],
  radio: ['Tab', 'Shift+Tab'],
  // tabs Delete: APG 'Optional — removes closeable tab'. axis 가 다루지 않고 소비자 reducer
  // 가 remove 핸들. Tab 자체는 toolbar 와 동일한 native focus 정책.
  tabs: ['Tab', 'Delete'],
  // toolbar Enter: APG 'Optional — toolbar 가 splitter 라면 reset'. 라이브러리 미구현.
  toolbar: ['Tab'],
  // treegrid: $mod+Home/End — APG 'Optional — first/last cell of first/last row'. cell-level
  // grid navigate 어휘로 처리해야 하나 현 treegridAxis 는 row 단위만. F2 — grid 와 동일하게
  // pattern hook 자체에서 처리(아직 미구현). 셋 모두 의도된 미구현, drift 아님.
  treegrid: ['Tab', 'Shift+Tab', '$mod+Home', '$mod+End', 'F2'],
  // splitter Enter: APG 'Optional — reset to default'. 라이브러리는 step 만 노출.
  windowsplitter: ['Enter'],
}

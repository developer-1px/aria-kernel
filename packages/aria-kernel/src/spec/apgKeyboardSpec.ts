/**
 * apgKeyboardSpec — W3C WAI-ARIA APG keyboard interaction 정본 데이터.
 *
 * Issue #122 (EPIC #121).
 *
 * 출처: https://www.w3.org/WAI/ARIA/apg/patterns/<name>/  ↳ "Keyboard Interaction" 표.
 * 데이터는 W3C APG (W3C Group Note) 기준. APG 갱신 시 본 파일 1회 업데이트.
 *
 * SSOT 정렬:
 * - chord: trigger.ts 정규형 (`Control+Alt+Meta+Shift+key/Click`). Space 는 'Space'.
 * - `$mod` alias: APG 가 OS 분기를 명시하지 않은 modifier+key 는 `$mod` 로 통합 (Mac
 *   Cmd ↔ Win Ctrl 한 row). APG 가 분기를 명시한 경우(매우 드묾) 만 분리 표기.
 * - 본 데이터는 chord 만 spec 정합 비교에 쓰이며 `action` 은 사람 검토용 자연어.
 *
 * 비교 차원 (apg-coverage 테스트가 사용):
 *   APG_KEYBOARD_SPEC[pattern].chord  ↔  axis.chords  ↔  demo.meta.keys
 */

export type ApgEntry = {
  /** trigger.ts 정규형 chord 문자열. */
  readonly chord: string
  /** APG 자연어 동작 — 사람 검토용. */
  readonly action: string
  /** APG 페이지의 keyboard interaction section. URL fragment 까지 포함. */
  readonly sourceAnchor: string
}

const APG = (slug: string): string =>
  `https://www.w3.org/WAI/ARIA/apg/patterns/${slug}/#keyboardinteraction`

/**
 * APG_KEYBOARD_SPEC — pattern slug ↔ keyboard chord rows.
 *
 * pattern slug 는 APG URL 의 `/patterns/<slug>/` 그대로 (단수/복수 spec 자구 우선,
 * memory `feedback_canonical_source_w3c_aria`).
 */
export const APG_KEYBOARD_SPEC: Record<string, readonly ApgEntry[]> = {
  // ── simple patterns ────────────────────────────────────────────
  button: [
    { chord: 'Enter', action: 'Activates the button', sourceAnchor: APG('button') },
    { chord: 'Space', action: 'Activates the button', sourceAnchor: APG('button') },
  ],
  link: [
    { chord: 'Enter', action: 'Activates the link', sourceAnchor: APG('link') },
  ],
  // alert: 키보드 상호작용 없음 (live region — AT 가 announce). 빈 배열로 표기.
  alert: [],
  tooltip: [
    { chord: 'Escape', action: 'Closes the tooltip', sourceAnchor: APG('tooltip') },
  ],
  // meter: 비대화형 표시 위젯. 키보드 상호작용 없음.
  meter: [],

  // ── disclosure family ──────────────────────────────────────────
  accordion: [
    { chord: 'Enter', action: 'Activates the focused header (toggles panel)', sourceAnchor: APG('accordion') },
    { chord: 'Space', action: 'Activates the focused header (toggles panel)', sourceAnchor: APG('accordion') },
    { chord: 'Tab', action: 'Moves focus to the next focusable element', sourceAnchor: APG('accordion') },
    { chord: 'Shift+Tab', action: 'Moves focus to the previous focusable element', sourceAnchor: APG('accordion') },
    { chord: 'ArrowDown', action: 'When focus is on a header, moves focus to the next header (optional)', sourceAnchor: APG('accordion') },
    { chord: 'ArrowUp', action: 'When focus is on a header, moves focus to the previous header (optional)', sourceAnchor: APG('accordion') },
    { chord: 'Home', action: 'When focus is on a header, moves focus to the first header (optional)', sourceAnchor: APG('accordion') },
    { chord: 'End', action: 'When focus is on a header, moves focus to the last header (optional)', sourceAnchor: APG('accordion') },
  ],
  disclosure: [
    { chord: 'Enter', action: 'Activates the disclosure control (toggles content)', sourceAnchor: APG('disclosure') },
    { chord: 'Space', action: 'Activates the disclosure control (toggles content)', sourceAnchor: APG('disclosure') },
  ],
  // APG `dialog-modal` slug → TS key `dialogModal`.
  dialogModal: [
    { chord: 'Tab', action: 'Moves focus to the next tabbable element inside the dialog', sourceAnchor: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction' },
    { chord: 'Shift+Tab', action: 'Moves focus to the previous tabbable element inside the dialog', sourceAnchor: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction' },
    { chord: 'Escape', action: 'Closes the dialog', sourceAnchor: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction' },
  ],
  // APG slug `alertdialog` 그대로.
  alertdialog: [
    { chord: 'Tab', action: 'Moves focus to the next tabbable element inside the dialog', sourceAnchor: APG('alertdialog') },
    { chord: 'Shift+Tab', action: 'Moves focus to the previous tabbable element inside the dialog', sourceAnchor: APG('alertdialog') },
    { chord: 'Escape', action: 'Closes the alertdialog', sourceAnchor: APG('alertdialog') },
  ],

  // ── form / selection ───────────────────────────────────────────
  checkbox: [
    { chord: 'Space', action: 'Toggles the checkbox state (checked/unchecked, or mixed→unchecked when tri-state)', sourceAnchor: APG('checkbox') },
  ],
  switch: [
    { chord: 'Space', action: 'Toggles the switch state', sourceAnchor: APG('switch') },
    // Enter 는 spec 에서 명시되어 있지는 않으나, 본 라이브러리는 Enter 도 토글로 처리할 수 있음.
    // APG 정본 비교에서는 누락 없이 'Space' 만 있는 것이 원칙.
  ],
  // APG radio group pattern slug is `radio`.
  radio: [
    { chord: 'Tab', action: 'Moves focus into the radio group (to the checked radio, or first radio if none checked)', sourceAnchor: APG('radio') },
    { chord: 'Shift+Tab', action: 'Moves focus out of the radio group', sourceAnchor: APG('radio') },
    { chord: 'Space', action: 'When focused radio is not checked, checks it', sourceAnchor: APG('radio') },
    { chord: 'ArrowDown', action: 'Moves focus to next radio and checks it', sourceAnchor: APG('radio') },
    { chord: 'ArrowRight', action: 'Moves focus to next radio and checks it', sourceAnchor: APG('radio') },
    { chord: 'ArrowUp', action: 'Moves focus to previous radio and checks it', sourceAnchor: APG('radio') },
    { chord: 'ArrowLeft', action: 'Moves focus to previous radio and checks it', sourceAnchor: APG('radio') },
  ],
  listbox: [
    { chord: 'ArrowDown', action: 'Moves focus to next option', sourceAnchor: APG('listbox') },
    { chord: 'ArrowUp', action: 'Moves focus to previous option', sourceAnchor: APG('listbox') },
    { chord: 'Home', action: 'Moves focus to first option', sourceAnchor: APG('listbox') },
    { chord: 'End', action: 'Moves focus to last option', sourceAnchor: APG('listbox') },
    { chord: 'Space', action: 'In multi-select listbox, toggles selection of focused option', sourceAnchor: APG('listbox') },
    { chord: 'Enter', action: 'Confirms selection (optional, application-defined)', sourceAnchor: APG('listbox') },
    // Multi-select extras (APG listbox#kbd_label_multi)
    { chord: 'Shift+ArrowDown', action: 'Extends selection to next option', sourceAnchor: APG('listbox') },
    { chord: 'Shift+ArrowUp', action: 'Extends selection to previous option', sourceAnchor: APG('listbox') },
    { chord: 'Shift+Space', action: 'Selects contiguous range from most recently selected to focused option', sourceAnchor: APG('listbox') },
    { chord: '$mod+Shift+Home', action: 'Selects from focused option to first option', sourceAnchor: APG('listbox') },
    { chord: '$mod+Shift+End', action: 'Selects from focused option to last option', sourceAnchor: APG('listbox') },
    { chord: '$mod+a', action: 'Selects all options (or deselects all if all selected)', sourceAnchor: APG('listbox') },
    // Type-ahead — chord 단위로는 일반 alphanumeric. 본 spec 은 단일 chord row 로 표기 불가
    // 하므로 별도 sentinel 사용. axis 의 typeahead chord 는 모든 단일 printable key
    // (의도적으로 set diff 에서 sentinel 매치) — Step 5 가 처리 정책 결정.
  ],
  combobox: [
    { chord: 'ArrowDown', action: 'Opens listbox and moves focus to first/active option', sourceAnchor: APG('combobox') },
    { chord: 'ArrowUp', action: 'Opens listbox and moves focus to last option', sourceAnchor: APG('combobox') },
    { chord: 'Alt+ArrowDown', action: 'Opens listbox without moving focus (autocomplete patterns)', sourceAnchor: APG('combobox') },
    { chord: 'Alt+ArrowUp', action: 'Closes listbox and selects current option (autocomplete patterns)', sourceAnchor: APG('combobox') },
    { chord: 'Enter', action: 'Selects focused option, closes listbox', sourceAnchor: APG('combobox') },
    { chord: 'Escape', action: 'Closes listbox; or clears textbox value (autocomplete-both)', sourceAnchor: APG('combobox') },
    { chord: 'Tab', action: 'Selects focused option (if any) and moves focus to next tabbable', sourceAnchor: APG('combobox') },
    { chord: 'Home', action: 'Moves cursor to start of textbox (or first option if listbox-only)', sourceAnchor: APG('combobox') },
    { chord: 'End', action: 'Moves cursor to end of textbox (or last option if listbox-only)', sourceAnchor: APG('combobox') },
  ],

  // ── menu / navigation ──────────────────────────────────────────
  // APG: menubar/menu. 본 라이브러리 패턴: menu + menuButton + menubar 분리.
  menu: [
    { chord: 'Enter', action: 'Activates the focused menuitem', sourceAnchor: APG('menubar') },
    { chord: 'Space', action: 'Activates the focused menuitem', sourceAnchor: APG('menubar') },
    { chord: 'ArrowDown', action: 'Moves focus to next menuitem (wraps)', sourceAnchor: APG('menubar') },
    { chord: 'ArrowUp', action: 'Moves focus to previous menuitem (wraps)', sourceAnchor: APG('menubar') },
    { chord: 'Home', action: 'Moves focus to first menuitem', sourceAnchor: APG('menubar') },
    { chord: 'End', action: 'Moves focus to last menuitem', sourceAnchor: APG('menubar') },
    { chord: 'Escape', action: 'Closes the menu, returns focus to opener', sourceAnchor: APG('menubar') },
    { chord: 'ArrowRight', action: 'Opens submenu, or moves to next menubar item', sourceAnchor: APG('menubar') },
    { chord: 'ArrowLeft', action: 'Closes submenu, or moves to previous menubar item', sourceAnchor: APG('menubar') },
    { chord: 'Tab', action: 'Closes the menu and moves focus to next tabbable element', sourceAnchor: APG('menubar') },
    { chord: 'Shift+Tab', action: 'Closes the menu and moves focus to previous tabbable element', sourceAnchor: APG('menubar') },
  ],
  menubar: [
    { chord: 'Enter', action: 'Activates the focused menuitem (or opens submenu)', sourceAnchor: APG('menubar') },
    { chord: 'Space', action: 'Activates the focused menuitem (or opens submenu)', sourceAnchor: APG('menubar') },
    { chord: 'ArrowRight', action: 'Moves focus to next menubar item (wraps)', sourceAnchor: APG('menubar') },
    { chord: 'ArrowLeft', action: 'Moves focus to previous menubar item (wraps)', sourceAnchor: APG('menubar') },
    { chord: 'ArrowDown', action: 'Opens submenu and focuses first menuitem', sourceAnchor: APG('menubar') },
    { chord: 'ArrowUp', action: 'Opens submenu and focuses last menuitem', sourceAnchor: APG('menubar') },
    { chord: 'Home', action: 'Moves focus to first menubar item', sourceAnchor: APG('menubar') },
    { chord: 'End', action: 'Moves focus to last menubar item', sourceAnchor: APG('menubar') },
    { chord: 'Escape', action: 'Closes any open submenu', sourceAnchor: APG('menubar') },
  ],
  // menuButton: APG menu-button (button that opens a menu). 핵심 chord 만.
  menuButton: [
    { chord: 'Enter', action: 'Opens menu, focuses first menuitem', sourceAnchor: APG('menu-button') },
    { chord: 'Space', action: 'Opens menu, focuses first menuitem', sourceAnchor: APG('menu-button') },
    { chord: 'ArrowDown', action: 'Opens menu, focuses first menuitem', sourceAnchor: APG('menu-button') },
    { chord: 'ArrowUp', action: 'Opens menu, focuses last menuitem (optional)', sourceAnchor: APG('menu-button') },
  ],
  // breadcrumb: APG 페이지 존재하나 keyboard 표 없음 — 표준 링크 탐색 (Tab + Enter)
  breadcrumb: [],
  // landmarks: semantic regions. Keyboard movement is native document/tab order, not an APG axis.
  landmarks: [],
  // navigationList: APG 단일 패턴 없음 (HTML <nav> + <a aria-current> 합성 recipe).
  navigationList: [],

  // ── composite ──────────────────────────────────────────────────
  tabs: [
    { chord: 'Tab', action: 'When focus is on the active tab, moves focus into the tabpanel (or to next tabbable)', sourceAnchor: APG('tabs') },
    { chord: 'ArrowRight', action: 'Moves focus to next tab (horizontal). Auto-activates in automatic mode', sourceAnchor: APG('tabs') },
    { chord: 'ArrowLeft', action: 'Moves focus to previous tab (horizontal). Auto-activates in automatic mode', sourceAnchor: APG('tabs') },
    { chord: 'ArrowDown', action: 'Moves focus to next tab (vertical). Auto-activates in automatic mode', sourceAnchor: APG('tabs') },
    { chord: 'ArrowUp', action: 'Moves focus to previous tab (vertical). Auto-activates in automatic mode', sourceAnchor: APG('tabs') },
    { chord: 'Home', action: 'Moves focus to first tab (recommended)', sourceAnchor: APG('tabs') },
    { chord: 'End', action: 'Moves focus to last tab (recommended)', sourceAnchor: APG('tabs') },
    { chord: 'Enter', action: 'In manual activation mode, activates the focused tab', sourceAnchor: APG('tabs') },
    { chord: 'Space', action: 'In manual activation mode, activates the focused tab', sourceAnchor: APG('tabs') },
    { chord: 'Delete', action: 'Optional — when tabs are deletable, closes the focused tab', sourceAnchor: APG('tabs') },
  ],
  toolbar: [
    { chord: 'Tab', action: 'Moves focus into the toolbar (to active toolbar item)', sourceAnchor: APG('toolbar') },
    { chord: 'ArrowRight', action: 'Moves focus to next toolbar item (horizontal toolbar)', sourceAnchor: APG('toolbar') },
    { chord: 'ArrowLeft', action: 'Moves focus to previous toolbar item (horizontal toolbar)', sourceAnchor: APG('toolbar') },
    { chord: 'ArrowDown', action: 'Moves focus to next toolbar item (vertical toolbar)', sourceAnchor: APG('toolbar') },
    { chord: 'ArrowUp', action: 'Moves focus to previous toolbar item (vertical toolbar)', sourceAnchor: APG('toolbar') },
    { chord: 'Home', action: 'Moves focus to first toolbar item', sourceAnchor: APG('toolbar') },
    { chord: 'End', action: 'Moves focus to last toolbar item', sourceAnchor: APG('toolbar') },
  ],
  slider: [
    { chord: 'ArrowRight', action: 'Increases value by step (LTR/horizontal)', sourceAnchor: APG('slider') },
    { chord: 'ArrowUp', action: 'Increases value by step', sourceAnchor: APG('slider') },
    { chord: 'ArrowLeft', action: 'Decreases value by step (LTR/horizontal)', sourceAnchor: APG('slider') },
    { chord: 'ArrowDown', action: 'Decreases value by step', sourceAnchor: APG('slider') },
    { chord: 'PageUp', action: 'Increases value by a larger step', sourceAnchor: APG('slider') },
    { chord: 'PageDown', action: 'Decreases value by a larger step', sourceAnchor: APG('slider') },
    { chord: 'Home', action: 'Sets value to minimum', sourceAnchor: APG('slider') },
    { chord: 'End', action: 'Sets value to maximum', sourceAnchor: APG('slider') },
  ],
  // sliderMultithumb: APG slider-multithumb. 동일 chord (per focused thumb).
  sliderMultithumb: [
    { chord: 'ArrowRight', action: 'Increases focused thumb value by step', sourceAnchor: APG('slider-multithumb') },
    { chord: 'ArrowUp', action: 'Increases focused thumb value by step', sourceAnchor: APG('slider-multithumb') },
    { chord: 'ArrowLeft', action: 'Decreases focused thumb value by step', sourceAnchor: APG('slider-multithumb') },
    { chord: 'ArrowDown', action: 'Decreases focused thumb value by step', sourceAnchor: APG('slider-multithumb') },
    { chord: 'PageUp', action: 'Increases focused thumb value by a larger step', sourceAnchor: APG('slider-multithumb') },
    { chord: 'PageDown', action: 'Decreases focused thumb value by a larger step', sourceAnchor: APG('slider-multithumb') },
    { chord: 'Home', action: 'Sets focused thumb to its minimum', sourceAnchor: APG('slider-multithumb') },
    { chord: 'End', action: 'Sets focused thumb to its maximum', sourceAnchor: APG('slider-multithumb') },
  ],
  windowsplitter: [
    { chord: 'ArrowRight', action: 'Moves splitter right (horizontal orientation)', sourceAnchor: APG('windowsplitter') },
    { chord: 'ArrowLeft', action: 'Moves splitter left (horizontal orientation)', sourceAnchor: APG('windowsplitter') },
    { chord: 'ArrowDown', action: 'Moves splitter down (vertical orientation)', sourceAnchor: APG('windowsplitter') },
    { chord: 'ArrowUp', action: 'Moves splitter up (vertical orientation)', sourceAnchor: APG('windowsplitter') },
    { chord: 'Enter', action: 'Optional — collapses or restores the resizable region', sourceAnchor: APG('windowsplitter') },
    { chord: 'Home', action: 'Moves splitter to the position that fully expands one region', sourceAnchor: APG('windowsplitter') },
    { chord: 'End', action: 'Moves splitter to the position that fully collapses one region', sourceAnchor: APG('windowsplitter') },
  ],
  // spinbutton: ARIA spinbutton role. APG 페이지는 spinbutton-date 등 example 위주.
  spinbutton: [
    { chord: 'ArrowUp', action: 'Increases value by step', sourceAnchor: APG('spinbutton') },
    { chord: 'ArrowDown', action: 'Decreases value by step', sourceAnchor: APG('spinbutton') },
    { chord: 'PageUp', action: 'Increases value by a larger step (optional)', sourceAnchor: APG('spinbutton') },
    { chord: 'PageDown', action: 'Decreases value by a larger step (optional)', sourceAnchor: APG('spinbutton') },
    { chord: 'Home', action: 'Sets value to minimum', sourceAnchor: APG('spinbutton') },
    { chord: 'End', action: 'Sets value to maximum', sourceAnchor: APG('spinbutton') },
  ],

  // ── treeview / grid ────────────────────────────────────────────
  treeview: [
    { chord: 'ArrowDown', action: 'Moves focus to next visible node', sourceAnchor: APG('treeview') },
    { chord: 'ArrowUp', action: 'Moves focus to previous visible node', sourceAnchor: APG('treeview') },
    { chord: 'ArrowRight', action: 'When closed, opens node; when open, moves focus to first child; on leaf, no action', sourceAnchor: APG('treeview') },
    { chord: 'ArrowLeft', action: 'When open, closes node; when closed/leaf, moves focus to parent', sourceAnchor: APG('treeview') },
    { chord: 'Home', action: 'Moves focus to first node', sourceAnchor: APG('treeview') },
    { chord: 'End', action: 'Moves focus to last visible node', sourceAnchor: APG('treeview') },
    { chord: 'Enter', action: 'Activates the focused node (or toggles selection, application-defined)', sourceAnchor: APG('treeview') },
    { chord: 'Space', action: 'Toggles selection of focused node (multi-select trees)', sourceAnchor: APG('treeview') },
    // Type-ahead — printable key matches first node starting with characters
  ],
  // APG slug `treegrid` 그대로.
  treegrid: [
    { chord: 'ArrowRight', action: 'Moves focus right one cell; on collapsed row header, expands row', sourceAnchor: APG('treegrid') },
    { chord: 'ArrowLeft', action: 'Moves focus left one cell; on expanded row header, collapses row', sourceAnchor: APG('treegrid') },
    { chord: 'ArrowDown', action: 'Moves focus down one row', sourceAnchor: APG('treegrid') },
    { chord: 'ArrowUp', action: 'Moves focus up one row', sourceAnchor: APG('treegrid') },
    { chord: 'Home', action: 'Moves focus to first cell in row', sourceAnchor: APG('treegrid') },
    { chord: 'End', action: 'Moves focus to last cell in row', sourceAnchor: APG('treegrid') },
    { chord: '$mod+Home', action: 'Moves focus to first cell of first row', sourceAnchor: APG('treegrid') },
    { chord: '$mod+End', action: 'Moves focus to last cell of last row', sourceAnchor: APG('treegrid') },
    { chord: 'Enter', action: 'Performs default action on focused cell', sourceAnchor: APG('treegrid') },
    { chord: 'F2', action: 'Enters edit mode for focused cell (if editable)', sourceAnchor: APG('treegrid') },
    { chord: 'Tab', action: 'Moves focus to next cell or out of treegrid', sourceAnchor: APG('treegrid') },
    { chord: 'Shift+Tab', action: 'Moves focus to previous cell or out of treegrid', sourceAnchor: APG('treegrid') },
  ],
  grid: [
    { chord: 'ArrowRight', action: 'Moves focus to next cell in row', sourceAnchor: APG('grid') },
    { chord: 'ArrowLeft', action: 'Moves focus to previous cell in row', sourceAnchor: APG('grid') },
    { chord: 'ArrowDown', action: 'Moves focus down one row', sourceAnchor: APG('grid') },
    { chord: 'ArrowUp', action: 'Moves focus up one row', sourceAnchor: APG('grid') },
    { chord: 'Home', action: 'Moves focus to first cell in row', sourceAnchor: APG('grid') },
    { chord: 'End', action: 'Moves focus to last cell in row', sourceAnchor: APG('grid') },
    { chord: '$mod+Home', action: 'Moves focus to first cell of first row', sourceAnchor: APG('grid') },
    { chord: '$mod+End', action: 'Moves focus to last cell of last row', sourceAnchor: APG('grid') },
    { chord: 'PageDown', action: 'Optional — scrolls grid forward by an author-defined number of rows', sourceAnchor: APG('grid') },
    { chord: 'PageUp', action: 'Optional — scrolls grid backward by an author-defined number of rows', sourceAnchor: APG('grid') },
    { chord: 'F2', action: 'Enters edit mode for focused cell (if editable)', sourceAnchor: APG('grid') },
    { chord: 'Enter', action: 'Performs default action on focused cell', sourceAnchor: APG('grid') },
    { chord: 'Tab', action: 'Moves focus to next focusable inside cell, or to next cell', sourceAnchor: APG('grid') },
  ],
  feed: [
    { chord: 'ArrowDown', action: 'Moves focus to next article', sourceAnchor: APG('feed') },
    { chord: 'ArrowUp', action: 'Moves focus to previous article', sourceAnchor: APG('feed') },
    { chord: 'PageDown', action: 'Scrolls feed forward by a page', sourceAnchor: APG('feed') },
    { chord: 'PageUp', action: 'Scrolls feed backward by a page', sourceAnchor: APG('feed') },
    { chord: 'Home', action: 'Moves focus to first article', sourceAnchor: APG('feed') },
    { chord: 'End', action: 'Moves focus to last loaded article', sourceAnchor: APG('feed') },
  ],
  // carousel: 본 라이브러리는 carousel-tabs 변형 위주 (tabs 와 chord 동등) — 추가 chord 없음.
  carousel: [],
  // table: static tabular structure. Sortable examples use native button activation.
  table: [],
  // comboboxGrid: combobox + grid (popup 이 grid). chord 는 combobox 베이스 + grid 셀 navigation.
  comboboxGrid: [
    { chord: 'ArrowDown', action: 'Opens grid popup and moves focus down', sourceAnchor: APG('combobox') },
    { chord: 'ArrowUp', action: 'Opens grid popup and moves focus up', sourceAnchor: APG('combobox') },
    { chord: 'Alt+ArrowDown', action: 'Opens grid popup without moving focus', sourceAnchor: APG('combobox') },
    { chord: 'Alt+ArrowUp', action: 'Closes grid popup and selects current cell', sourceAnchor: APG('combobox') },
    { chord: 'ArrowRight', action: 'In grid popup, moves focus right one cell', sourceAnchor: APG('combobox') },
    { chord: 'ArrowLeft', action: 'In grid popup, moves focus left one cell', sourceAnchor: APG('combobox') },
    { chord: 'Enter', action: 'Selects focused cell value, closes popup', sourceAnchor: APG('combobox') },
    { chord: 'Escape', action: 'Closes popup; clears textbox value (autocomplete-both)', sourceAnchor: APG('combobox') },
    { chord: 'Home', action: 'Moves focus to first cell in row', sourceAnchor: APG('combobox') },
    { chord: 'End', action: 'Moves focus to last cell in row', sourceAnchor: APG('combobox') },
  ],
}

/** 모든 패턴 chord 의 평면 목록 (디버그·dump 용). */
export const allApgChords = (): readonly { pattern: string; chord: string }[] =>
  Object.entries(APG_KEYBOARD_SPEC).flatMap(([pattern, rows]) =>
    rows.map((r) => ({ pattern, chord: r.chord })),
  )

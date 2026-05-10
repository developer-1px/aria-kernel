export interface LabEntry {
  slug: string
  title: string
  invariant: string
  purpose: string
  status: 'PoC' | 'Candidate' | 'Promoted'
  adoptedBy?: string[]
}

export const LAB_ENTRIES: LabEntry[] = [
  {
    slug: 'dialog-backdrop',
    title: 'Dialog backdrop + outside-close',
    invariant: '§B-ter.1',
    purpose:
      'ARIA punt 자리 — modal backdrop DOM 동작과 outside-click 닫기를 kernel 이 흡수하는지 검증.',
    status: 'Promoted',
    adoptedBy: ['spredsheet/HelpDialog.tsx'],
  },
  {
    slug: 'tabs-controlled',
    title: 'Tabs — controlled active',
    invariant: '§B-ter.2',
    purpose:
      '외부 SSOT 가 active tab 인 경우, data.entities mutation 없이 active prop 으로 동기화.',
    status: 'Promoted',
    adoptedBy: ['spredsheet/Tabs.tsx'],
  },
  {
    slug: 'menu-outside-close',
    title: 'Menu — onInteractOutside',
    invariant: '§B-ter.3',
    purpose:
      'ARIA punt 자리 — 외부 클릭 시 menu 닫기를 kernel 이 흡수 (Radix de facto 어휘).',
    status: 'Promoted',
    adoptedBy: ['spredsheet/ContextMenu.tsx'],
  },
  {
    slug: 'grid-edit-start',
    title: 'Grid — activate vs editStart',
    invariant: '§B-ter.4',
    purpose:
      'F2 는 editStart, click 은 activate. consumer 가 click→편집 사고 없이 두 의도를 분리. GRID_EDIT_CHORDS = [F2, Enter].',
    status: 'Promoted',
    adoptedBy: ['spredsheet/useSheetGrid.ts', 'spredsheet/useShortcuts.ts'],
  },
  {
    slug: 'menubar-crosstop',
    title: 'Menubar — Right/Left cross-top + Down submenu',
    invariant: '§B-ter.22',
    purpose:
      'APG /menubar/ — Right/Left top 사이 이동, Down submenu open + first child, Escape close.',
    status: 'PoC',
  },
  {
    slug: 'navigation-list',
    title: 'NavigationList — aria-current="page"',
    invariant: '§B-ter.21',
    purpose:
      'Listbox 안티패턴 차단 — sidebar 는 nav landmark + a[aria-current="page"]. selected 가 아닌 current 가 SSOT.',
    status: 'PoC',
  },
  {
    slug: 'disclosure-toggle',
    title: 'Disclosure — meta.expanded SSOT',
    invariant: '§B-ter.20',
    purpose:
      'APG /disclosure/ — open 상태가 별도 useState 없이 meta.expanded set 으로 표현. activate→expand emit, reduceWithDefaults 흡수.',
    status: 'PoC',
  },
  {
    slug: 'menubutton-open',
    title: 'MenuButton — open + focus 분기',
    invariant: '§B-ter.19',
    purpose:
      'APG punt — trigger open 시 menuitem focus 분기 implementation-defined. ArrowDown/Enter/Space=first, ArrowUp=last.',
    status: 'PoC',
  },
  {
    slug: 'tree-arrow',
    title: 'Tree — Right/Left expand · focus≠expand',
    invariant: '§B-ter.18',
    purpose:
      'APG /tree/ — Right=expand→first child, Left=collapse→parent. ↑/↓ focus 이동은 절대 expand 유발 ❌ (memory feedback_tree_focus_no_expand).',
    status: 'PoC',
  },
  {
    slug: 'toolbar-separator',
    title: 'Toolbar — separator skip + single tab stop',
    invariant: '§B-ter.17',
    purpose:
      'APG /toolbar/ — separator 항목 roving skip + posinset/setsize 집계 제외. 단일 tab stop, Arrow 로 내부 이동.',
    status: 'PoC',
  },
  {
    slug: 'alertdialog-cancel',
    title: 'AlertDialog — cancel-first focus',
    invariant: '§B-ter.16',
    purpose:
      'APG punt — destructive prompt 초기 focus 선정 implementation-defined. cancelRef 우선 (안전 default).',
    status: 'PoC',
  },
  {
    slug: 'combobox-filter',
    title: 'Combobox — list autocomplete filter',
    invariant: '§B-ter.15',
    purpose:
      'APG punt — filter 알고리즘 implementation-defined. case-insensitive includes default + openOnFocus·autoHighlightFirst·closeOnBlurDelay·Escape 흡수.',
    status: 'PoC',
  },
  {
    slug: 'checkbox-mixed',
    title: 'Checkbox group — mixed (tri-state)',
    invariant: '§B-ter.14',
    purpose:
      'APG punt — parent mixed 상태 derive 와 일괄 토글 의미 implementation-defined. disabled child 제외, all/none/partial 자동.',
    status: 'PoC',
  },
  {
    slug: 'listbox-typeahead',
    title: 'Listbox — typeahead (printable keys)',
    invariant: '§B-ter.13',
    purpose:
      'APG /listbox/ — printable 키 누적 buffer (500ms window) 로 prefix 매치 navigate. typeahead axis + reduce.',
    status: 'PoC',
  },
  {
    slug: 'radio-sff',
    title: 'RadioGroup — selection follows focus',
    invariant: '§B-ter.12',
    purpose:
      'APG 강제 — radio 는 항상 selection-follows-focus. Arrow 이동 = checked 전환. reduceWithRadio (singleCheck) host reducer.',
    status: 'PoC',
  },
  {
    slug: 'switch-toggle',
    title: 'Switch — Space/Enter/Click toggle',
    invariant: '§B-ter.11',
    purpose:
      'WAI-ARIA punt — switch Enter 응답은 optional. activate axis 가 Space/Enter/Click 셋 모두 동일하게 토글 emit.',
    status: 'PoC',
  },
  {
    slug: 'slider-keyboard',
    title: 'Slider — keyboard step semantics',
    invariant: '§B-ter.10',
    purpose:
      'APG punt — large step 크기 implementation-defined. numericStep axis 가 Arrow=±step, PageUp/Down=±step×10, Home/End=min/max 흡수 + clamping.',
    status: 'PoC',
  },
  {
    slug: 'listbox-multiselect',
    title: 'Listbox — multiselect (Space/Ctrl/Shift)',
    invariant: '§B-ter.9',
    purpose:
      'APG punt — multi-mode 토글/범위 의미 implementation-defined. kernel 의 multiSelect axis + multiSelectToggle host reducer 가 흡수.',
    status: 'PoC',
  },
  {
    slug: 'accordion-single',
    title: 'Accordion — single mode (sibling auto-collapse)',
    invariant: '§B-ter.8',
    purpose:
      'APG punt — 동시 open 허용 여부는 implementation-defined. single mode 에서 kernel 이 형제 자동 collapse emit.',
    status: 'PoC',
  },
  {
    slug: 'carousel-autoplay',
    title: 'Carousel — autoplay + pause rules',
    invariant: '§B-ter.7',
    purpose:
      'APG punt — autoplay 일시정지 규칙(hover/focus/explicit toggle) 셋 전부 kernel 흡수.',
    status: 'PoC',
  },
  {
    slug: 'tooltip-delay',
    title: 'Tooltip — delayShow/delayHide',
    invariant: '§B-ter.6',
    purpose:
      'APG punt — show/hide timing 은 implementation-defined. kernel 이 delayShow/delayHide 옵션으로 흡수.',
    status: 'PoC',
  },
  {
    slug: 'dialog-on-keymap',
    title: 'Dialog — on keymap',
    invariant: '§B-ter.5',
    purpose:
      'open 인 동안 사용자 chord(Enter/Shift+Enter 등) 를 dialog 패턴이 흡수. consumer 가 input onKeyDown 손으로 안 부착.',
    status: 'Promoted',
    adoptedBy: ['spredsheet/Find.tsx'],
  },
]

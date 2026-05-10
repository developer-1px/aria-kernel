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

export interface LabEntry {
  slug: string
  title: string
  purpose: string
  status: 'PoC' | 'Candidate' | 'Promoted'
}

export const LAB_ENTRIES: LabEntry[] = [
  {
    slug: 'dialog-backdrop',
    title: 'Dialog backdrop + outside-close',
    purpose:
      'ARIA punt 자리 — modal backdrop DOM 동작과 outside-click 닫기를 kernel 이 흡수하는지 검증.',
    status: 'PoC',
  },
  {
    slug: 'tabs-controlled',
    title: 'Tabs — controlled active',
    purpose:
      '외부 SSOT 가 active tab 인 경우, data.entities mutation 없이 active prop 으로 동기화.',
    status: 'PoC',
  },
  {
    slug: 'menu-outside-close',
    title: 'Menu — onInteractOutside',
    purpose:
      'ARIA punt 자리 — 외부 클릭 시 menu 닫기를 kernel 이 흡수 (Radix de facto 어휘).',
    status: 'PoC',
  },
  {
    slug: 'grid-edit-start',
    title: 'Grid — activate vs editStart',
    purpose:
      'F2 는 editStart, click 은 activate. consumer 가 click→편집 사고 없이 두 의도를 분리.',
    status: 'PoC',
  },
]

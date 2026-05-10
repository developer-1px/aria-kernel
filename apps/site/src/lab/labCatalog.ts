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
]

/**
 * implChords — SPEC pattern key → 패턴 axis advertise chord set 라우팅.
 *
 * Issue #123/#124 (EPIC #121). 본 모듈은 두 소비자가 공유:
 *   - apgCoverage.test.ts (drift 게이트)
 *   - sibling harness /coverage route (visualization)
 *
 * 패턴마다 multiSelectable·orientation 등 옵션은 'maximum advertise' 측면 채택 —
 * 어떤 옵션 조합으로도 advertise 안 되는 chord 만 매트릭스 gap 으로 잡는다.
 */

import { accordionAxis } from '../patterns/accordion'
import { comboboxAxis } from '../patterns/combobox'
import { comboboxGridAxis } from '../patterns/comboboxGrid'
import { disclosureAxis } from '../patterns/disclosure'
import { feedAxis } from '../patterns/feed'
import { gridAxis } from '../patterns/grid'
import { listboxAxis } from '../patterns/listbox'
import { menuAxis } from '../patterns/menu'
import { menuButtonAxis } from '../patterns/menuButton'
import { menubarAxis } from '../patterns/menubar'
import { radioAxis } from '../patterns/radio'
import { sliderAxis } from '../patterns/slider'
import { sliderMultithumbAxis } from '../patterns/sliderMultithumb'
import { spinbuttonAxis } from '../patterns/spinbutton'
import { windowsplitterAxis } from '../patterns/windowsplitter'
import { switchAxis } from '../patterns/switch'
import { tabsAxis } from '../patterns/tabs'
import { toolbarAxis } from '../patterns/toolbar'
import { treeviewAxis } from '../patterns/treeview'
import { treegridAxis } from '../patterns/treegrid'
import { toggle, activate, escape } from '../axes'
import type { Axis } from '../axes'

const chords = (axis: Axis): readonly string[] => axis.chords

export const IMPL_CHORDS: Record<string, () => readonly string[]> = {
  accordion: () => chords(accordionAxis()),
  combobox: () => chords(comboboxAxis()),
  comboboxGrid: () => chords(comboboxGridAxis()),
  disclosure: () => chords(disclosureAxis()),
  feed: () => chords(feedAxis()),
  grid: () => chords(gridAxis({ multiSelectable: true })),
  listbox: () => chords(listboxAxis({ multiSelectable: true })),
  menu: () => chords(menuAxis({})),
  menuButton: () => chords(menuButtonAxis()),
  menubar: () => chords(menubarAxis()),
  radio: () => chords(radioAxis()),
  slider: () => chords(sliderAxis({})),
  sliderMultithumb: () => chords(sliderMultithumbAxis({})),
  spinbutton: () => chords(spinbuttonAxis()),
  windowsplitter: () => chords(windowsplitterAxis({})),
  switch: () => chords(switchAxis()),
  // tabs/toolbar: orientation 별로 chord 가 다르다 — 양 orientation union (max advertise).
  tabs: () => [
    ...chords(tabsAxis({ orientation: 'horizontal' })),
    ...chords(tabsAxis({ orientation: 'vertical' })),
  ],
  toolbar: () => [
    ...chords(toolbarAxis({ orientation: 'horizontal' })),
    ...chords(toolbarAxis({ orientation: 'vertical' })),
  ],
  treeview: () => chords(treeviewAxis({ multiSelectable: true })),
  treegrid: () => chords(treegridAxis({ multiSelectable: true })),

  // 단순 axis 직접 사용
  checkbox: () => chords(toggle),

  // pattern hook 이 escape axis 사용 (Tab 은 focusTrap 명령형 mechanic — 별도 정책)
  dialogModal: () => chords(escape),
  alertdialog: () => chords(escape),
  tooltip: () => chords(escape),

  // pattern hook 없는 단순 HTML 요소
  button: () => chords(activate),
  link: () => chords(activate),
  alert: () => [],
  landmarks: () => [],
  meter: () => [],
  breadcrumb: () => [],
  navigationList: () => [],
  carousel: () => [],
  table: () => [],
}

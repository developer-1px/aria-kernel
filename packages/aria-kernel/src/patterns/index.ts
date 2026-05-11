/**
 * @p/aria-kernel/patterns — W3C APG `/patterns/` recipe layer.
 *
 * 정체성: 컴포넌트 0건, markup 어휘 0건, 토큰/CSS 0건.
 * 각 recipe = `(data, onEvent, opts?) → { rootProps, <part>Props(id), items }` 통일 시그니처.
 *
 * 네이밍 규약:
 *   - hook 호출(useCallback/useRovingTabIndex 등)을 내장하면 `useXPattern` (React Rules of Hooks)
 *   - pure (props 만 반환, hook 미호출) 이면 `xPattern`
 *   - subpath/파일명은 W3C APG URL slug 미러 (변경 ❌)
 *
 * 사용:
 *   import { useListboxPattern, useTabsPattern, useTreePattern } from '@p/aria-kernel/patterns'
 *
 * primitive 직접 조립 (escape hatch):
 *   import { useRovingTabIndex, composeAxes } from '@p/aria-kernel'
 *
 * 자세한 명세는 packages/aria-kernel/PATTERNS.md
 */

export { useListboxPattern, listboxAxis, listboxEditKeys, listboxBuiltinChords, type ListboxOptions } from './listbox'
export { useTabsPattern, tabsAxis, tabsKeys, type TabsOptions } from './tabs'
export { useTreePattern, treeAxis, treeBuiltinChords, defaultTreeCommands, type TreeOptions } from './tree'
export { type BuiltinChordDescriptor, type TreeCommand, type TreeCommandDescriptor } from './types'
export { mergeRefs } from './mergeRefs'
export { useRadioGroupPattern, radioGroupAxis, radioGroupKeys, type RadioGroupOptions } from './radioGroup'
export { useToolbarPattern, toolbarAxis, type ToolbarOptions } from './toolbar'

export { useMenuPattern, menuAxis, menuKeys, menuButtonTriggerKeys, type MenuOptions } from './menu'
export { useMenuButtonPattern, menuButtonAxis, menuButtonKeys, type MenuButtonOptions, type MenuItem, type MenuItemKind, type MenuLevel } from './menuButton'
export {
  checkboxPattern, useCheckboxGroupPattern, checkboxKeys,
  type CheckboxOptions, type CheckboxGroupOptions, type CheckboxState,
} from './checkbox'
export { useMenubarPattern, menubarAxis, menubarKeys, type MenubarOptions } from './menubar'
export { useComboboxPattern, comboboxAxis, type ComboboxOptions } from './combobox'
export {
  useComboboxSelectPattern, comboboxSelectAxis,
  type ComboboxSelectOptions,
} from './comboboxSelect'
export {
  useComboboxDialogPattern,
  type ComboboxDialogOptions, type ComboboxDialogReturn,
} from './comboboxDialog'
export {
  useComboboxGridPattern, comboboxGridAxis,
  type ComboboxGridOptions, type ComboboxGridCell,
} from './comboboxGrid'
export { useTreeGridPattern, treeGridAxis, treeGridEditKeys, treeGridBuiltinChords, type TreeGridOptions } from './treeGrid'
export { useAccordionPattern, accordionAxis, type AccordionOptions } from './accordion'
export { useDialogPattern, dialogKeys, type DialogOptions } from './dialog'
export { useFocusTrap, focusTrapKeys } from './focusTrap'
export { useAlertDialogPattern, type AlertDialogOptions } from './alertDialog'
export { sliderRangePattern, sliderRangeAxis, type SliderRangeOptions } from './sliderRange'
export { useTooltipPattern, tooltipKeys, type TooltipOptions } from './tooltip'

export {
  useFeedPattern, feedAxis, feedBuiltinChords,
  type FeedItem, type FeedEvent, type FeedOptions,
} from './feed'
export { useGridPattern, gridAxis, gridEditKeys, gridBuiltinChords, type GridOptions, type GridCell } from './grid'
export { useCarouselPattern, type CarouselOptions, type CarouselSlide } from './carousel'
export { spinbuttonPattern, spinbuttonAxis, type SpinbuttonOptions } from './spinbutton'

export { disclosurePattern, disclosureAxis, type DisclosureOptions } from './disclosure'
export { sliderPattern, sliderAxis, type SliderOptions } from './slider'
export { splitterPattern, splitterAxis, type SplitterOptions } from './splitter'
export { switchPattern, switchAxis, type SwitchOptions } from './switch'
export { navigationListPattern, type NavigationListOptions } from './navigationList'
export { alertPattern, alertdialogPattern, type AlertdialogOptions } from './alert'

export type {
  BaseItem, TreeItem, RootProps, ItemProps,
  PatternProps, ControlProps,
  BasePatternOptions, CollectionOptions,
} from './types'

/**
 * ARIA-canonical alias — APG URL slug 와 1:1. LLM 의 학습된 습관 (`useAccordion` 등)
 * 이 첫 시도에 착륙하도록 #146 §10 step 2 / #145 anchoring 원칙. non-breaking 추가만.
 *
 * 기존 `use<X>Pattern` 형은 그대로 유지 — 두 이름 모두 동일 hook 참조.
 */
export { useAccordionPattern as useAccordion } from './accordion'
export { useListboxPattern as useListbox } from './listbox'
export { useTabsPattern as useTabs } from './tabs'
export { useTreePattern as useTreeView } from './tree'
export { useMenuPattern as useMenu } from './menu'
export { useMenubarPattern as useMenubar } from './menubar'
export { useMenuButtonPattern as useMenuButton } from './menuButton'
export { useComboboxPattern as useCombobox } from './combobox'
export { useComboboxSelectPattern as useComboboxSelect } from './comboboxSelect'
export { useComboboxDialogPattern as useComboboxDialog } from './comboboxDialog'
export { useComboboxGridPattern as useComboboxGrid } from './comboboxGrid'
export { useTreeGridPattern as useTreeGrid } from './treeGrid'
export { useDialogPattern as useDialog } from './dialog'
export { useAlertDialogPattern as useAlertDialog } from './alertDialog'
export { useTooltipPattern as useTooltip } from './tooltip'
export { useFeedPattern as useFeed } from './feed'
export { useGridPattern as useGrid } from './grid'
export { useCarouselPattern as useCarousel } from './carousel'
export { useToolbarPattern as useToolbar } from './toolbar'
export { useRadioGroupPattern as useRadioGroup } from './radioGroup'
export { useCheckboxGroupPattern as useCheckboxGroup } from './checkbox'

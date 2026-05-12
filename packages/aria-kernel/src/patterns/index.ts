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

export { useListboxPattern, listboxAxis, listboxEditKeys, listboxKeys, type ListboxOptions } from './listbox'
export { useTabsPattern, tabsAxis, tabsKeys, type TabsOptions } from './tabs'
export { useTreePattern, treeAxis, treeKeys, defaultTreeCommands, type TreeOptions } from './tree'
export { type KeyDescriptor, type TreeCommand, type TreeCommandDescriptor } from './types'
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
  useComboboxDialogPattern, comboboxDialogKeys,
  type ComboboxDialogOptions, type ComboboxDialogReturn,
} from './comboboxDialog'
export {
  useComboboxGridPattern, comboboxGridAxis,
  type ComboboxGridOptions, type ComboboxGridCell,
} from './comboboxGrid'
export { useTreeGridPattern, treeGridAxis, treeGridEditKeys, treeGridKeys, type TreeGridOptions } from './treeGrid'
export { useAccordionPattern, accordionAxis, type AccordionOptions } from './accordion'
export { useDialogPattern, dialogKeys, type DialogOptions } from './dialog'
export { useFocusTrap, focusTrapKeys } from './focusTrap'
export { useAlertDialogPattern, type AlertDialogOptions } from './alertDialog'
export { sliderRangePattern, sliderRangeAxis, type SliderRangeOptions } from './sliderRange'
export { useTooltipPattern, tooltipKeys, type TooltipOptions } from './tooltip'

export {
  useFeedPattern, feedAxis, feedKeys,
  type FeedItem, type FeedEvent, type FeedOptions,
} from './feed'
export { useGridPattern, gridAxis, gridEditKeys, gridKeys, type GridOptions, type GridCell } from './grid'
export { useCarouselPattern, carouselKeys, type CarouselOptions, type CarouselSlide } from './carousel'
export { spinbuttonPattern, spinbuttonAxis, type SpinbuttonOptions } from './spinbutton'

export { disclosurePattern, disclosureAxis, type DisclosureOptions } from './disclosure'
export { sliderPattern, sliderAxis, type SliderOptions } from './slider'
export { splitterPattern, splitterAxis, type SplitterOptions } from './splitter'
export { switchPattern, switchAxis, type SwitchOptions } from './switch'
export { navigationListPattern, type NavigationListOptions } from './navigationList'
export { alertPattern } from './alert'

export { useAnnouncer } from './liveRegion'
export type {
  AnnounceOptions,
  AnnouncerRegionProps,
  UseAnnouncerOptions,
  UseAnnouncerResult,
} from './liveRegion'
export { useSkipLink } from './skipLink'
export type { UseSkipLinkOptions, UseSkipLinkResult, SkipLinkProps } from './skipLink'
export { Landmark, LandmarksProvider, useLandmarks } from './landmarks'
export type { LandmarkEntry, LandmarkProps, LandmarkRole } from './landmarks'

// L1 pattern-named reducer hooks — useReducer(reduce*, items, from*) shortcut
export {
  useListboxReducer, useTreeReducer, useGridReducer, useTreeGridReducer,
  useTabsReducer, useAccordionReducer, useToolbarReducer, useCheckboxGroupReducer,
  useComboboxReducer, useComboboxSelectReducer, useComboboxGridReducer,
  useDisclosureReducer, useNavigationListReducer,
  useMenuReducer, useMenubarReducer, useMenuButtonReducer,
  useRadioGroupReducer,
  type SelectableReducerOptions, type SingleReducerOptions,
} from './reducers'

export type {
  BaseItem, TreeItem, RootProps, ItemProps,
  PatternProps, ControlProps,
} from './types'


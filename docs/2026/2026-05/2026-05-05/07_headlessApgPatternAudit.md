# `@p/aria-kernel` APG Pattern Audit Pilot

Date: 2026-05-05

Scope: audit artifact only. No production code or test code changed.

Primary sources:
- W3C APG pattern catalog: https://www.w3.org/WAI/ARIA/apg/patterns/
- W3C APG listbox pattern: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
- Repository inventory source: `packages/aria-kernel/PATTERNS.md`
- Public pattern export source: `packages/aria-kernel/src/patterns/index.ts`

## 1. Inventory

`packages/aria-kernel/PATTERNS.md` defines the recipe layer as props-only APG behavior, with no JSX, component, token, or CSS ownership (`packages/aria-kernel/PATTERNS.md:5`, `packages/aria-kernel/PATTERNS.md:22`). `packages/aria-kernel/src/patterns/index.ts` exports the public pattern surface (`packages/aria-kernel/src/patterns/index.ts:21`).

| Export | File | Source mapping | Status |
|---|---|---|---|
| `useListboxPattern`, `listboxAxis` | `patterns/listbox.ts` | APG `/listbox/` | pilot audited |
| `useTabsPattern`, `tabsAxis` | `patterns/tabs.ts` | APG `/tabs/` | pending |
| `useTreePattern`, `treeAxis` | `patterns/tree.ts` | APG `/treeview/` | pending |
| `useRadioGroupPattern`, `radioGroupAxis` | `patterns/radioGroup.ts` | APG `/radio/` | pending |
| `useToolbarPattern`, `toolbarAxis` | `patterns/toolbar.ts` | APG `/toolbar/` | pending |
| `useMenuPattern`, `menuAxis` | `patterns/menu.ts` | APG `/menubar/` menu portion | pending; `PATTERNS.md:45` lists `/menu/`, verify slug |
| `useMenuButtonPattern` | `patterns/menuButton.ts` | APG `/menu-button/` | pending |
| `checkboxPattern`, `useCheckboxGroupPattern` | `patterns/checkbox.ts` | APG `/checkbox/` | pending |
| `useMenubarPattern`, `menubarAxis` | `patterns/menubar.ts` | APG `/menubar/` | pending |
| `useComboboxPattern`, `comboboxAxis` | `patterns/combobox.ts` | APG `/combobox/` | pending |
| `useComboboxGridPattern`, `comboboxGridAxis` | `patterns/comboboxGrid.ts` | APG `/combobox/` grid popup variant | pending |
| `useTreeGridPattern`, `treeGridAxis` | `patterns/treeGrid.ts` | APG `/treegrid/` | pending |
| `useAccordionPattern`, `accordionAxis` | `patterns/accordion.ts` | APG `/accordion/` | pending |
| `useDialogPattern`, `dialogKeys` | `patterns/dialog.ts` | APG `/dialog-modal/` | pending |
| `useAlertDialogPattern` | `patterns/alertDialog.ts` | APG `/alertdialog/` | pending |
| `sliderRangePattern`, `sliderRangeAxis` | `patterns/sliderRange.ts` | APG `/slider-multithumb/` | pending |
| `useTooltipPattern`, `tooltipKeys` | `patterns/tooltip.ts` | APG `/tooltip/` | pending |
| `useFeedPattern`, `feedAxis` | `patterns/feed.ts` | APG `/feed/` | pending |
| `useGridPattern`, `gridAxis` | `patterns/grid.ts` | APG `/grid/` | pending |
| `useCarouselPattern` | `patterns/carousel.ts` | APG `/carousel/` | pending |
| `spinbuttonPattern`, `spinbuttonAxis` | `patterns/spinbutton.ts` | APG `/spinbutton/` | pending |
| `disclosurePattern`, `disclosureAxis` | `patterns/disclosure.ts` | APG `/disclosure/` | pending |
| `sliderPattern`, `sliderAxis` | `patterns/slider.ts` | APG `/slider/` | pending |
| `splitterPattern`, `splitterAxis` | `patterns/splitter.ts` | APG `/windowsplitter/` | pending |
| `switchPattern`, `switchAxis` | `patterns/switch.ts` | APG `/switch/` | pending |
| `navigationListPattern` | `patterns/navigationList.ts` | WHATWG `nav` + `aria-current`, not APG widget recipe | pending |
| `alertPattern` | `patterns/alert.ts` | APG `/alert/` | pending |
| `alertdialogPattern` | `patterns/alert.ts` | APG `/alertdialog/` props-only variant | pending |

Current APG catalog also includes patterns not exposed as headless recipes: breadcrumb, button, landmarks, link, meter, table. These should be classified separately as native-enough, intentionally out of scope, or missing.

## 2. Source Mapping Rules

Use this priority order for every pattern:

1. W3C APG page URL and current pattern catalog.
2. WAI-ARIA role/state/property links referenced by that APG page.
3. WHATWG HTML only for native semantic patterns like `navigationListPattern`.
4. Repository docs only as implementation intent, never as the external authority.

Each APG sentence becomes one audit clause. The executable schema now lives at
`packages/aria-kernel/src/spec/apgClauseSpec.ts`.

```ts
import { z } from 'zod'

const ApgClauseSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  sourceUrl: z.string().url(),
  sourceSection: z.enum([
    'about',
    'keyboard',
    'roles-states-properties',
    'note',
    'example',
  ]),
  classification: z.enum([
    'required',
    'recommended',
    'optional',
    'host-responsibility',
    'not-applicable',
  ]),
  subject: z.enum([
    'role',
    'aria',
    'focus',
    'keyboard',
    'selection',
    'state',
    'relationship',
    'content-model',
    'naming',
  ]),
  expectation: z.string(),
  verdict: z.enum([
    'pass',
    'partial',
    'fail',
    'not-applicable',
    'pending',
  ]),
  evidence: z.array(z.object({
    file: z.string(),
    line: z.number().int().positive(),
    note: z.string(),
  })),
  residualRisk: z.string().optional(),
})
```

Verdict vocabulary:
- `pass`: code path satisfies the clause for valid headless input.
- `partial`: implementation exposes support but depends on host data, reducer, or markup discipline.
- `fail`: observable props or behavior contradict the APG clause.
- `not-applicable`: APG clause is content guidance, an alternative implementation strategy, or outside a props-only headless layer.
- `pending`: not audited yet.

## 3. Listbox Pilot

External source: W3C APG `/listbox/`.

Implementation source:
- `useListboxPattern`: `packages/aria-kernel/src/patterns/listbox.ts:67`
- APG URL comment: `packages/aria-kernel/src/patterns/listbox.ts:63`
- Public export: `packages/aria-kernel/src/patterns/index.ts:21`
- Existing axe smoke test: `packages/aria-kernel/src/patterns/a11y.test.tsx:42`

Pilot verdict: partial. Core role/ARIA props are mostly present, but the audit should not mark listbox complete until boundary keyboard behavior, horizontal keyboard aliasing, and host-data invariants are decided and covered by executable contract tests.

### Clause Results

| Clause | Classification | Verdict | Evidence |
|---|---|---|---|
| Container has `role="listbox"` | required | pass | `rootProps.role = 'listbox'` at `packages/aria-kernel/src/patterns/listbox.ts:148` |
| Each option has `role="option"` | required | pass | `optionProps` returns `role: 'option'` at `packages/aria-kernel/src/patterns/listbox.ts:163` |
| Standalone listbox has accessible name | required | partial | Conditional on standalone usage. API exposes `label` and `labelledBy` at `packages/aria-kernel/src/patterns/listbox.ts:27`; root forwards both at `packages/aria-kernel/src/patterns/listbox.ts:156`. No runtime enforcement. |
| Multi-select listbox sets `aria-multiselectable=true` | required | pass | Conditional on multi-select support. `multiSelectable` option at `packages/aria-kernel/src/patterns/listbox.ts:14`; root prop at `packages/aria-kernel/src/patterns/listbox.ts:150` |
| Selection state is represented consistently with `aria-selected` or `aria-checked`, not both | required | pass | option props use `aria-selected` at `packages/aria-kernel/src/patterns/listbox.ts:171`; no `aria-checked` in listbox props |
| Unselected selectable options expose false state | required | pass | `aria-selected` falls back to `false` at `packages/aria-kernel/src/patterns/listbox.ts:171` |
| Single-select listbox does not expose multiple selected options | required | partial | props mirror input data at `packages/aria-kernel/src/patterns/listbox.ts:107`; no guard prevents multiple selected entities when `multiSelectable` is false |
| Grouped options are contained by `role="group"` with an accessible group name | required | partial | Conditional on grouped variant. `groupProps` returns `role: 'group'` and `aria-labelledby` at `packages/aria-kernel/src/patterns/listbox.ts:181`; `groups` can include an empty option list from host data at `packages/aria-kernel/src/patterns/listbox.ts:119` |
| Dynamic/partial DOM option sets expose `aria-posinset` and `aria-setsize` | required | pass | Conditional on virtualized/dynamic option sets. Item view computes `posinset`/`setsize` at `packages/aria-kernel/src/patterns/listbox.ts:114`; option props forward them at `packages/aria-kernel/src/patterns/listbox.ts:173` |
| Vertical Down/Up moves to next/previous enabled option | required | partial | axis composes `navigate('vertical')` at `packages/aria-kernel/src/patterns/listbox.ts:56`; `navigate` wraps at boundaries via modulo at `packages/aria-kernel/src/axes/navigate.ts:5`, which is an extra behavior not established by APG wording |
| Home/End moves to first/last option | optional | pass | APG strongly recommends this for larger lists. `navigate` maps start/end at `packages/aria-kernel/src/axes/navigate.ts:27`; tests cover Home/End at `packages/aria-kernel/src/axes/navigate.test.ts:36` |
| Type-ahead single and rapid multi-character search | recommended | pass | listbox axis includes `typeahead` at `packages/aria-kernel/src/patterns/listbox.ts:59`; typeahead buffers printable keys at `packages/aria-kernel/src/axes/typeahead.ts:18`; tests cover single and buffered matches at `packages/aria-kernel/src/axes/typeahead.test.ts:20` |
| Multi-select Space toggles focused option | recommended | pass | APG recommended multi-select model. `multiSelect` maps Space to select at `packages/aria-kernel/src/axes/multiSelect.ts:44`; test at `packages/aria-kernel/src/axes/multiSelect.test.ts:18` |
| Multi-select Shift+Arrow range behavior | optional | pass | `multiSelect` maps Shift+Arrow at `packages/aria-kernel/src/axes/multiSelect.ts:47`; test at `packages/aria-kernel/src/axes/multiSelect.test.ts:28` |
| Multi-select Control+A select-all | optional | pass | `multiSelect` maps select-all at `packages/aria-kernel/src/axes/multiSelect.ts:46`; test at `packages/aria-kernel/src/axes/multiSelect.test.ts:22` |
| Initial focus goes to selected option, otherwise first option | required | pass | Applies on focus entry. Default focus picks selected option or first enabled option at `packages/aria-kernel/src/roving/useRovingTabIndex.ts:21`; hook uses it at `packages/aria-kernel/src/roving/useRovingTabIndex.ts:54` |
| Initial focus in multi-select does not automatically change selection | required | pass | `selectionFollowsFocus` is disabled by default when `multiSelectable` is true at `packages/aria-kernel/src/patterns/listbox.ts:83` |
| Single-select selection may follow focus | optional | pass | default `sff = !multiSelectable` at `packages/aria-kernel/src/patterns/listbox.ts:83`; helper emits activate after navigate at `packages/aria-kernel/src/gesture/index.ts:18` |
| Horizontal listbox keyboard remapping | required | partial | Conditional on horizontal orientation support. `orientation` supports `horizontal` at `packages/aria-kernel/src/patterns/listbox.ts:10`; `navigate('horizontal')` only handles Left/Right and tests assert Up/Down do not respond at `packages/aria-kernel/src/axes/navigate.test.ts:57`. APG horizontal note must be interpreted before final verdict. |
| Options should not contain nested interactive elements | host-responsibility | not-applicable | recipe returns props only; consumer owns markup under option nodes |
| Long or repetitive option names should be avoided | host-responsibility | not-applicable | recipe reads labels but cannot judge content quality at `packages/aria-kernel/src/patterns/listbox.ts:111` |
| `aria-activedescendant` focus model is allowed alternative | optional | not-applicable | implementation chooses roving tabindex via `useRovingTabIndex` at `packages/aria-kernel/src/patterns/listbox.ts:94` |

### Pilot Gaps To Resolve Before Expanding

1. Boundary navigation: decide whether wrap-around in `navigate` is an accepted de facto extension for listbox or an APG mismatch requiring pattern-specific non-wrapping mode.
2. Horizontal orientation: verify APG expected arrow aliases and decide whether listbox needs a horizontal-specific axis different from generic `navigate('horizontal')`.
3. Data validity: decide whether pattern contracts assume normalized valid input, or whether props getters must actively prevent APG-invalid output such as multiple selected options in single-select mode.
4. Group validity: decide whether empty option groups are invalid input or should be filtered/flagged.
5. Test shape: current listbox has an axe smoke test (`packages/aria-kernel/src/patterns/a11y.test.tsx:42`) and axis unit tests, but no listbox-specific APG contract test combining props, focus, key events, and emitted events.

## 4. Proposed Next Step

After this pilot is approved, create `packages/aria-kernel/src/patterns/apg-contracts/` or a docs-only equivalent with one JSON/TS contract per pattern. Then expand in this order:

1. Listbox executable contract test.
2. Tabs and radio group, because they share selection-follows-focus risk.
3. Tree and treegrid, because hierarchy and focus semantics have larger blast radius.
4. Menu, menubar, combobox, and menu button, because popup ownership needs explicit host-responsibility classification.
5. Numeric and single-value controls.

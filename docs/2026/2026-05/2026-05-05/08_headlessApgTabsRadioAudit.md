# `@p/aria-kernel` APG Pattern Audit Batch 1: Tabs + Radio Group

Date: 2026-05-05

Scope: audit artifact only. No production code or test code changed.

Primary sources:
- W3C APG tabs pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- W3C APG radio group pattern: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
- Batch seed: `docs/2026/2026-05/2026-05-05/07_headlessApgPatternAudit.md`

Verdict vocabulary follows the pilot schema:
- `pass`: implementation satisfies the clause for valid headless input.
- `partial`: exposed behavior is close, but depends on host data/reducer/markup or has a known edge.
- `fail`: observable props or behavior contradict the APG clause.
- `not-applicable`: APG clause is an optional variant, content guidance, or outside this recipe boundary.
- `pending`: not audited yet.

## 1. Tabs

External source: W3C APG `/tabs/`.

Implementation source:
- `useTabsPattern`: `packages/aria-kernel/src/patterns/tabs.ts:31`
- APG URL comment: `packages/aria-kernel/src/patterns/tabs.ts:25`
- Public export: `packages/aria-kernel/src/patterns/index.ts:22`
- Existing axe smoke test: `packages/aria-kernel/src/patterns/a11y.test.tsx:57`

Pilot verdict: partial. Roles and relationships are mostly aligned. Remaining risk is state validity: `aria-selected`, panel visibility, and focus target all mirror host `NormalizedData`, so invalid host data can produce APG-invalid tab state.

### Clause Results

| Clause | Classification | Verdict | Evidence |
|---|---|---|---|
| Tab container has `role="tablist"` | required | pass | `rootProps.role = 'tablist'` at `packages/aria-kernel/src/patterns/tabs.ts:78` |
| Each tab has `role="tab"` | required | pass | `tabProps` returns `role: 'tab'` at `packages/aria-kernel/src/patterns/tabs.ts:86` |
| Each panel has `role="tabpanel"` | required | pass | `panelProps` returns `role: 'tabpanel'` at `packages/aria-kernel/src/patterns/tabs.ts:103` |
| `tablist` has accessible name by `aria-label` or `aria-labelledby` | required | partial | API exposes `label`/`labelledBy` at `packages/aria-kernel/src/patterns/tabs.ts:20`; root forwards both at `packages/aria-kernel/src/patterns/tabs.ts:81`. No runtime enforcement. |
| Each tab controls its associated panel | required | pass | `tabId`/`panelId` helpers at `packages/aria-kernel/src/patterns/tabs.ts:75`; tab `aria-controls` at `packages/aria-kernel/src/patterns/tabs.ts:97` |
| Each panel is labelled by its associated tab | required | pass | panel `aria-labelledby` points to `tabId(id)` at `packages/aria-kernel/src/patterns/tabs.ts:103` |
| Active tab has `aria-selected=true`; inactive tabs have `false` | required | partial | `aria-selected` mirrors `items.selected` at `packages/aria-kernel/src/patterns/tabs.ts:95`; `items.selected` mirrors host entities at `packages/aria-kernel/src/patterns/tabs.ts:63`. No guard enforces exactly one selected tab. |
| One panel is displayed at a time and matches active tab | required | partial | panel `hidden` is derived from selected state at `packages/aria-kernel/src/patterns/tabs.ts:108`; invalid host data can hide all panels or show multiple panels. |
| Focus entering tablist lands on active tab | required | partial | roving default chooses selected item first at `packages/aria-kernel/src/roving/useRovingTabIndex.ts:21`; if host data has no selected tab, focus falls back to first enabled item. |
| Horizontal Left/Right arrows move focus previous/next and wrap | required | pass | default orientation is horizontal at `packages/aria-kernel/src/patterns/tabs.ts:42`; `tabsAxis` uses `navigate` at `packages/aria-kernel/src/patterns/tabs.ts:5`; `navigate` wraps via modulo at `packages/aria-kernel/src/axes/navigate.ts:5` |
| Horizontal tablist does not consume Up/Down | required | pass | generic horizontal navigate ignores Up/Down; regression test asserts this at `packages/aria-kernel/src/axes/navigate.test.ts:57` |
| Vertical Down/Up act like horizontal next/previous | required | pass | `tabsAxis` passes `orientation` into `navigate` at `packages/aria-kernel/src/patterns/tabs.ts:6`; vertical key map is Up/Down at `packages/aria-kernel/src/axes/keys.ts:60` |
| Space or Enter activates focused tab in manual mode | required | pass | `activationMode='manual'` bypasses selection-following relay at `packages/aria-kernel/src/patterns/tabs.ts:51`; `activate` maps Enter/Space at `packages/aria-kernel/src/axes/activate.ts:14` |
| Automatic activation is recommended only when panels are available without latency | recommended | partial | default is `activationMode = 'automatic'` at `packages/aria-kernel/src/patterns/tabs.ts:43`; recipe cannot know whether panel content is preloaded. |
| Home/End move focus to first/last tab | optional | pass | `navigate` maps start/end at `packages/aria-kernel/src/axes/navigate.ts:27`; tests cover Home/End at `packages/aria-kernel/src/axes/navigate.test.ts:36` |
| Shift+F10 opens associated popup menu | optional | not-applicable | No tab popup API is exposed in `TabsOptions` at `packages/aria-kernel/src/patterns/tabs.ts:13`; host should own this variant if needed. |
| Delete closes current tab and associated panel when deletion is supported | optional | not-applicable | No deletion option is exposed in `TabsOptions` at `packages/aria-kernel/src/patterns/tabs.ts:13`; deletion should be a separate editable-tabs contract. |
| `tabpanel` participates in tab sequence when it has no focusable content | recommended | partial | `panelProps` always sets `tabIndex: 0` at `packages/aria-kernel/src/patterns/tabs.ts:107`; this satisfies the no-focusable-content case but can add an extra focus stop when the panel already contains focusable content. |
| Vertical tablist sets `aria-orientation=vertical`; horizontal is default | required | pass | root always sets `aria-orientation` from option/default at `packages/aria-kernel/src/patterns/tabs.ts:80`; explicit horizontal is redundant but ARIA-valid. |

### Tabs Gaps

1. Decide whether recipe contracts assume valid single-selected host data or should enforce exactly one active tab/panel.
2. Decide whether unconditional `tabpanel tabIndex=0` is acceptable as a headless default or should move to host responsibility.
3. Add executable APG contract tests beyond the current focused tabs tests.

## 2. Radio Group

External source: W3C APG `/radio/`.

Implementation source:
- `useRadioGroupPattern`: `packages/aria-kernel/src/patterns/radioGroup.ts:47`
- APG URL comment: `packages/aria-kernel/src/patterns/radioGroup.ts:41`
- Public export: `packages/aria-kernel/src/patterns/index.ts:24`
- Existing axe smoke test: `packages/aria-kernel/src/patterns/a11y.test.tsx:131`

Pilot verdict: partial. Basic role/state/focus behavior is present, including both APG focus strategies. The biggest open issue is that generic `activate` accepts Enter as well as Space, while APG non-toolbar radio groups specify Space. Toolbar-contained radio groups are a distinct APG keyboard model and are not represented as a separate recipe.

### Clause Results

| Clause | Classification | Verdict | Evidence |
|---|---|---|---|
| Radios are contained in or owned by an element with `role="radiogroup"` | required | pass | `rootProps.role = 'radiogroup'` at `packages/aria-kernel/src/patterns/radioGroup.ts:86` |
| Each radio has `role="radio"` | required | pass | active-descendant branch returns `role: 'radio'` at `packages/aria-kernel/src/patterns/radioGroup.ts:107`; roving branch returns it at `packages/aria-kernel/src/patterns/radioGroup.ts:119` |
| Checked radio has `aria-checked=true`; unchecked radios have `false` | required | pass | both focus modes set `aria-checked` from item selected state at `packages/aria-kernel/src/patterns/radioGroup.ts:112` and `packages/aria-kernel/src/patterns/radioGroup.ts:124` |
| No more than one radio is checked at a time | required | partial | props mirror host selected flags from `items` at `packages/aria-kernel/src/patterns/radioGroup.ts:74`; `singleSelect` reducer can enforce one selected item at `packages/aria-kernel/src/state/selection.ts:19`, but the pattern itself does not guard invalid host data. |
| `radiogroup` has accessible name by `aria-label` or `aria-labelledby` | required | partial | API exposes `label`/`labelledBy` at `packages/aria-kernel/src/patterns/radioGroup.ts:21`; root forwards both at `packages/aria-kernel/src/patterns/radioGroup.ts:93`. No runtime enforcement. |
| Each radio has an accessible label | host-responsibility | not-applicable | `radioProps` does not expose per-radio `aria-label`/`aria-labelledby`; consumer content labels the radio in the normal case. Existing smoke test renders text children at `packages/aria-kernel/src/patterns/a11y.test.tsx:139`. |
| Optional descriptive text can be referenced by `aria-describedby` | host-responsibility | not-applicable | no described-by option exists in `RadioGroupOptions` at `packages/aria-kernel/src/patterns/radioGroup.ts:8`; consumer may add/override ARIA props when composing markup. |
| Tab into group focuses checked radio, otherwise first radio | required | pass | default roving focus picks selected item or first enabled item at `packages/aria-kernel/src/roving/useRovingTabIndex.ts:21`; radio pattern uses roving hook at `packages/aria-kernel/src/patterns/radioGroup.ts:71` |
| Space checks focused radio when not already checked | required | pass | radio axis composes `activate` at `packages/aria-kernel/src/patterns/radioGroup.ts:37`; `activate` maps Space at `packages/aria-kernel/src/axes/keys.ts:50`; `singleSelect` handles activate/select at `packages/aria-kernel/src/state/selection.ts:19` |
| Enter does not activate a normal non-toolbar radio group | required | partial | generic `activate` maps both Enter and Space at `packages/aria-kernel/src/axes/keys.ts:50`; APG only lists Enter for toolbar-contained radio groups as optional. |
| Right/Down arrows move to next radio, wrap, and check it | required | pass | radio axis composes vertical and horizontal `navigate` at `packages/aria-kernel/src/patterns/radioGroup.ts:37`; `navigate` wraps via modulo at `packages/aria-kernel/src/axes/navigate.ts:5`; relay applies selection follows focus at `packages/aria-kernel/src/patterns/radioGroup.ts:63` |
| Left/Up arrows move to previous radio, wrap, and check it | required | pass | same axis/relay evidence as next-arrow clause: `packages/aria-kernel/src/patterns/radioGroup.ts:37`, `packages/aria-kernel/src/patterns/radioGroup.ts:63`, `packages/aria-kernel/src/axes/navigate.ts:24` |
| Roving tabindex focus strategy is supported | optional | pass | default `focusMode = 'roving'` at `packages/aria-kernel/src/patterns/radioGroup.ts:57`; roving branch sets item `tabIndex` at `packages/aria-kernel/src/patterns/radioGroup.ts:119` |
| `aria-activedescendant` focus strategy is supported | optional | pass | `focusMode='activeDescendant'` branch sets root `tabIndex` and `aria-activedescendant` at `packages/aria-kernel/src/patterns/radioGroup.ts:96`; radio ids are generated at `packages/aria-kernel/src/patterns/radioGroup.ts:61` |
| Toolbar-contained radio group does not change checked state on arrow navigation | required | not-applicable | This recipe has no toolbar-contained mode in `RadioGroupOptions` at `packages/aria-kernel/src/patterns/radioGroup.ts:8`; toolbar radio behavior should be audited under `useToolbarPattern` or a dedicated toolbar-radio contract. |
| `aria-orientation` reflects visual orientation | optional | pass | `orientation` option is documented as visual/ARIA only at `packages/aria-kernel/src/patterns/radioGroup.ts:10`; root forwards it at `packages/aria-kernel/src/patterns/radioGroup.ts:88` |

### Radio Group Gaps

1. Decide whether Enter activation for non-toolbar radio is an accepted de facto extension or an APG mismatch.
2. Decide whether toolbar-contained radio groups need a separate recipe/contract instead of relying on `useRadioGroupPattern`.
3. Decide whether per-radio `aria-label`, `aria-labelledby`, and `aria-describedby` should be explicit options or remain host markup responsibility.
4. Add executable APG contract tests for checked focus entry, arrow selection, active-descendant mode, and invalid multiple-checked host data.

## 3. Batch Result

| Pattern | Verdict | Main risk |
|---|---|---|
| `useTabsPattern` | partial | host data can produce invalid selected/panel state |
| `useRadioGroupPattern` | partial | Enter over-activation and toolbar-contained radio variant not represented |

Recommended next batch: `useTreePattern` and `useTreeGridPattern`, because they share hierarchy, expansion, disabled-skip, and selection/focus risks.

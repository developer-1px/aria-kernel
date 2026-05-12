# `@p/aria-kernel/patterns` — APG recipe layer

> Naming dictionary: [NAMING.md](./NAMING.md) — canonical export/option/prop 이름 SSOT.

W3C APG `https://www.w3.org/WAI/ARIA/apg/patterns/` 의 각 패턴을 **axis 묶음 + props getter + items view** 의 단일 함수로 박제. 컴포넌트·markup 어휘 0건. 정체성: `project_headless_identity` (Behavior infra, not component wrapper).

## 통일 시그니처

```ts
type Recipe<P extends string> = (
  data: NormalizedData,
  onEvent?: (e: UiEvent) => void,
  opts?: object,
) => {
  rootProps: HTMLAttributes        // role · aria-* · ref · onKeyDown
  items: Item[]                    // 미리 계산된 view (id, label, selected, disabled, posinset, setsize, level?)
  // pattern-specific prop getters:
  [K in P]: (id: string, ...) => HTMLAttributes
}
```

규칙:
- **입력 = `(data, onEvent, opts?)`** — 메모리 *Single data interface — useResource* 정합
- **출력 = `{ rootProps, <part>Props(id), items }`** — 외부 VOC 횡단 요구 *prop getters* 흡수
- **`items` 는 미리 계산된 뷰** — 소비자가 `data.entities[id]?.data` 손파싱 ❌
- **컴포넌트 0건, JSX 0건** — props 만 반환, markup 결정은 소비자
- **stable data attrs**: `data-selected`, `data-highlighted`, `data-open`, `data-orientation`, `data-focus-visible` 자동 부여 (VOC 횡단 요구 흡수)

## 패턴 명세 (P1 → P4 우선순위)

### P1 — 즉시 채울 패턴 (우리 composite 마이그레이션 가능)

| Recipe | W3C APG | 시그니처 | 옵션 | axis 묶음 | items 필드 | 우리 composite |
|---|---|---|---|---|---|---|
| `useListboxPattern` | [`/listbox/`](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) | `(data, onEvent, opts?) → { rootProps, optionProps, items }` | `selectionFollowsFocus?: boolean` (default `true`), `multiSelectable?: boolean`, `autoFocus?: boolean` | `navigate('vertical') + activate + typeahead` (+ `selectionFollowsFocus` gesture) | `id, label, selected, disabled, posinset, setsize` | `Listbox` |
| `useTabsPattern` | [`/tabs/`](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) | `(data, onEvent, opts?) → { rootProps, tabProps, panelProps, items }` | `orientation?: 'h'\|'v'`, `activationMode?: 'automatic'\|'manual'` (default `'automatic'`), `autoFocus?: boolean` | `navigate(orientation) + activate` (+ `selectionFollowsFocus` if `automatic`) | `id, label, selected, disabled, posinset, setsize` | `Tabs` |
| `useTreeviewPattern` | [`/treeview/`](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) | `(data, onEvent, opts?) → { rootProps, itemProps, items }` | `multiSelectable?: boolean` (default `false`), `selectionFollowsFocus?: boolean` (default `!multiSelectable`), `orientation?`, `autoFocus?`, `containerId?` | `treeNavigate + treeExpand + activate + typeahead` (+ `multiSelect` if `multiSelectable`) | `id, label, selected, disabled, expanded, level, posinset, setsize, hasChildren` | `Tree` |
| `useRadioPattern` | [`/radio/`](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) | `(data, onEvent, opts?) → { rootProps, radioProps, items }` | `orientation?: 'h'\|'v'` (시각만, 키보드는 양축), `autoFocus?: boolean` | `navigate('vertical') + navigate('horizontal') + activate` + `selectionFollowsFocus`(강제) | `id, label, selected, disabled, posinset, setsize` | `RadioGroup` |
| `useToolbarPattern` | [`/toolbar/`](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) | `(data, onEvent, opts?) → { rootProps, itemProps, items }` | `orientation?: 'h'\|'v'`, `autoFocus?: boolean` | `navigate(orientation)` | `id, label, disabled, separator?` | `Toolbar` |

### P2 — 패턴 확장 (재료 일부 부족, 신규 axis/모드 동반)

| Recipe | W3C APG | 시그니처 | 옵션 | axis 묶음 | 신규 필요 |
|---|---|---|---|---|---|
| `useMenuPattern` | [`/menu/`](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) | `(data, onEvent, opts?) → { rootProps, itemProps, items }` | `closeOnSelect?: boolean` (default `true`) | `navigate('vertical') + activate + typeahead` | submenu open state if nested |
| `useMenubarPattern` | [`/menubar/`](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) | `(data, onEvent, opts?) → { rootProps, menuProps, itemProps, items }` | `orientation?: 'h'\|'v'` (default `'h'`) | `navigate('horizontal')` 상위 + `navigate('vertical') + activate` 하위 | submenu cross-axis |
| `useComboboxPattern` | [`/combobox/`](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) | `(data, onEvent, opts?) → { comboboxProps, listboxProps, optionProps, items, expanded, setExpanded }` | `autocomplete?: 'none'\|'list'\|'both'`, `activeDescendant?: boolean` (default `true` per APG) | input은 `role="combobox"` + `aria-activedescendant`; popup은 `navigate('vertical')` | **`useActiveDescendant` hook 신규** (INVARIANT B11 "Combobox 1곳 예외" 코드화) |
| `useTreegridPattern` | [`/treegrid/`](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) | `(data, onEvent, opts?) → { treegridProps, rowProps, columnheaderProps, rowheaderProps, gridcellProps, items }` | `multiSelectable?: boolean`, `selectionFollowsFocus?: boolean`, `orientation?`, `autoFocus?`, `containerId?` | `treeNavigate` + `treeExpand` + `activate` (+ `multiSelect` if multi) + rowheader/gridcell semantics | tree-visible row focus with grid cells |
| `disclosurePattern` | [`/disclosure/`](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) | `(opts) → { triggerProps, panelProps }` (data 단일 boolean) | `defaultOpen?`, `open?`, `onOpenChange?` | `activate` | uncontrolled state via `useControlState` |
| `useAccordionPattern` | [`/accordion/`](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) | `(data, onEvent, opts?) → { rootProps, headerProps, triggerProps, panelProps, items }` | `type?: 'single'\|'multiple'`, `collapsible?: boolean` | `expand + activate + navigate('vertical')` | 다중 expand 데이터 모델 |
| `sliderPattern` | [`/slider/`](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) · [`/slider-multithumb/`](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/) | `(data, onEvent, opts?) → { rootProps, trackProps, rangeProps, thumbProps }` | `min`, `max`, `step`, `orientation?` | `navigate(orientation) + numeric step axis` | **`numericStep` axis 신규** + pointer capture |
| `windowsplitterPattern` | [`Window Splitter`](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) | `(data, onEvent, opts?) → { rootProps, paneProps, handleProps }` | `orientation?`, `min`, `max` | `navigate(orientation) + numeric step axis` | slider와 axis 공유 |
| `switchPattern` | [WAI-ARIA `switchPattern` role](https://www.w3.org/TR/wai-aria-1.2/#switch) | `(opts) → { switchProps }` (단일 boolean) | `defaultChecked?`, `checked?`, `onCheckedChange?` | `activate` | role=switch + aria-checked |

### P3 — 보조 패턴

| Recipe | W3C 출처 | 비고 |
|---|---|---|
| `navigationListPattern` | [HTML `<nav>` landmark](https://html.spec.whatwg.org/multipage/sections.html#the-nav-element) + `aria-current="page"` | sidebar≠listbox 의미 분리. 키보드는 native Tab/Enter 디폴트, 옵션으로 spatial roving |
| `link` | [HTML `<a>`](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element) | recipe 불필요? — native `<a>` 면 충분. 정렬 검토 후 결정 |
| `useDialogModalPattern` | [`/dialog-modal/`](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | focus trap + Escape + return focus. 우리 INVARIANT 14 (focus ⊃ global) 와 결합 |
| `useTooltipPattern` | [`/tooltip/`](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) | hover/focus delay state |
| `alertPattern` / `alertdialogPattern` | [`/alertdialog/`](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) | dialog 변종 |

### P4 — MDN ARIA Roles 누락 보강 (2026-05-03)

| Recipe | W3C 출처 | 시그니처 | 옵션 / 비고 |
|---|---|---|---|
| `useFeedPattern` | [`/feed/`](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) | `(data, opts?) → { rootProps, articleProps(id), labelProps(id), items }` | `busy?: boolean`, `containerId?`, `idPrefix?` · role=feed, aria-busy, PageUp/PageDown 가로채 article 단위 focus 이동. Ctrl+Home/End (feed 바깥 first/last) 은 host 책임 |
| `useGridPattern` | [`/grid/`](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | `(data, onEvent, opts?) → { rootProps, rowProps(id), columnHeaderProps(id), rowHeaderProps(id), cellProps(id), rows }` | `multiSelectable?`, `readOnly?`, `rowCount?`, `colCount?`, `containerId?`, `autoFocus?` · cell 단위 focus (treegrid row focus 와 차이). 2D Arrow + Home/End + Ctrl+Home/End. multi 시 Ctrl+Space(col)/Shift+Space(row)/Ctrl+A/Shift+Arrow rect range. cell editing(F2) 은 소비자 |
| `useCarouselPattern` | [`/carousel/`](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) | `(opts) → { index, playing, prev/next/goTo/toggleRotation, rootProps, slideProps(i), prevButtonProps, nextButtonProps, rotationButtonProps, liveRegionProps }` | `slides`, `index?`/`defaultIndex?`, `onIndexChange?`, `autoplay?`, `intervalMs?`, `loop?`, `label?`, `idPrefix?` · autoplay state — focus/hover/explicit 셋 모두 정지. focus 시 explicit pause 도 set (APG 규칙 1). prev/next aria-controls = container id |
| `spinbuttonPattern` | [`/spinbutton/`](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/) | `(data, id, onEvent?, opts?) → { spinbuttonProps }` | `invalid?`, `valueText?`, `readOnly?` · `numericStep` axis 재사용 — Arrow ±step, Home/End min/max, PageUp/Down ±step×10. 단일 focusable element. native `<input type=number>` 가 충분할 때는 우선 |

### 비-recipe (이미 primitive 로 충분)

| 영역 | 이유 |
|---|---|
| **Zoom/Pan** | `useZoomPanGesture` 가 이미 정체성 부합 primitive. compound `ZoomPan.Root` 는 컴포넌트 래퍼라 거부. 사용 가이드만 docs 추가 |
| **Feature / Layout DSL** | `defineFeature` / `definePage` 이미 정체성 부합 |
| **Escape hatch (custom)** | `composeAxes` + `useRovingTabIndex` 직접 — 의도적으로 보존 |

## 신규 axis/hook 갭 (recipe와 별개로 core에 추가 필요)

| 신규 | 용도 | 우선순위 |
|---|---|---|
| `useActiveDescendant(ref, activeId)` | Combobox 의 `aria-activedescendant` 모드 (INVARIANT B11 코드화) | P2 |
| `multiSelect` axis | `aria-multiselectable` 패턴, Shift+Arrow 범위, Ctrl+Click 토글 | ✅ 구현됨 |
| `numericStep` axis | Slider/Splitter Arrow → value step. `aria-valuenow/min/max` 동기 | ✅ 구현됨 |
| `gridNavigate` axis | Grid 2D 셀 단위 (row, col) navigation. ArrowLeft/Right/Up/Down + Home/End + Ctrl+Home/End | ✅ 구현됨 |
| `gridMultiSelect` axis | Grid Ctrl+Space(col) / Shift+Space(row) / Ctrl+A / Ctrl+Click toggle / Shift+Arrow 2D rect range | ✅ 구현됨 |
| `selectionFollowsFocus` symmetric 옵션 | Listbox/Tabs/RadioGroup 셋이 같은 옵션을 같은 이름·같은 디폴트로 받도록 통일 (현재 비대칭) | P1 |

## 횡단 DX (모든 recipe가 자동 부여)

| 항목 | 출처 | 적용 |
|---|---|---|
| **Controlled / Uncontrolled** | VOC 횡단 | recipe 옵션 `value`/`defaultValue` 또는 `<state>`/`default<State>` 둘 다 지원. 내부 `useControlState` 흡수 |
| **`asChild` / 호스트 요소 교체** | VOC 횡단 (router Link 등) | recipe 는 markup 안 그리므로 자연 흡수 — 소비자가 `<a>` 든 `<Link>` 든 자유 |
| **Stable data attrs** | VOC 횡단 | `<part>Props(id)` 가 `data-selected`/`data-highlighted`/`data-disabled`/`data-orientation` 자동 부여 |
| **Stable IDs (SSR-safe)** | VOC 횡단 | `useId` 기반, `id` prop으로 override 허용 |
| **`onEvent` escape hatch** | VOC 횡단 | recipe도 결국 `onEvent` 단일 채널 (INVARIANT B16) |
| **Hook + Compound 이중화** | VOC 횡단 | recipe 는 함수형 hook 스타일만 제공. compound 컴포넌트는 **거부** (정체성 위반) — 소비자 ds 가 wrap |

## VOC ↔ recipe 매핑

| VOC | recipe | 우선순위 |
|---|---|---|
| #1 Toolbar | `useToolbarPattern` (또는 native + `useSpatialNavigation`) | P1 ✅ 이미 1차 가능 |
| #2 Listbox 정적 | `useListboxPattern` | P1 |
| #3 Listbox styled | `useListboxPattern` (DS가 wrap) | P1 |
| #4 Tabs | `useTabsPattern` (`activationMode`) | P1 |
| #5 Menu Button | `useMenuPattern` + `disclosurePattern` + `useDialogModalPattern` 합성 | P2 |
| #6 Menubar | `useMenubarPattern` | P2 |
| #7 Sidebar Navigation | `navigationListPattern` + docs/lint | P3 |
| #8 Combobox | `useComboboxPattern` + `useActiveDescendant` | P2 (axis 갭 동반) |
| #9 Tree | `useTreeviewPattern` | P1 |
| #10 Treegrid | `useTreegridPattern` | P2 |
| #11 ZoomPan | non-recipe (primitive 유지) | docs 만 |
| #12 Splitter | `windowsplitterPattern` + `numericStep` axis | P2 |
| #13 Slider | `sliderPattern` + `numericStep` axis | P2 |
| #14 Disclosure / Accordion | `disclosurePattern` / `useAccordionPattern` | P2 |
| #15 Switch / RadioGroup | `switchPattern` / `useRadioPattern` | P1 (radio) / P2 (switch) |
| #16-19 만족 | — | — |
| #20 DS authoring 가이드 | docs (이 문서가 시작점) | docs |
| #21 Feed (article 스트림) | `useFeedPattern` | P4 ✅ |
| #22 Data Grid (스프레드시트류) | `useGridPattern` + `gridMultiSelect` axis | P4 ✅ |
| #23 Carousel (슬라이드 쇼) | `useCarouselPattern` | P4 ✅ |
| #24 Spinbutton (custom 시·분·통화 picker) | `spinbuttonPattern` | P4 ✅ |

## 구현 순서

1. **L0 코어 갭 보강** — `useActiveDescendant`, `multiSelect`, `numericStep`, `selectionFollowsFocus` symmetric. recipe 없이도 정체성 부합
2. **P1 5개 recipe** — `useListboxPattern` `useTabsPattern` `useTreeviewPattern` `useRadioPattern` `useToolbarPattern`. 우리 composite 5개 마이그레이션으로 dogfood
3. **P2 9개 recipe** — `useMenuPattern` `useMenubarPattern` `useComboboxPattern` `useTreegridPattern` `disclosurePattern` `useAccordionPattern` `sliderPattern` `windowsplitterPattern` `switchPattern`
4. **P3 5개 recipe** — `navigationListPattern` `useDialogModalPattern` `useTooltipPattern` `alertPattern` `alertdialogPattern`
5. **외부 답변** — 거절 케이스(컴파운드 컴포넌트 요구) 정중 거절 + 로드맵 공지

## 정체성 invariant (각 recipe 가 자동 통과해야)

- ✅ 컴포넌트 0건 (recipe = 함수, JSX 0)
- ✅ markup 어휘 0건 (props만 반환, `<ul>`/`<li>` 결정은 소비자)
- ✅ 토큰/CSS 0건
- ✅ INVARIANTS A1~A7 (W3C APG roving tabindex 메커니즘) 보증
- ✅ INVARIANTS B16 (activate 단발 emit) — recipe 는 결국 `onEvent` 한 채널
- ✅ INVARIANTS C17 (출처 없으면 구현 없다) — recipe 의 모든 동작은 axis/gesture 파생, 새 어휘 0
- ✅ 메모리 *Minimize choices for LLM* — `1 role = 1 recipe`
- ✅ 메모리 *Vocabulary closed* — **subpath / 파일명**은 W3C APG `/patterns/` URL slug 그대로. **export 이름**은 React Rules of Hooks 준수 (hook 호출 내장 → `useXPattern`, pure → `xPattern`)
- ✅ INVARIANTS §B-ter (B-ter.1~5) — ARIA-punt 흡수 (backdrop guard · controlled active · listener gating · emit 분리 · on keymap). 각각 `/lab/<slug>` PoC + kernel test 로 검증

# `@interactive-os/aria-kernel` — Canonical Naming Dictionary

> **출처 우선순위**: 1) WAI-ARIA 1.2 → 2) APG patterns URL slug → 3) WHATWG HTML → 4) WCAG.
> 라이브러리·DS(Radix·Material·shadcn) 어휘 차용 ❌. 행동만 차용, 이름은 W3C.
>
> **원칙**: *Minimize choices for LLM* — 1 role = 1 pattern, prop/option 이름은 ARIA 그대로.
> 새 어휘 만들기 전에 grep + 이 표 확인.

## 1. Export 이름 규약

| 형태 | 규칙 | 예 |
|---|---|---|
| `use<Pascal>Pattern` | 내부에 React state(`useState`/`useRef`/`useEffect`) | `useListboxPattern`, `useDialogModalPattern` |
| `<camel>Pattern` | 순수 함수, 외부 주입만 | `switchPattern`, `sliderPattern`, `checkboxPattern` |
| `<camel>Axis` | composeAxes 결과 함수, keyboard mapping SSOT | `listboxAxis`, `gridAxis`, `comboboxAxis` |
| 파일명 | APG URL slug 그대로 (camelCase 변환만) | `treegrid.ts` ← `/treegrid/`, `sliderMultithumb.ts` ← `/slider-multithumb/` |

**파일명 ≠ export 이름**: 파일명은 APG URL slug, export 이름은 React rules-of-hooks 규약.

## 2. 함수 시그니처 — 두 갈래만 존재

### A. Collection (data-driven)
```ts
use<X>Pattern(data: NormalizedData, onEvent?: (e: UiEvent) => void, opts?): { rootProps, ...partProps, items }
```
적용: listbox, tabs, treeview, treegrid, grid, radio, toolbar, menu, menubar, accordion, feed, navigationList, combobox, comboboxGrid, checkboxGroup

### B. Single-value (scalar)
```ts
<x>Pattern(value: T, dispatch?: (e: ValueEvent<T>) => void, opts?): { ...props }
```
적용: switch, slider, sliderMultithumb, windowsplitter, spinbutton, checkbox, disclosure

### C. Stateful preset (no external state)
```ts
use<X>Pattern(opts?): { ...props, open, setOpen, ... }
```
적용: dialogModal, alertdialog, tooltip, carousel, menuButton

**파라미터 이름 고정**: `data` / `onEvent` (collection) — `value` / `dispatch` (scalar). 메모리 *Single data interface — useResource* 정합. 섞지 않는다.

## 3. 반환 prop 이름 — Canonical Map

| 패턴 | 외곽 컨테이너 | Item / Part Props |
|---|---|---|
| listbox | `rootProps` (role=listbox) | `optionProps(id)`, `groupProps(groupId)` |
| tabs | `rootProps` (role=tablist) | `tabProps(id)`, `panelProps(id)` |
| treeview | `rootProps` (role=tree) | `itemProps(id)` (role=treeitem) |
| treegrid | `rootProps` (role=treegrid) | `rowProps(id)`, `columnHeaderProps(id)`, `rowHeaderProps(id)`, `gridcellProps(id)` |
| grid | `rootProps` (role=grid) | `rowProps(id)`, `columnHeaderProps(id)`, `rowHeaderProps(id)`, `cellProps(id)` |
| radio | `rootProps` (role=radiogroup) | `radioProps(id)` |
| toolbar | `rootProps` (role=toolbar) | `itemProps(id)` |
| menu | `rootProps` (role=menu) | `menuitemProps(id)` |
| menubar | `rootProps` (role=menubar) | `menubarItemProps(id)`, `menuProps(topId)`, `menuitemProps(id)` |
| accordion | `rootProps` | `headingProps(id)`, `buttonProps(id)`, `regionProps(id)` |
| feed | `rootProps` (role=feed) | `articleProps(id)`, `labelProps(id)` |
| navigationList | `rootProps` (`<nav>`) | `linkProps(id)` |
| **combobox** | `comboboxProps` (input, role=combobox) ⚠️ no rootProps — APG 예외 | `listboxProps`, `optionProps(id)` |
| comboboxGrid | `comboboxProps` ⚠️ same exception | `gridProps`, `rowProps(id)`, `cellProps(id)` |
| dialogModal | `rootProps` (role=dialog) | `closeProps` |
| alertdialog | `rootProps` (role=alertdialog) | `closeProps` |
| tooltip | `triggerProps` ⚠️ trigger-anchored | `tipProps` (role=tooltip) |
| disclosure | `triggerProps` ⚠️ trigger-anchored | `panelProps` |
| menuButton | `triggerProps` ⚠️ trigger-anchored | `menuProps`, `itemProps(id)` |
| carousel | `rootProps` (role=region) | `slideProps(i)`, `prevButtonProps`, `nextButtonProps`, `rotationButtonProps`, `liveRegionProps`, `tablistProps`, `tabProps(i)` |
| switch | `switchProps` (role=switch) | — |
| slider | `rootProps` | `trackProps`, `rangeProps`, `thumbProps` |
| sliderMultithumb | `rootProps` (role=group) | `trackProps`, `rangeProps`, `thumbProps(index)` |
| windowsplitter | `rootProps` | `handleProps` (role=separator) |
| spinbutton | `spinbuttonProps` (role=spinbutton) | — |
| checkbox | `checkboxProps` (role=checkbox) | — |
| checkboxGroup | `groupProps` (role=group) | `parentProps` (mixed checkbox), `childProps(id)` |
| alert | `rootProps` (role=alert) | — |

**rootProps 규칙**: 패턴에 distinct role 외곽이 1개면 무조건 `rootProps`. 2개 이상(combobox=input+listbox, tooltip=trigger+tip, disclosure=trigger+panel, menuButton=trigger+menu)일 때만 role-name 허용.

**`id` override 금지**: 일부 part-getter (`childProps(id)`, `optionProps(id)`, `rowProps(id)`, `cellProps(id)`, `radioProps(id)` 등) 는 entity id 를 DOM `id` 로 emit. 이 id 는 `aria-controls`/`aria-activedescendant` 의 참조 대상이므로 소비자가 spread 후 `id={...}` 로 덮어쓰면 ARIA 관계가 깨진다. id 는 그대로 둘 것 — 시각 식별 위해선 `data-*` 사용.

## 4. ARIA 어휘 정합 — Option/Prop 이름

### W3C 직역 (변경 금지)
| 이름 | 출처 |
|---|---|
| `aria-orientation` ↔ `orientation: 'horizontal' \| 'vertical'` | ARIA spec |
| `aria-multiselectable` ↔ `multiSelectable: boolean` | ARIA spec |
| `aria-valuetext` ↔ `valueText: (value, index?) => string` | ARIA spec |
| `aria-haspopup` ↔ `haspopup` (option pass-through) | ARIA spec |
| `aria-current` ↔ `'page' \| 'step' \| 'location' \| 'date' \| 'time' \| true` | ARIA spec |
| `aria-label` / `aria-labelledby` ↔ `label?: string` / `labelledBy?: string` | ARIA spec |
| `role` 값 | ARIA roles 그대로 (`'tree'`, `'treegrid'`, `'menubar'`, …) |
| `selectionFollowsFocus: boolean` | APG patterns 명시 용어 |
| `activationMode: 'automatic' \| 'manual'` | APG tabs activation mode 명시 용어 |
| `focusMode: 'roving' \| 'activeDescendant'` | ARIA spec 두 메커니즘 이름 직역 |
| `autocomplete: 'none' \| 'list' \| 'both' \| 'inline'` | APG combobox §autocomplete (`aria-autocomplete` 값) |

### APG behavior 직역
| 이름 | APG 출처 |
|---|---|
| `rearrangeable: boolean` (listbox) | APG "Rearrangeable Listbox" |
| `groups: boolean` (listbox) | APG "Listbox with Grouped Options" |
| `editable: boolean` (combobox) | APG "Editable Combobox" vs "Select-Only" |
| `closeOnSelect: boolean` (menu) | APG menu §"Closing the Menu" |

### 프로젝트 내부 어휘 (W3C 중립, 신중히 추가)
| 이름 | 의미 | 사용처 |
|---|---|---|
| `containerId?: string` | NormalizedData root id (default `ROOT`) | 모든 collection |
| `idPrefix?: string` | useId 기반 안정 ID 네임스페이스 | 모든 패턴 |
| `autoFocus?: boolean` | mount 시 첫 항목 focus | collection |
| `defaultOpen` / `open` / `onOpenChange` | controlled/uncontrolled 짝 | dialogModal, disclosure, menuButton |
| `defaultChecked` / `checked` / `onCheckedChange` | 동일 짝, switch | switch |
| `returnFocusRef` | dialog close 시 focus 복귀 | dialogModal, alertdialog |
| `initialFocusRef` | dialog open 시 첫 focus | dialogModal, alertdialog |
| `active?: string` | controlled active id (외부 SSOT 동기화 시 entities mutation 0) | tabs |
| `backdropProps` | modal backdrop self-target close props | dialogModal |
| `onInteractOutside?: () => void` | 외부 클릭(open 동안 document mousedown) | menu (Radix de facto) |
| `on?: Record<chord, () => void>` | open 동안 window keydown 미들웨어 (editable-guard 준수) | dialogModal |

## 5. 식별된 위반 (현재 코드)

| 위치 | 문제 | 판정 | 처방 |
|---|---|---|---|
| `dialogModal.ts` `alert: boolean` opt | role discriminator via option — *1 role = 1 pattern* 위반 | ✅ **반영 완료** (2026-05-05) | `alert` 제거. `useAlertdialogPattern` 만 `role="alertdialog"` |
| `treegrid.ts` `navMode` | APG 는 "row focus" / "cell focus" | ✅ **반영 완료** (2026-05-05) | `navigationMode: 'row' \| 'cell' \| 'cellOnly'` |
| `checkbox.ts` group: disabled child 가 parent toggle 에 포함 | APG `/checkbox-mixed/` 위반 | ✅ **반영 완료** (2026-05-05) | enabled-only 연산. `disabled` 옵션 + auto-disable + `aria-controls` + label pass-through |
| `toolbar.ts` `entity.itemRole` vs `menu.ts` `entity.kind` | 동일 개념 두 이름 | ⚠️ **백로그** | 하나로 통일. ARIA 어휘 우선이면 `itemRole`, 둘 다 ARIA 직역 아님 — 결정 보류 |
| 일부 패턴 outer 가 `rootProps` 미사용 | combobox/tooltip/disclosure/menuButton 은 메모리 예외 — 허용 | ✅ keep | 문서화만 (이 문서) |

## 6. 거부된 rename 제안 (audit 에서 기각)

| 제안 | 기각 이유 |
|---|---|
| `sliderMultithumbPattern` → range 계열 이름 | APG slug 정본 우선. range 는 de facto 이름이라 채택하지 않음 |
| `parentProps`/`childProps` → `controllerProps`/`controlledProps` | APG mixed checkbox 가 parent/child 어휘 사용. `aria-controls` 와 의미 충돌 |
| `itemRole` → `kind` | ARIA `role` 어휘를 일반어로 희석. 방향 반대 |
| treeview `variant` → `treeviewType` / `semanticRole` | 둘 다 spec 어휘 아님. `semanticRole` 은 `role` 과 충돌 |
| `dispatch` → `onEvent` 일괄 통일 | scalar `(value, dispatch)` / collection `(data, onEvent)` 분리가 의도. 메모리 정합 |
| `idPrefix` 일괄 제거 / 자동화 | SSR id 안정성 위협. 호출부가 충돌 회피용 prefix 필요한 경우 있음 |
| Menu `onEscape` 콜백 제거 | gesture/intent split 의 의도적 hook (`escape axis emit → close + onEscape`). 제거 시 host 가 직접 다뤄야 함 |
| `focusMode` 공통화 (radio/menuButton 외 패턴까지) | 실제 사용 사례 부족. 백로그 |
| Options 일괄 mass-mixin (BasePatternOptions/CollectionOptions extends) | 25+패턴 영향 mechanical 변경. types.ts 에 base type 만 노출하고 mass-extends 는 보류. 신규 pattern 부터 점진 적용 |

## 7. Cheat-sheet — LLM 작성 시 의사결정

```
1. 새 패턴? → APG URL slug 확인 → 파일명 = camelCase(slug)
2. 내부에 useState? → use<X>Pattern, 아니면 <x>Pattern
3. 인자: collection? (data, onEvent, opts) / scalar? (value, dispatch, opts) / preset? (opts)
4. 반환 외곽: 1 role → rootProps / 2+ roles → 각 role 이름
5. 옵션 이름: ARIA 속성 있으면 그대로 직역, 없으면 APG 본문 용어 검색 후 반영
6. 새 어휘 만들기 전 grep — 동의어 있으면 수렴
```

## 8. 참조

- WAI-ARIA 1.2: https://www.w3.org/TR/wai-aria-1.2/
- APG patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- WHATWG HTML: https://html.spec.whatwg.org/multipage/
- 메모리: `~/.claude/projects/-Users-user-Desktop-ds/memory/MEMORY.md`
  - `feedback_canonical_source_w3c_aria` · `feedback_minimize_choices_for_llm` · `feedback_rootprops_when_unique` · `feedback_single_data_interface`
- 자매 문서: [`PATTERNS.md`](./PATTERNS.md) (recipe 명세) · [`INVARIANTS.md`](./INVARIANTS.md) (행동 invariant)

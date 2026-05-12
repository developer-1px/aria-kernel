# VOC Response — Headless Layered Usage Proposal (2026-05)

원 제안: `docs/headless-layered-usage-proposal.md` (1573줄, 20케이스)

본 답변은 **개별 케이스 단위 거절/수용**이 아니라 **정체성 기반 재구조화 응답**입니다. 결론 먼저 — 제안의 *3층 구조* (core + unstyled patterns + DS wrapper) 의 핵심 아이디어를 수용하되, **층 2를 컴포넌트 라이브러리가 아닌 함수형 recipe layer로** 구현했습니다.

---

## TL;DR

| 결정 | 어떻게 |
|---|---|
| ✅ **Recipe layer 추가** | `@p/aria-kernel/patterns` subpath. 19개 APG recipe (`listbox`/`tabs`/`tree`/`combobox`/`menu`/`menubar`/`treegrid`/`disclosure`/`accordion`/`slider`/`splitter`/`toggleSwitch`/`radio`/`toolbar`/`navigationList`/`dialog`/`tooltip`/`alert`/`alertdialog`). |
| ✅ **Combobox `aria-activedescendant` 모드** | `useActiveDescendant` hook 신규. INVARIANT B11 코드화. |
| ✅ **Multi-select / numeric step axis** | `multiSelect`/`numericStep` axis 신규. listbox/slider/splitter 의 재료 갭 해소. |
| ✅ **Sidebar ≠ Listbox 의미 분리** | `navigationList` recipe — `aria-current="page"` + native `<nav>` landmark. |
| ✅ **Stable data attrs 자동 부여** | 모든 recipe 가 `data-selected`/`data-disabled`/`data-state`/`data-orientation` 자동 emit. |
| ✅ **Controlled / Uncontrolled** | `useControlState` 기반 옵션 통일 (`value`/`defaultValue`). |
| ❌ **Compound 컴포넌트 (Tabs.Root/List/Tab/Panel)** | **거절.** 정체성 위반 — 본 패키지는 컴포넌트 래퍼 아님. 이유는 §정체성 참조. |
| ❌ **`asChild` prop** | **자연 흡수.** recipe 가 markup 안 그리므로 소비자가 호스트 element 자유 선택 (`<a>`·`<Link>`·`<button>` 등). prop 자체 불필요. |
| ❌ **Per-pattern subpath** (`@p/aria-kernel/patterns/listbox`) | **거절.** 단일 `@p/aria-kernel/patterns` index + named export. 13개 subpath 폭발 회피. tree-shake는 sideEffects:false 로 결과 동일. |
| ❌ **`tone="danger"` / `radius="md"` 같은 스타일 prop** | **거절.** 토큰/CSS/시각 어휘 0건 invariant. `data-intent` 같은 데이터 속성으로 표시하고 styling 은 DS 책임. |

---

## 정체성 (왜 컴포넌트 래퍼가 아닌가)

`@p/aria-kernel` 는 *수십 년 불변 ARIA 행동 계약 인프라*입니다. Radix·Ariakit·React-Aria·HeadlessUI 와 같은 층(Headless UI 컴포넌트 라이브러리)이 아니라 **그 한 단 아래** — `axis`·`roving tabindex`·`gesture/intent split`·`focus invariant` 를 제공.

| 층 | 예시 | @p/aria-kernel 해당? |
|---|---|---|
| Styled UI | MUI, Mantine, Polaris | ❌ |
| **Headless UI** | **Radix, Ariakit, React-Aria, HeadlessUI** | **❌ (이 층이 아님)** |
| **Behavior infra** | **@p/aria-kernel** | **✅** |
| Lower hooks | floating-ui, downshift | 부분 겹침 |

이 결정의 코드 출처:
- `package.json` description: *"토큰/CSS/UI 어휘 0건"*
- `INVARIANTS.md` A7: *"role 이 키 매핑 계약을 결정한다 (라이브러리 재량 없음)"*
- `INVARIANTS.md` B16: *"ui/ 는 activate 단발 emit; intent 변환은 소비자 담당"*

따라서 `Listbox.Root` / `Listbox.Option` 같은 compound 컴포넌트는 *정체성 위반*. 같은 통증을 해결하는 **다른 형태 — 함수형 recipe** 로 답합니다.

---

## Recipe layer — 시그니처

```ts
import { listbox, tabs, tree, combobox } from '@p/aria-kernel/patterns'

const { rootProps, optionProps, items } = listbox(data, onEvent, opts?)
```

**통일 시그니처**: `(data, onEvent, opts?) → { rootProps, <part>Props(id), items }`

규칙:
- 컴포넌트 0건, JSX 0 — props 만 반환, `<ul>`/`<li>` 결정은 소비자
- `items` 미리 계산된 view (`{id, label, selected, disabled, posinset, setsize, ...}`)
- `<part>Props(id)` 가 stable data attrs (`data-selected`/`data-disabled`/`data-orientation`/`data-focus-visible`) 자동 부여
- `useRovingTabIndex` / `useActiveDescendant` 등 primitive 내부 사용. recipe 사용 거부 시 primitive 직접 조립 가능 (escape hatch)

전체 명세: `packages/aria-kernel/PATTERNS.md`

---

## VOC 20케이스별 응답

| # | 요청 | 응답 |
|---|---|---|
| 1 | Toolbar useSpatialNavigation | `useSpatialNavigation`은 알고리즘 진짜 좌표 기반(`getBoundingClientRect`) 으로 교체. `toolbar` recipe 도 추가 |
| 2 | Listbox 정적 | ✅ `listbox` recipe |
| 3 | Listbox styled | ✅ DS가 wrap. recipe 가 unstyled 베이스 |
| 4 | Tabs (`activationMode`) | ✅ `tabs` recipe + `'automatic'\|'manual'` 옵션 |
| 5 | Menu Button | ✅ `disclosure` + `menu` 합성 |
| 6 | Menubar | ✅ `menubar` recipe |
| 7 | Sidebar Navigation | ✅ `navigationList` recipe — `aria-current="page"`, sidebar≠listbox 강제 |
| 8 | Combobox (`aria-activedescendant`) | ✅ `combobox` recipe + `useActiveDescendant` hook 신규 |
| 9 | Tree | ✅ `tree` recipe |
| 10 | Treegrid | ✅ `treegrid` recipe |
| 11 | Zoom/Pan Canvas | ❌ compound 거절. `useZoomPanGesture` primitive 그대로 — 정체성 부합 |
| 12 | Splitter | ✅ `splitter` recipe + `numericStep` axis 신규 |
| 13 | Slider | ✅ `slider` recipe + `numericStep` axis 신규 |
| 14 | Disclosure / Accordion | ✅ `disclosure`/`accordion` recipe |
| 15 | Switch / RadioGroup | ✅ `toggleSwitch`/`radio` recipe |
| 16 | Data-driven Collection | ✅ 변경 없음 — 이미 `useRovingTabIndex + composeAxes` 만족 사례 |
| 17 | Feature (screen state) | ✅ 변경 없음 — `defineFeature/useFeature` 만족 사례 |
| 18 | Layout DSL | ✅ 변경 없음 — `definePage` 만족 사례 |
| 19 | Escape hatch | ✅ 변경 없음 — primitive 그대로 |
| 20 | DS authoring guide | ✅ `PATTERNS.md` 신규 + 본 응답서 |

20/20 응답. 컴파운드 컴포넌트 형태는 거절했으나 **모든 통증 영역에 대응 경로 제공**.

---

## 횡단 요구 응답

| 횡단 항목 | 응답 |
|---|---|
| Controlled / Uncontrolled | ✅ recipe `value`/`defaultValue` 옵션 통일 |
| `asChild` | ✅ 자연 흡수 — recipe 가 markup 안 그림 |
| Prop getters | ✅ `<part>Props(id)` 가 곧 prop getter |
| `onEvent` escape | ✅ recipe 도 `onEvent` 단일 채널 (INVARIANT B16) |
| Stable data attrs | ✅ recipe 자동 부여 |
| Stable IDs (SSR) | ✅ `idPrefix` 옵션 + 결정적 ID 생성 |
| SSR safety | ✅ render 중 `window` 0건 |
| Compound + Hook 이중화 | ❌ Hook(recipe) 만 — Compound 는 정체성 위반 |

---

## 부수적 변경 (요청에 없으나 같은 라운드 처리)

| 변경 | 이유 |
|---|---|
| `useRoving` → `useRovingTabIndex` | W3C APG "roving tabindex" 자구 정렬. 검색성 |
| `useRovingDOM` → `useSpatialNavigation` | DOM-order 반쪽 spatial 의 의미 모순 해소. W3C `spatnav` 정렬, 진짜 좌표 기반 |
| `activateOnNavigate` → `selectionFollowsFocus` | W3C APG "selection follows focus" 자구 정렬 |
| `@p/aria-kernel/pattern` → `/patterns` | W3C APG `/patterns/` URL 자구 일치 (단/복수 spec 우선) |

---

## 사용 예 — Before / After

### Before (기존, 22줄 boilerplate)

```tsx
import { useRovingTabIndex } from '@p/aria-kernel/roving/useRovingTabIndex'
import { composeAxes, navigate, activate, typeahead } from '@p/aria-kernel/axes'
import { selectionFollowsFocus } from '@p/aria-kernel/gesture'
import { ROOT, getChildren, getLabel, isDisabled } from '@p/aria-kernel/types'

const axis = composeAxes(navigate('vertical'), activate, typeahead)
function Picker({ data, onEvent }) {
  const relay = (e) => selectionFollowsFocus(data, e).forEach(onEvent)
  const { focusId, bindFocus, delegate } = useRovingTabIndex(axis, data, relay)
  const ids = getChildren(data, ROOT)
  return (
    <ul role="listbox" {...delegate}>
      {ids.map((id, i) => (
        <li key={id} ref={bindFocus(id)} role="option"
            tabIndex={focusId === id ? 0 : -1}
            aria-selected={data.entities[id]?.data?.selected ?? false}
            aria-disabled={isDisabled(data, id)}
            aria-posinset={i+1} aria-setsize={ids.length}>
          {getLabel(data, id)}
        </li>
      ))}
    </ul>
  )
}
```

### After (recipe, 8줄 본질)

```tsx
import { listbox } from '@p/aria-kernel/patterns'

function Picker({ data, onEvent }) {
  const { rootProps, optionProps, items } = listbox(data, onEvent)
  return (
    <ul {...rootProps}>
      {items.map((it) => (
        <li key={it.id} {...optionProps(it.id)}>{it.label}</li>
      ))}
    </ul>
  )
}
```

---

## 결론

본 패키지는 **컴포넌트 라이브러리가 되지 않습니다.** 그러나 통증의 본질 — *"매 앱마다 APG wiring 을 다시 만든다"* — 은 같습니다. 그 통증을 *함수형 recipe + stable axis 어휘* 로 해소합니다. 정체성을 지키면서 통증을 줄이는 길.

추가 통증·반대 의견 환영. `PATTERNS.md` 의 시그니처에 대한 피드백, 또는 제공되지 않은 패턴(예: Listbox grid layout, RangeSlider) 요청은 별도 issue 로 받습니다.

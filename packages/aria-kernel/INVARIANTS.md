# ds core — 영속 불변식

> Naming dictionary: [NAMING.md](./NAMING.md) · Recipe 명세: [PATTERNS.md](./PATTERNS.md)

zone(data/composition)·pattern(flat/grouped/caged) 불문하고 뒤집히지 않는 규약. 이 문서의 항목을 깨는 변경은 버그 또는 정책 전환이지 개선이 아니다.

## A. APG 외부 권위 — 뒤집을 수 없음

1. roving group 당 Tab stop = 1개
2. Tab stop 위치 = 마지막으로 포커스된 tabbable item (focus 상태의 파생)
3. activate = `Enter` ∪ `Space` ∪ `click`
4. Home/End = scope 의 양 끝
5. disabled = focus skip + activate 무시
6. Arrow = focus 이동만 (selection 은 별도 의미; selection-follows-focus 는 옵션)
7. role 이 키 매핑 계약을 결정한다 (라이브러리 재량 없음)

## B. ds 아키텍처 선언 — 코드로 보증

8. navigate scope = `parentOf(id).siblings` (`core/axes/navigate.ts` + `core/axes/index.ts`)
9. wrap = 항상 true (`mod()` 강제) — 끝→처음 순환은 선택 아님
10. `focusId` 는 data 전체에 1 개 (`getFocus(data)` 단일 반환)
11. 포커스는 실제 DOM element 에 있다 — `aria-activedescendant` 는 Combobox 1곳 예외
12. tabbable leaf 만 roving 대상 — 장식 노드는 `disabled` 또는 별도 type 으로 `enabledSiblings` 에서 배제
13. Trigger = `key | click` 두 종류 (touch/pointer 는 click 으로 흡수)
14. focus ⊃ global 우선순위 — 로컬 `preventDefault` 가 global shortcut override
15. editable context (`input`/`textarea`/`contenteditable`) 안에선 modifier-less shortcut 차단
16. ui/ 는 activate 단발 emit; intent 변환(expand toggle·selection replace)은 소비자 담당

## B-ter. ARIA-punt 흡수 invariant (lab 가 외부에서 굳힘)

ARIA spec 이 "implementation-defined" 로 punt 한 자리 — kernel 이 흡수. 위반은 정책 전환.

B-ter.1. **Dialog backdrop self-target guard** — modal backdrop click 닫기는 `e.target === e.currentTarget` 일 때만. drag-out (dialog 안에서 시작 → 밖에서 mouseup) 으로 닫히면 안 됨. (`/lab/dialog-backdrop`)
B-ter.2. **Tabs controlled selected = `id === active`** — `active` prop 제공 시 `data.entities[id].selected` 무시. 외부 SSOT 가 있을 때 data mutation 0. (`/lab/tabs-controlled`)
B-ter.3. **Menu listener gating** — `onInteractOutside` 의 document mousedown 리스너는 open=true ∧ onInteractOutside 제공 둘 다 일 때만 부착, open=false 전환 시 cleanup. (`/lab/menu-outside-close` + `menu.test.ts`)
B-ter.4. **Grid emit 분리** — click → `activate` 만, F2 → `editStart` 만, Enter → 둘 다 (chord match + activate axis). 소비자가 dedupe 책임. (`/lab/grid-edit-start`)
B-ter.5. **Dialog `on` keymap = window keydown** — open 인 동안만 부착, modifier-less chord 는 editable-guard 와 동일 규칙으로 입력 위젯 안에서 탈취 안 함. (`/lab/dialog-on-keymap`)
B-ter.9. **Listbox multiselect modifier semantics** — `multiSelectable: true` 일 때 Space=토글, Ctrl/Cmd+Click=개별 토글, Shift+Click=anchor 부터 범위 select. multiSelect axis 가 navigate 보다 먼저 매칭(Shift+Arrow 가로채기). Host reducer = `multiSelectToggle`. (`/lab/listbox-multiselect`)
B-ter.8. **Accordion single mode sibling auto-collapse** — `mode: 'single'` 일 때 한 항목 expand 시 형제 expanded ids 에 대해 `{type:'expand', id:sib, open:false}` 자동 emit. APG: 동시 open 허용은 implementation-defined. (`/lab/accordion-single`)
B-ter.7. **Carousel autoplay pause rules** — hover ∨ focus-within → 자동 정지. explicit toggle 후에는 hover/blur 만으로 재개 ❌ (APG 규칙 1). consumer 가 setInterval 손으로 부착 ❌. (`/lab/carousel-autoplay`)
B-ter.6. **Tooltip delayShow/delayHide** — APG 권장 show ≥ 400ms, hide 짧게. hover/focus 둘 다 show 트리거, blur/mouseleave/Escape 모두 hide. consumer 가 setTimeout 손으로 부착 ❌. (`/lab/tooltip-delay`)

## B-bis. Props 어휘 — role 우선 명명 규칙

23. **Props 이름은 ARIA `role` 그대로**. `treegridProps`·`rowProps`·`columnheaderProps`·`rowheaderProps`·`gridcellProps`·`optionProps`·`tabProps`. `rootProps` 같은 가림 어휘 ❌.
24. **같은 role 이 한 패턴에 여러 번 등장할 때만** 2순위로 **WAI-ARIA / APG spec 의 명사**를 prefix. 예: `role="row"` 가 헤더와 데이터 두 번 → `headerRowProps` (APG 용어) + `rowProps` (기본).
25. **3순위는 `aria-*` 속성명 자체** (예: `activeDescendantProps`). 거의 미사용.
26. 라이브러리·DS 어휘(`itemProps`·`triggerProps`·`firstRowProps`·`titleRowProps`) 차용 ❌.

## C. 논리적 필연 — 정의상 불변

17. 출처 없으면 구현 없다 — typeahead 는 label 출처, disabled-skip 은 disabled 출처 필수
18. homogeneous 집합에서만 "단일 규칙 전체 적용" 성립 — 이질 item 은 composition zone
19. 변경 빈도의 비대칭: role·APG 키 매핑은 **수십 년 단위** 불변, item 스키마는 **릴리즈 단위** 가변. 불변은 core 에, 가변은 `entities.data` 에.

## D. 파생 불변 — 위에서 자동 도출

20. "그룹 내 loop + 그룹 간 Tab" 패턴은 B8·B9 의 자동 귀결 — 특별 구현 불필요, 데이터 구조만 맞추면 됨
21. focusId 변경 시 DOM focus 이동 의무 — B11 유지용 `useFocusBridge` 의 존재 이유
22. Gate 1 탈락(이질 role) 위젯은 영원히 composition — role family 가 ARIA 에서 바뀌기 전까지 정체성 변경 없음

## 위반 감지 체크리스트

- [ ] 어떤 data-driven 위젯이 `children: ReactNode` 도 받는가? → **16 위반 가능** (두 계약 혼합)
- [ ] 어떤 위젯이 `tabIndex={...}` 를 자식에 직접 주입하는데 `useRovingTabIndex*` 을 안 쓰는가? → **1·2 드리프트 위험**
- [ ] 어떤 axis 가 `ROOT` children 을 전역 scope 로 쓰는가? → **8 위반** (그룹 경계 무력화)
- [ ] 어떤 ui/ 컴포넌트가 `onEvent` 로 activate 외의 intent(expand·select)를 자체 방출? → **16 위반**
- [ ] 어떤 global shortcut 이 `defaultPrevented` 체크 없이 발동? → **14 위반** (로컬 override 불가)
- [ ] 어떤 navigate 구현이 wrap 을 false 로 내려받는가? → **9 위반 또는 정책 전환 필요**

## 'layout' 어휘 — 두 스케일 (충돌 아님)

- `ds/layout/` — **page 엔진**. FlatLayout `definePage` + `Renderer` + `registry`. 화면 전체 트리를 데이터로 선언.
- `ds/ui/layout/` — **leaf primitive**. Row/Column/Grid/Separator 등 roving 무관 장식 부품. 메모리 노트상 임시 — definePage 노드로 흡수 가능한 것은 흡수한다.

같은 단어지만 스케일(page vs primitive)이 다르므로 `ui/` 접두로 구분된다. 새 코드는 page 레벨 = `ds/layout`, 부품 레벨 = `ds/ui/layout`.

## 폴더 = zone (단일 진실 원천)

`src/ds/ui/` 의 첫 단계 폴더가 zone. 분류는 정규식 추론이 아니라 **파일 경로**.

| 폴더 | zone | 계약 |
|---|---|---|
| `collection/` | data-driven | `CollectionProps={data, onEvent}` + `useRovingTabIndex`, item 은 leaf variant 의 closed schema |
| `composite/`  | composition roving | `children: ReactNode` + `useSpatialNavigation`, group 단위 Tab stop |
| `control/`    | atomic | 단일 tabbable native element (button/input/textarea/select/progress/...) |
| `overlay/`    | surface | native dialog/popover/details 또는 role=dialog/tooltip/alertdialog |
| `entity/`     | domain card | 2+ 도메인 힌트 속성 (tone, abbr, meta, actions, footer, ...) |
| `layout/`     | primitive · decoration | roving 무관, separator/chart/static list/Row|Column|Grid |

ui/ 직속 또는 미분류 폴더에 컴포넌트 존재 = **drift** (수렴 대상).

`vite-plugin-ds-contracts.ts` 의 `classifyKind(file)` 가 폴더 이름을 그대로 Kind 로 사용. Catalog 페이지는 zone 단위로 그룹 렌더.

## 판별 알고리즘 (zone 결정)

신규 위젯 또는 감사 시 3 gate 순차 적용. 한 gate 라도 NO → composition.

**Gate 1**: 모든 tabbable 자식이 동일 ARIA role family 인가?
**Gate 2**: 각 item 이 유한 variant enum 의 content-poor 튜플로 기술 가능, 그리고 tabbable 은 leaf variant 에만 존재하는가?
**Gate 3**: typeahead / multi-selection / expand / disabled-skip / selection-follows-focus 중 하나 이상이 APG 요구인가?

role family:
- `option`, `treeitem`, `tab`, `radio`, `checkbox` — 단일 role
- `menuitem` family: `menuitem | menuitemcheckbox | menuitemradio`

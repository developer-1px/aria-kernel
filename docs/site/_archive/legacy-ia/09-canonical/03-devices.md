# Devices · 코드에 박힌 5층 장치 트리

헌장(C1~C6)은 추상 원칙이고, 정본 선언은 1행 단위 합의다. 그러나 합의는 코드 안에 장치(mechanism)로 박혀야 작동한다. 이 문서는 ds가 원칙을 강제하기 위해 **실제로 코드에 박아둔 장치**를 한 그림으로 정리한다.

원칙은 추상이지만 장치는 파일·함수·hook·lint 룰로 존재한다. 헌장이 *왜* 라면, devices는 *어디에*다.

## 5층 트리

```
ds (packages/ds/src)
│
├─ ① 정본 어휘 — "무엇을 만들 수 있는가"
│  ├─ ui/                                    [role 컴포넌트, 1 role = 1 component]
│  │  ├─ 0-primitive/   ─ Prose, CodeBlock     (HTML payload entity)
│  │  ├─ 1-indicator/   ─ Badge, Status
│  │  ├─ 2-action/      ─ Button, IconButton, LinkAction, …
│  │  ├─ 3-input/       ─ TextField, SearchBox, Switch, …
│  │  ├─ 4-collection/  ─ Listbox, Menu, Tree, Columns, Grid, Table
│  │  ├─ 5-composite/   ─ Toolbar, Tabs, Accordion
│  │  ├─ 6-overlay/     ─ Dialog, Popover, Tooltip
│  │  ├─ 7-pattern/     ─ ContractCard …            (도메인-중립 패턴)
│  │  └─ 8-layout/      ─ Split, …
│  │
│  ├─ parts/                                 [content 부품, data-part 어휘]
│  │  ├─ Card · Avatar · Badge · Tag · Heading
│  │  ├─ Breadcrumb · Callout · KeyValue · Link
│  │  ├─ Code · Phone · Progress · Skeleton
│  │  ├─ Table · Thumbnail · Timestamp · EmptyState
│  │  └─ ※ root 자동 data-part 박음 → 호출자 자유도 0
│  │
│  └─ layout/                                [페이지 조립 어휘]
│     ├─ definePage      ─ entities tree DSL
│     ├─ defineLayout    ─ shell 정의
│     ├─ defineWidget    ─ widget 등록
│     ├─ registry        ─ 컴포넌트 ID → 구현 매핑
│     └─ recipes/        ─ holyGrail · masterDetail · heroSection · …
│
│
├─ ② 정본 형태 강제 — "어떻게 만들어야 하는가"
│  │
│  ├─ core/                                  [입력/이벤트/상태 단일 인터페이스]
│  │  ├─ types.ts             ─ ControlProps(data, onEvent), UiEvent union
│  │  ├─ trigger.ts           ─ activateProps(onActivate)  ← click + Enter/Space 통합
│  │  ├─ gesture.ts           ─ activate → navigate/expand 도출 헬퍼
│  │  ├─ key.ts               ─ 키 이름 정본
│  │  ├─ flow.ts              ─ defineFlow + useFlow (ui ↔ resource)
│  │  ├─ middleware.ts
│  │  │
│  │  ├─ axes/                ─ roving 축
│  │  │   ├─ activate · navigate · expand · typeahead
│  │  │   ├─ axis            ─ composeAxes
│  │  │   └─ treeNavigate · treeExpand
│  │  │
│  │  ├─ hooks/
│  │  │   ├─ useRovingTabIndex · useSpatialNavigation · useActiveDescendant
│  │  │   ├─ useEventBridge             ─ UiEvent union 라우터
│  │  │   ├─ useShortcut · focus · useControlState
│  │  │   └─ ※ useMemo·useCallback 0개 (SRP 신호)
│  │  │
│  │  ├─ feature/             ─ defineFeature(state, on, query, view, effects)
│  │  │   ├─ useFeature · query · effects
│  │  │
│  │  └─ state/               ─ fromTree · reduce · bind
│  │
│  └─ data.ts                              ─ useResource(value, dispatch)
│
│
├─ ③ 시각 어휘 — "어떻게 보여야 하는가"
│  │
│  ├─ palette/                            [tier 1: raw scale]
│  │  └─ gray N · pad N · elev N
│  │
│  ├─ foundations/                        [tier 2: semantic]
│  │  ├─ color/        semantic · pair · code     ← surface 소유자만 색
│  │  ├─ typography/   scale · rhythm · heading
│  │  ├─ shape/        radius · hairline
│  │  ├─ spacing/      hierarchy · proximity · score   (Gestalt 5단)
│  │  ├─ layout/       container · square · listReset
│  │  ├─ state/        interactive · selection         ← ARIA 셀렉터
│  │  ├─ control/      box · indicator · tokens
│  │  ├─ iconography/  icon
│  │  ├─ elevation/    grouping · shadow
│  │  ├─ motion/       duration · easing
│  │  ├─ primitives/   css                            (mixin 1차)
│  │  └─ recipes/      microLabel · …                 (정본 시각 패턴)
│  │
│  └─ style/                              [tier 3: component-level]
│     └─ ui/* · parts/* · widgets/*       ← semantic만 import. palette 직접 X
│
│
├─ ④ 셀렉터 어휘 — "어떻게 가리키는가"
│  ├─ tag                ─ <button>, <article>, <ul>
│  ├─ role               ─ role="option" 등 (raw role 0개)
│  ├─ aria-*             ─ aria-selected · expanded · current · pressed
│  └─ data-part          ─ ds 부품 namespace (data-ds=레이아웃, data-part=부품)
│     ※ className 0개 — 스타일 전용 클래스 금지
│
│
└─ ⑤ 강제 장치 — "원칙에서 벗어나면 어떻게 막는가"
   │
   ├─ scripts/           [정적 lint — 정본 1:1 매핑]
   │  ├─ lint-ds-contracts        ─ ControlProps 형태 검증
   │  ├─ lint-ds-css              ─ palette 직접 import 차단
   │  ├─ lint-ds-css-orphans      ─ unused style
   │  ├─ lint-ds-invariants       ─ canonical 헌장 위반 감지
   │  ├─ lint-ds-keyboard         ─ roving·activate 미적용
   │  ├─ lint-ds-serializable     ─ state JSON.stringify 가능?
   │  ├─ lint-ds-shell            ─ shell DOM JS 분기 차단
   │  ├─ lint-ds-values           ─ 값 어휘 외부 사용
   │  ├─ lint-flat-layout         ─ definePage 일탈
   │  ├─ audit-ds-css             ─ stylesheet 감사
   │  ├─ audit-hmi                ─ 인터랙션 매트릭스
   │  ├─ aria-xray · aria-tree    ─ ARIA 트리 검증
   │  ├─ role-css-audit
   │  ├─ verify-css-guard
   │  └─ snap-screenshots         ─ UI 진화 스냅샷
   │
   ├─ scripts/hooks/    [git pre-commit hook]
   │  └─ install-git-hook.sh · pre-commit · compare/
   │
   └─ vite-plugin-ds-audit.ts   ─ 빌드 타임 정본 감사
       └─ scan · types
```

## 장치 간 의존 관계

```
원칙 (CANONICAL.md)
  │
  ├──▶ ① 어휘 정의       (ui/ · parts/ · layout/)
  │       │
  │       └──▶ ② 형태 강제   (core — UiEvent union · ControlProps · Flow)
  │              │
  │              └──▶ ③ 시각 강제   (palette → foundations → style)
  │                     │
  │                     └──▶ ④ 셀렉터 강제 (tag · role · aria · data-part)
  │
  └──▶ ⑤ 강제 장치        (scripts/lint-* · vite-plugin · git hook)
         ↑↑↑
         이 5번이 ①~④의 위반을 정적으로 잡아 사람·LLM 관계없이 정본을 박는다.
```

## 핵심 관찰

1. **5층은 동격이 아니라 위계**다. 위층(어휘) 결정이 아래층(형태·시각·셀렉터)을 끌어당기고, 마지막 ⑤ 강제 장치가 4층 전체를 lint로 묶는다.
2. **중복 없는 분포** — 같은 의미가 두 곳에 있지 않다 (foundations만 token 보유, palette는 raw, style은 import만, lint는 검증만).
3. **각 장치는 단일 책임** — `data-part`는 부품 namespace 1개 책임, `defineFeature`는 spec 1개 책임. SRP 위반 시 (예: useMemo) 신호로 본다.
4. **어휘 → lint 1:1 매핑**이 핵심. 정본 1줄이 lint 1개로 직결되지 않으면 정본은 종이 위에서만 산다 — 이 매핑은 [04 · Lint 1:1 매핑](./04-lint-rules.md) 참고.

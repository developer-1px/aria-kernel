# 정본 선언 (영역별)

각 항목 형식:

```
<영역>: <한 줄 정의> · 임시: <만료 조건> · 유산: <마이그레이션 대상>
```

- **정본** — 지금부터 새로 짤 때 이 형태로 짠다.
- **임시** — 지금은 허용. 만료 조건이 충족되면 정본으로 흡수되거나 유산으로 떨어진다.
- **유산** — 마이그레이션 대상. 새로 만들지 않고, 발견하면 정본으로 끌어당긴다.

---

## 레이아웃

- **앱 레이아웃**: `definePage` entities tree + Renderer · 임시: Row/Column/Grid JSX 조립 (이유 명기 시) · 유산: 직접 flexbox 조립
- **레이아웃 셀렉터 namespace**: `data-ds="Row|Column|Grid"`만 허용 · 임시: 없음 · 유산: 그 외 data-ds
- **반응형 분기**: CSS only (viewport·입력장치·해상도) · 임시: 없음 · 유산: matchMedia 훅, JS swipe, IO sync

## 컴포넌트 인터페이스

- **ui/ role 인터페이스**: `ControlProps(data, onEvent)` 데이터 주도 · 임시: 없음 · 유산: children JSX prop
- **gesture/intent**: ui/는 activate 단발 emit, navigate/expand는 ds/core/gesture 헬퍼 · 임시: 없음 · 유산: 컴포넌트 내부 onKeyDown 분기
- **DOM 활성화**: JSX-children 스타일(TreeRow·GridCell 등) 요소의 클릭+Enter/Space 처리는 `activateProps(onActivate)` 헬퍼로 단일화 · 임시: 없음 · 유산: 콜사이트의 onClick + onKeyDown 키 분기
- **roving**: 내부 self-attach (composeAxes 내장) · 임시: 없음 · 유산: 소비자 onKeyDown
- **role=row 그룹**: `useSpatialNavigation` itemSelector='[role="row"]' 명시 · 임시: 없음 · 유산: 기본 TABBABLE 사용

## 데이터 흐름

- **데이터 read/write 인터페이스**: `useResource → (value, dispatch(event))` 단일 인터페이스 · 임시: 없음 · 유산: 종류별 훅
- **ui ↔ resource 연결**: `defineFlow` 1조각 + `useFlow` 한 줄. resource.onEvent가 intent 라우터 흡수 · 임시: 없음 · 유산: 컴포넌트 안의 직접 fetch/dispatch
- **상태 직렬화**: 모든 useState는 JSON 직렬화 가능. DOM ref·함수·Promise 보관 금지 · 임시: 없음

## 콘텐츠

- **콘텐츠 vs 컨트롤**: 비즈니스 콘텐츠는 entity로 분리 (사용처 1곳이어도 entity 승격) · 임시: 없음 · 유산: route 안 인라인 콘텐츠 JSX
- **content widget**: DS 부품 조합 + root 1곳 className(카탈로그). 서브파트 이름 금지 · 임시: 없음
- **신뢰된 HTML payload entity**: 외부 라이브러리가 HTML 문자열로 내놓는 결과(마크다운·코드 하이라이트 등)는 명명된 entity 안에서만 `dangerouslySetInnerHTML`을 사용한다. 정본 entity 위치: `packages/ds/src/ui/0-primitive/` (`Prose`, `CodeBlock`). 라우트·widget이 직접 호출 금지 · 임시: 없음 · 유산: route 안 직접 dangerouslySetInnerHTML

## 셀렉터·스타일

- **셀렉터 어휘**: tag + role + aria + data-part · 임시: 시연/카탈로그 라우트 본문의 raw role · 유산: 스타일 전용 className
- **data-part**: content 부품 어휘 (packages/ds/src/parts/) · 임시: 없음 · 유산: aria-roledescription을 namespace로 쓰는 곳
- **색**: semantic token만 import. palette gray N 직접 X · 임시: foundations 내부 정의 · 유산: 컴포넌트가 palette 직접 import
- **색 weight·opacity**: surface 소유자만 색 보유. item은 `mute()`/`emphasize()` · 임시: 없음 · 유산: cell-level color: dim(N)

## 컬렉션

- **컬렉션 표시**: Table(비교)·List(관리)·Card Grid(시각 브라우징) 3패턴 분류 자체가 정본 · 임시: 없음
- **카드 변형**: ds/parts/Card 슬롯 + 부모 Grid subgrid · 임시: 없음 · 유산: 카드별 커스텀 layout

## 라우팅

- **라우트 정의**: TanStack file-based (apps/<app>/src/routes/<path>.tsx) · 임시: 없음 · 유산: router.tsx 직접 수정
- **cmd+k 등록**: `staticData.palette` · 임시: 없음 · 유산: 별도 등록 코드

## 패키지·플러그인

- **패키지 우선 구조**: pnpm workspace 모노레포. 제품 의의는 ARIA/headless behavior와 검증 인프라 패키지(`@p/aria-kernel` 중심)다. `apps/<X>`와 `showcase/<X>`는 독립 제품이 아니라 패키지를 소비자 관점에서 검사하는 쇼케이스·검증 harness다 · 임시: 없음 · 유산: 앱 구현 안에 재사용 behavior/API를 숨기는 구조
- **디자인 컴포넌트 소유권**: visual component·brand/theme·디자인 토큰 제품 방향성은 이 repo가 아니라 `aria-design-system`이 맡는다. 이 repo의 `@p/ds`는 기존 검증/호환 표면으로만 취급한다 · 임시: 없음 · 유산: `@p/ds`를 디자인 컴포넌트 제품으로 확장하는 구조
- **검증 앱 내부 구조 (FSD)**: 큰 apps/<X>/src/는 실제 사용 시나리오 검증을 위해 FSD 레이어로 분할 가능 — `entities/`(zod schema·types·헬퍼) · `features/`(feature·resources·data·nav 도메인 흐름) · `widgets/`(composite UI 컴포넌트·hook) · 선택 `<variant>/`(mobile 등) · 루트 `index.ts·plugin.ts·style.ts`. 단, 재사용 가능한 계약은 apps가 아니라 `packages/*`에 둔다 · 임시: 작은 검증 앱(파일 ≤ 5개)은 평탄 유지 — 분할 비용 > 이익 · 유산: 큰 앱(>10 파일)이 평탄 분포로 책임 혼재
- **쇼케이스 내부 구조**: showcase/<X>/src/는 보통 평탄 (단일 검증 표면). 큰 시연만 1개 서브폴더(`samples/`·`sections/`·`pages/`·`demos/` 중 의미 정확한 것 1개) · 임시: 없음 · 유산: 한 패키지 안에 같은 종류 서브폴더 2개
- **Plugin manifest**: 패키지마다 `definePlugin({ name, routes?, widgets?, middlewares?, capabilities? })`를 default export. schemas·resources·features는 패키지 내부 detail이라 manifest 등록 대상 아님 · 임시: 없음 · 유산: 라우트가 다른 라우트의 내부에 직접 import
- **Plugin 합산 시점**: 빌드 타임 정적 — `app/plugins.ts`가 정적 import 배열로 모든 manifest를 모음. `composeRegistry(plugins)`가 ds.uiRegistry merge·middleware chain 정렬·capability map 생성을 import 시점 부작용으로 수행 · 임시: 없음 · 유산: 런타임 register() 호출
- **Middleware**: 파이프라인 훅은 `defineMiddleware({ name, phase, fn })` 정본. phase는 `pre-dispatch`·`post-dispatch`·`pre-resource-read`·`post-resource-write` · 임시: 기존 `defineFlow.gestures`는 pre-dispatch 특수 케이스로 흡수됨 — 시그니처 호환 유지 · 유산: 컴포넌트 안의 dispatch 가로채기

## 도메인 엔티티

- **엔티티 정의**: `z.object({...})` 스키마로 선언하고 타입은 `z.infer<typeof X>`로 도출. 스키마 파일은 라우트/도메인 옆 `schema.ts` · 임시: (a) DS 내부 ARIA·DOM prop 타입(ds/core/types.ts) — 만료 조건: 외부 입력 자리에 닿을 때 zod 승격, (b) 내부 reducer 통신용 discriminated union(Cmd·VM) — 만료 조건: URL/스토리지/네트워크 경계 노출 시 zod 승격 · 유산: `routes/*/types.ts`의 도메인 type/interface
- **외부 데이터 진입점**: 외부에서 들어오는 entity는 boundary에서 `Schema.parse(raw)`로 검증 (virtual·fetch·storage·라우트 파라미터 등) · 임시: 없음 · 유산: 진입 지점에서 검증 없이 `as FsNode` 같은 cast

## 네이밍·구조

- **컴포넌트 명명**: Trigger/GroupLabel/Submenu*/TabPanel 별도 export. Radix·Base·Ariakit·RAC 최소 2곳 수렴 시 채택 · 임시: 없음
- **prop 이름**: ARIA 그대로. 인위적 통일 금지 · 임시: 없음
- **escape hatch**: raw `role="..."` 0개 · 임시: 시연/카탈로그 라우트 본문 · 유산: `as` prop (최후 수단)

## 토큰

- **토큰 계층**: palette(raw scale) → foundations(semantic role/slot/mixin) 2층. widget은 semantic만 import · 임시: 없음
- **토큰 변수명 경계**: system-facing CSS 변수는 `--ds-*`가 정본. LLM-facing 공개 subset은 preset 출력의 `--color-bg-*`·`--color-text-*`·`--color-border-*`·`--color-action-*`·`--color-state-*`·`--space-*`·`--radius-*`·`--shadow-*`·`--focus-*`·`--size-*`·`--z-*`·`--duration-*`·`--ease-*` alias만 사용한다. alias의 의미 값은 `--ds-*` 그래프에서 파생하고, `0`·`50%` 같은 CSS 기하 상수만 예외다. component-specific token은 만들지 않는다 · 임시: 없음
- **위계**: foundations/layout/hierarchy.ts atom < section < surface < shell 5단 (Gestalt sys layer) · 임시: 없음

## 문서

- **inbox 문서 폴더**: `docs/YYYY/YYYY-MM/YYYY-MM-DD/` = 사건 발생 날짜 (작성일 X) · 임시: 없음

---

원본 매뉴얼: [`/CANONICAL.md`](../../../CANONICAL.md). 코드 실체: [03 · Devices](./03-devices.md). 강제 장치: [04 · Lint 1:1 매핑](./04-lint-rules.md).

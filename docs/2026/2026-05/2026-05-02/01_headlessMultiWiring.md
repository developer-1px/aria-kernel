---
id: headlessMultiWiring
type: inbox
slug: headlessMultiWiring
title: '@p/aria-kernel multi-select 0% → 100% wiring + 회귀 테스트 + 패키지 진단'
tags: [inbox, headless, multi-select, regression-test, audit]
created: 2026-05-02
updated: 2026-05-02
---

# @p/aria-kernel multi-select wiring + 회귀 테스트 + 패키지 진단

## 시작점 — "지금 헤드리스에서 멀티 셀렉은 전혀 없는데"

확인해보니 자산은 있고 합쳐지지 않은 상태였다.

| 자산 | 위치 | 상태 |
|---|---|---|
| `multiSelect` axis (Shift+Arrow / Ctrl+A / Space) | `axes/multiSelect.ts` | export만 됨 — 어떤 pattern hook의 `composeAxes`에도 안 들어감 |
| `multiSelectToggle` reducer | `state/selection.ts` | export만 됨 — 데모/소비자에서 안 씀 |
| `useListboxPattern({ multiSelectable })` | `patterns/listbox.ts` | `aria-multiselectable` 속성만 root에 붙고 키보드는 single 그대로 |
| `useTreePattern({ selectionMode })` / `useTreeGridPattern({ selectionMode })` | `patterns/{tree,treeGrid}.ts` | 옵션 타입만 선언되고 본문에서 **구조분해도 안 함** |
| `useAccordionPattern({ type: 'single' \| 'multiple' })` | `patterns/accordion.ts` | 미사용. 주석엔 "type='single'은 reducer에서 다른 형제 닫기"라 적혀있는데 그 reducer도 없음 |

또한 `multiSelect` axis와 `multiSelectToggle` reducer의 어휘가 **어긋나 있었다** — axis는 `{ type: 'select' }` 발행, reducer는 `{ type: 'activate' }`만 처리.

## 결정 — API는 옵션, 데모는 별개 케이스

APG 표준이 `aria-multiselectable`을 같은 role 안 분기로 둔다는 점, 그리고 minimize-choices-for-LLM 원칙에 따라:

- listbox / tree / treeGrid → `multiSelectable: boolean` 옵션 (어휘 통일, ARIA 1:1)
- accordion → `type` 옵션 제거. single 모드는 reducer 단편(`singleExpand`)으로 표현
- 데모는 single counterpart는 그대로 두고 `*Multi.tsx` / `accordionSingle.tsx` 별개로 추가 — 키보드 거동 차이를 분명히

## 변경 매니페스트

### Wiring

| 파일 | 변경 |
|---|---|
| `axes/multiSelect.ts` | dead code 제거 (`if (t.kind === 'click')` 중첩), click → `[navigate, select]` |
| `state/selection.ts` | `multiSelectToggle`이 `'activate'` 대신 `'select'` 처리 — single과 어휘 분리 |
| `state/expansion.ts` (신규) | `singleExpand` — `expand:open=true` 시 sibling collapse |
| `state/defaults.ts` | `reduceMultiSelect` 추가 (`reduceSingleSelect`와 paralllel) |
| `patterns/listbox.ts` | `singleAxis`/`multiAxis` 분리, `multiSelectable` 옵션 따라 동적 합성 |
| `patterns/tree.ts` | 미사용 `selectionMode` 제거, `multiSelectable: boolean` 어휘 통일 |
| `patterns/treeGrid.ts` | 동일 |
| `patterns/accordion.ts` | 미사용 `type`/`collapsible` 옵션 제거 |
| `index.ts` · `state/index.ts` | `singleExpand`, `reduceMultiSelect` re-export |

### 데모 (별개 케이스)

- `apps/headless-site/src/demos/listboxMulti.tsx`
- `apps/headless-site/src/demos/treeMulti.tsx`
- `apps/headless-site/src/demos/treeGridMulti.tsx`
- `apps/headless-site/src/demos/accordionSingle.tsx`

## 회귀 테스트 묶음 — 5 files, 40 tests

처음: 1 file, 5 tests (~5% cover)
현재: 5 files, 40 tests

| 파일 | 테스트 | 커버 |
|---|---|---|
| `axes/multiSelect.test.ts` | 9 | Click/Space toggle, Shift+Arrow range (양 끝 no-wrap), Ctrl/Meta+A all-select, plain Arrow fall-through |
| `state/selection.test.ts` | 9 | `singleSelect` ↔ `multiSelectToggle` 어휘 분리 검증 (single은 `activate`만, multi는 `select`만), 둘 합성 시 충돌 없음 |
| `state/expansion.test.ts` | 6 | `singleExpand` sibling collapse, no-op short-circuit (close·empty·자기 자신만) |
| `axes/numericStep.test.ts` | 11 | horizontal/vertical 키 매핑, min/max clamp, Home/End jump, PageUp/Down ×10, 경계 no-op |
| `keyboard-state.test.ts` (기존) | 5 | navigate, selectionFollowsFocus, activate, typeahead, treeExpand |

오늘 발견한 누락(multi-select dist에 들어갔는데 wired-up 안 된 상태)은 이제 `multiSelect` axis 출력 형태가 바뀌거나 reducer 어휘가 어긋나면 즉시 PR 단계에서 잡힌다.

## 우리 axes 인벤토리 (9개)

| axis | 트리거 | 발행 이벤트 |
|---|---|---|
| `navigate(orientation)` | Arrow↑↓/←→·Home/End | `navigate` (wrap 강제) |
| `treeNavigate` | Arrow↑↓·Home/End | `navigate` (visible-flat) |
| `expand` | ArrowRight·ArrowLeft·Enter/Space | `expand`+`navigate` |
| `treeExpand` | (treeview 키 매핑) | `expand`+`navigate` (branchClosed/Open/leaf 분기) |
| `activate` | Enter/Space·click | `activate` (key는 leaf only) |
| `multiSelect` | Click·Space·Shift+Arrow·Ctrl/Meta+A | `select`+`navigate` |
| `typeahead` | printable key | `typeahead`+`navigate` (500ms window) |
| `numericStep(orientation)` | Arrow·Home/End·PageUp/Down | `value` |

조합 헬퍼: `composeAxes(...)` (left-first match), `parentOf`/`siblingsOf`/`enabledSiblings`.

## 패키지 진단 — "프로덕션 급인가?" → **반쯤**

### 갖춘 것

- API 표면 설계는 진지함 — subpath export 9개 분리, ESM+CJS dual+types, `sideEffects: false`
- `INVARIANTS.md` SSoT 22개 invariant 명문화
- ARIA·APG URL 인용으로 출처 추적 가능

### 미달

1. **버전 0.0.1** — 의도된 pre-release 신호
2. **테스트 cover 부족** — 오늘 작업으로 5% → 가시화됐지만 패턴 hook · gesture · roving · focus bridge는 여전히 미커버
3. **multi-select가 오늘까지 wired-up 안 된 채 dist에 release** — 가장 큰 신뢰 균열. 회귀 잡을 테스트 없으니 같은 종류 누락이 더 있을 가능성 높음 (오늘 추가된 회귀 묶음으로 부분 차단)
4. **O(N²) 핫스팟 미해결**:
   - Ctrl+A: N events × entities spread per event = O(N²)
   - 패턴 hook 4개 모두 `items.find(x => x.id === id)` per-row per-render
5. **타입 단언 `as unknown as ItemProps`**가 패턴 hook 4개에 산재
6. **외부 소비자 0** — 같은 repo의 showcase/apps만 dogfood
7. **CHANGELOG·1.0 출시 기준 문서 부재**

## 남은 액션 (우선순위)

1. **Ctrl+A 배치 이벤트** — `selectMany: { ids, to? }` 추가, `multiSelectToggle`에 batch 분기, axis emit 변경. O(N²) → O(N)
2. **패턴 hook의 `items.find` → `Map<string, Item>`** — 4개 hook (listbox/tree/treeGrid/accordion). 1000 row → 1M 비교 → 1k
3. **패턴 hook 통합 테스트** — jsdom + @testing-library/react 도입. `useRovingTabIndex` mount → key dispatch → event/focus/aria 검증
4. **`expand` / `treeExpand` 분기 매트릭스 회귀 테스트** — branchClosed/branchOpen/leaf × ArrowRight/ArrowLeft/Enter/Space
5. **`gesture` 헬퍼 회귀 테스트** — `expandBranchOnActivate`, `expandOnActivate`, `selectionFollowsFocus`
6. **타입 단언 제거** — `as unknown as ItemProps` 4곳
7. **CHANGELOG + 1.0 결정 기준** 명문화
8. **외부 소비자 1+ in production** — 진짜 breaking 표면 노출

## 알게 된 것

- "선언 어휘 + reducer 어휘"가 1:1로 맞아야 한다. `multiSelect` axis가 `select` 발행했는데 `multiSelectToggle`이 `activate`만 처리했던 게 wired-up 실패의 진짜 원인
- 옵션 타입 선언만 두고 본문에서 구조분해도 안 하는 패턴은 dead vocab — 회귀 테스트가 있었으면 첫 PR에서 잡혔을 것
- 같은 spec 어휘를 쓰는 컴포넌트들(listbox/tree/treeGrid)은 옵션 어휘도 같아야 한다 — `selectionMode` vs `multiSelectable` 분기 자체가 dead vocab의 신호
- 데모를 single/multi 별개로 두는 게 source 표시(`?raw` import)에서 self-contained하게 보여주는 데 더 가치 있다 (showcase harness의 핵심 가치)

## 근거

- `/Users/user/Desktop/ds/packages/aria-kernel/src/axes/multiSelect.ts`
- `/Users/user/Desktop/ds/packages/aria-kernel/src/state/selection.ts`
- `/Users/user/Desktop/ds/packages/aria-kernel/src/state/expansion.ts`
- `/Users/user/Desktop/ds/packages/aria-kernel/src/patterns/{listbox,tree,treeGrid,accordion}.ts`
- `/Users/user/Desktop/ds/packages/aria-kernel/src/state/defaults.ts`
- `/Users/user/Desktop/ds/packages/aria-kernel/INVARIANTS.md`
- `/Users/user/Desktop/ds/apps/headless-site/src/demos/{listboxMulti,treeMulti,treeGridMulti,accordionSingle}.tsx`
- `/Users/user/Desktop/ds/packages/aria-kernel/src/{axes/multiSelect,state/selection,state/expansion,axes/numericStep}.test.ts`

## 남은 의문

- 패턴 hook 통합 테스트에 jsdom·@testing-library/react를 도입하면 vitest config·monorepo 의존성 그래프가 어떻게 변하나? 비용/효과 분석 필요
- multi-select anchor/range (Shift+Arrow에서 anchor 사이 채움)는 axis가 책임? reducer가 책임? 현재는 단순 토글만이라 APG strict 미달
- `aria-multiselectable`이 listbox·tree·tablist·grid 모두 지원하는데 ds 측에서 같은 spec 어휘를 컴포넌트마다 별 prop으로 받게 하는 게 옳은지, 컨테이너 prop을 일반화할지

---
product: aria-kernel
slug: source-architecture
title: "Source Architecture"
description: "packages/aria-kernel 내부 디렉터리가 어떤 책임으로 나뉘는지, apps와 site가 어떤 검증 역할을 하는지 설명한다."
section: "03-model"
sectionLabel: "모델"
sectionOrder: 3
order: 2
status: "source-aligned"
source:
  - packages/aria-kernel/src/index.ts
  - packages/aria-kernel/src/patterns/index.ts
  - apps/site/src/routes/patterns.tsx
tags: [architecture, source, package]
---

# Source Architecture

repo는 하나의 제품 패키지와 여러 검증 앱으로 구성된다.

```txt
packages/
  aria-kernel/      product: ARIA/APG behavior layer
  fs/               internal: markdown, file tree, highlight helpers
  source-viewer/    internal: code viewing for site
  devtools/         internal: debugging guides

apps/
  site/             integrated showcase and docs
  finder/           tree data rendered as Finder columns
  slides/           markdown deck harness
  markdown/         markdown viewer harness
  kanban/           board/resource harness
  outliner/         editable tree + zod-crud harness
```

## packages/aria-kernel/src

`@p/aria-kernel`의 public export는 `src/index.ts`가 모은다. 내부 책임은 다음과 같이 나뉜다.

| 경로 | 책임 |
|---|---|
| `types.ts` | `NormalizedData`, `Meta`, `UiEvent`, event category metadata |
| `schema.ts` | zod runtime gates for data and event contracts |
| `axes/` | keyboard/click trigger → `UiEvent[]` primitive |
| `patterns/` | APG recipe APIs returning props getters |
| `roving/` | roving tabindex, active descendant, spatial navigation |
| `gesture/` | activation and derived event helpers |
| `state/` | reducer, builders, selection/value helpers |
| `spec/` | APG keyboard spec mirror and implementation coverage data |

이 구조의 목적은 “동작을 시각으로부터 격리”하는 것이다. `aria-kernel`은 CSS, token, brand, component chrome을 알지 않는다.

## 처음 소스를 읽는 순서

처음 기여하거나 디버깅한다면 전체 폴더를 한 번에 읽지 않는 것이 좋다. 다음 순서가 가장 빠르다.

1. `types.ts`에서 `NormalizedData`와 `UiEvent`를 확인한다.
2. `state/fromTree.ts`에서 데이터가 어떤 형태로 정규화되는지 본다.
3. `axes/axis.ts`에서 axis가 어떤 함수 형태인지 본다.
4. `patterns/listbox.ts`에서 실제 recipe가 axis와 roving을 어떻게 묶는지 본다.
5. `state/reduce.ts`에서 event가 어떤 것은 core에서 처리되고 어떤 것은 host로 넘어가는지 본다.
6. `spec/apgKeyboardSpec.ts`와 `__tests__/apgCoverage.test.ts`에서 APG 정합을 어떻게 추적하는지 본다.

이 순서대로 읽으면 “타입 → 데이터 → 입력 번역 → pattern API → 상태 반영 → 검증” 흐름이 한 번에 연결된다.

## axes

`axes/axis.ts`는 axis의 정본 형태를 정의한다. 각 axis는 `chords` metadata를 노출한다. 그래서 문서와 demo는 구현 함수를 실행하지 않고도 “이 패턴이 어떤 키를 흡수하는가”를 읽을 수 있다.

`fromKeyMap`은 chord와 event template을 선언형 배열로 묶는다. 키보드 분기가 imperative if-else로 흩어지는 것을 막는 장치다.

### 새 key behavior를 찾는 법

어떤 키가 왜 동작하는지 알고 싶다면 다음 순서로 찾는다.

1. pattern 파일에서 `xxxAxis`를 찾는다.
2. 그 axis가 어떤 primitive를 `composeAxes`하는지 본다.
3. primitive axis의 `chords` 또는 key map을 확인한다.
4. event가 reducer에서 처리되는지 host territory인지 확인한다.

예를 들어 listbox의 Shift+Arrow range selection은 `patterns/listbox.ts`의 `listboxAxis`에서 `multiSelect`가 `navigate`보다 앞에 있기 때문에 가능하다. 순서가 바뀌면 일반 navigation이 먼저 key를 흡수해 range branch가 실행되지 않는다.

## patterns

`patterns/*`는 실제 소비자가 주로 호출하는 API다.

예:

- `useListboxPattern`
- `useTreeviewPattern`
- `useTabsPattern`
- `useMenuPattern`
- `navigationListPattern`

패턴은 component를 반환하지 않는다. role/aria props와 items만 반환한다. 이 때문에 소비자는 `<ul>`, `<div>`, table-like layout, custom card layout 등 원하는 markup을 유지할 수 있다.

### pattern 파일에서 볼 것

pattern 파일은 보통 다음 질문에 답한다.

| 질문 | 파일에서 찾을 것 |
|---|---|
| 어떤 role을 쓰는가 | `rootProps`, `itemProps`의 `role` |
| 어떤 aria state를 노출하는가 | `aria-selected`, `aria-expanded`, `aria-current` |
| 어떤 axis를 쓰는가 | `xxxAxis` 함수 |
| focus는 어떻게 붙는가 | `useRovingTabIndex`, `useActiveDescendant` |
| 앱으로 어떤 event가 나가는가 | `relay`, `onEvent`, command descriptor |

이 표를 기준으로 보면 pattern 파일이 길어도 역할별로 분해해 읽을 수 있다.

## state와 store

`state/reduce.ts`는 `UiEvent`의 core 의미를 `NormalizedData`에 반영한다. `packages/resource/src/data.ts`는 React app이 resource를 읽고 쓰는 선택형 인터페이스를 제공한다.

Outliner와 Kanban은 이 구조를 검증한다. 두 앱 모두 zod-crud 문서를 `defineResource`로 감싸고, `routeUiEventToCrud`로 편집 이벤트를 연결한다.

## spec

`spec/apgKeyboardSpec.ts`는 APG keyboard interaction을 데이터로 보존한다. `__tests__/apgCoverage.test.ts`는 APG chord와 implementation chord를 비교한다.

이 테스트는 “문서에 쓰인 접근성 설명”이 아니라 “구현이 실제로 광고하는 chord set”을 검증한다. 그래서 spec drift가 snapshot으로 드러난다.

## apps는 왜 중요한가

`apps/*`는 문서 예제가 아니라 실제 압력 테스트다.

| 앱 | 검증하는 압력 |
|---|---|
| Finder | tree data를 column UI로 렌더링해도 behavior가 유지되는가 |
| Outliner | editable tree command가 CRUD 문서로 이어지는가 |
| Kanban | board domain data가 resource bridge와 맞는가 |
| Slides | markdown content와 keyboard navigation이 분리되는가 |
| Markdown | markdown source rendering이 route와 연결되는가 |

새 public API를 추가했다면 이 앱 중 최소 하나에서 실제 소비자 형태로 써 보는 것이 좋다. API가 demo에서만 예쁘고 실제 앱에서 불편하면 public contract로 부족하다는 신호다.

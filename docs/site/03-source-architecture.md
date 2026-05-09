---
product: aria-kernel
slug: source-architecture
title: "Source Architecture"
description: "packages/aria-kernel 내부 디렉터리가 어떤 책임으로 나뉘는지, apps와 site가 어떤 검증 역할을 하는지 설명한다."
section: "02-model"
sectionLabel: "모델"
sectionOrder: 2
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
| `store/` | resource interface and zod-crud bridge |
| `spec/` | APG keyboard spec mirror and implementation coverage data |

이 구조의 목적은 “동작을 시각으로부터 격리”하는 것이다. `aria-kernel`은 CSS, token, brand, component chrome을 알지 않는다.

## axes

`axes/axis.ts`는 axis의 정본 형태를 정의한다. 각 axis는 `chords` metadata를 노출한다. 그래서 문서와 demo는 구현 함수를 실행하지 않고도 “이 패턴이 어떤 키를 흡수하는가”를 읽을 수 있다.

`fromKeyMap`은 chord와 event template을 선언형 배열로 묶는다. 키보드 분기가 imperative if-else로 흩어지는 것을 막는 장치다.

## patterns

`patterns/*`는 실제 소비자가 주로 호출하는 API다.

예:

- `useListboxPattern`
- `useTreePattern`
- `useTabsPattern`
- `useMenuPattern`
- `navigationListPattern`

패턴은 component를 반환하지 않는다. role/aria props와 items만 반환한다. 이 때문에 소비자는 `<ul>`, `<div>`, table-like layout, custom card layout 등 원하는 markup을 유지할 수 있다.

## state와 store

`state/reduce.ts`는 `UiEvent`의 core 의미를 `NormalizedData`에 반영한다. `store/data.ts`는 React app이 resource를 읽고 쓰는 단일 인터페이스를 제공한다.

Outliner와 Kanban은 이 구조를 검증한다. 두 앱 모두 zod-crud 문서를 `defineResource`로 감싸고, `routeUiEventToCrud`로 편집 이벤트를 연결한다.

## spec

`spec/apgKeyboardSpec.ts`는 APG keyboard interaction을 데이터로 보존한다. `__tests__/apgCoverage.test.ts`는 APG chord와 implementation chord를 비교한다.

이 테스트는 “문서에 쓰인 접근성 설명”이 아니라 “구현이 실제로 광고하는 chord set”을 검증한다. 그래서 spec drift가 snapshot으로 드러난다.

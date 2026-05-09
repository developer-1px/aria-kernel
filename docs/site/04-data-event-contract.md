---
product: aria-kernel
slug: data-event-contract
title: "Data & Event Contract"
description: "NormalizedData와 UiEvent가 왜 이 프로젝트의 핵심 public contract인지, zod schema와 reducer가 어떤 안정성을 제공하는지 설명한다."
section: "03-contract"
sectionLabel: "계약"
sectionOrder: 3
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/types.ts
  - packages/aria-kernel/src/schema.ts
  - packages/aria-kernel/src/state/fromTree.ts
tags: [contract, zod, event]
---

# Data & Event Contract

`@p/aria-kernel`의 public contract는 크게 두 개다.

1. 화면의 구조와 상태를 표현하는 `NormalizedData`
2. UI가 host reducer로 올리는 `UiEvent`

이 둘이 안정적이면 pattern은 바뀌어도 앱의 데이터 rail은 유지된다.

## NormalizedData contract

`fromList`와 `fromTree`는 소비자 데이터를 `NormalizedData`로 바꾼다.

```ts
fromList([
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta', disabled: true },
])

fromTree([
  {
    id: 'docs',
    label: 'Docs',
    children: [{ id: 'intro', label: 'Intro' }],
  },
])
```

builder의 규칙은 의도적으로 적다.

- `id`는 entity key다.
- `children`은 relationship으로 이동한다.
- 나머지 필드는 entity data가 된다.
- shape transform callback은 없다.

옵션이 적은 이유는 consumer마다 다른 adapter 어휘가 생기지 않게 하기 위해서다.

## UiEvent contract

`UiEvent`는 DOM event보다 좁고, domain event보다 낮다.

| DOM 입력 | UiEvent | host 의미 |
|---|---|---|
| ArrowDown | `{ type: 'navigate', dir: 'next' }` | focus 이동 |
| Enter | `{ type: 'activate', id }` | 열기, 선택, route 이동 등 |
| Space on multiselect | `{ type: 'select', ids, to }` | selection state 변경 |
| Backspace in editable tree | `{ type: 'remove', id }` | zod-crud remove |

이벤트 어휘는 `types.ts`와 `schema.ts`가 같이 관리한다. TypeScript type은 개발 중 추론을 제공하고, zod schema는 외부 boundary에서 런타임 gate가 된다.

## 왜 단일 event channel인가

컴포넌트 라이브러리는 흔히 `onSelectionChange`, `onOpenChange`, `onValueChange`, `onAction`처럼 callback을 나눈다. `@p/aria-kernel`은 하나의 `onEvent(UiEvent)`만 사용한다.

이 결정은 다음 문제를 줄인다.

- pattern마다 callback 이름을 외우지 않아도 된다.
- LLM이 여러 callback을 임의 조합하지 않는다.
- reducer composition이 쉬워진다.
- resource adapter가 `UiEvent` 하나만 받으면 된다.

## schema-first boundary

`schema.ts`는 `UiEventSchema`와 `NormalizedDataSchema`를 제공한다. 특히 `navigate`는 zod refine으로 result-form과 intent-form을 동시에 쓰지 못하게 막는다.

```ts
{ type: 'navigate', id: 'a' }      // result-form
{ type: 'navigate', dir: 'next' }  // intent-form
```

둘은 같은 event type이지만 의미 단계가 다르다. 이 구분이 schema에 들어 있기 때문에 잘못된 선언은 boundary에서 빠르게 실패한다.

## contract가 해결하는 문제

이 구조는 접근성 구현을 “컴포넌트 안의 분기”에서 “검증 가능한 데이터 계약”으로 옮긴다.

- UI는 props getter를 spread한다.
- pattern은 `UiEvent`를 emit한다.
- reducer는 core 영역만 처리한다.
- host는 domain effect만 처리한다.

결과적으로 화면이 달라도 같은 event vocabulary를 공유한다.

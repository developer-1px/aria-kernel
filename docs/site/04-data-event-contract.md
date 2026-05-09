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

## 강의식으로 보면: 두 개의 레일

이 패키지를 “두 개의 레일”로 이해하면 쉽다.

```txt
Data rail   : entities / relationships / meta
Event rail  : UiEvent
```

Data rail은 현재 화면이 어떤 상태인지 설명한다. Event rail은 사용자가 무엇을 의도했는지 설명한다. pattern recipe는 이 둘 사이를 오간다.

예를 들어 tree에서 `ArrowRight`를 누르면 data rail의 `relationships`와 `meta.expanded`를 읽어야 한다. 닫힌 parent면 expand event를 만들고, 이미 열려 있으면 child로 navigate한다. 같은 key라도 data 상태에 따라 의미가 달라진다.

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

## 잘못된 데이터 형태와 정규화된 데이터

처음에는 다음처럼 tree를 component에 바로 넘기고 싶을 수 있다.

```ts
const files = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'index.ts', label: 'index.ts' },
    ],
  },
]
```

이 형태는 사람이 읽기 쉽지만, focus 이동이나 sibling 탐색을 할 때 매번 재귀 탐색이 필요하다. 그래서 kernel은 다음처럼 나눠서 본다.

```ts
{
  entities: {
    src: { label: 'src' },
    'index.ts': { label: 'index.ts' },
  },
  relationships: {
    src: ['index.ts'],
  },
  meta: {
    root: ['src'],
  },
}
```

이제 “src의 자식”, “현재 항목의 sibling”, “root 항목” 같은 질문이 일정한 방식으로 해결된다.

## UiEvent contract

`UiEvent`는 DOM event보다 좁고, domain event보다 낮다.

| DOM 입력 | UiEvent | host 의미 |
|---|---|---|
| ArrowDown | `{ type: 'navigate', dir: 'next' }` | focus 이동 |
| Enter | `{ type: 'activate', id }` | 열기, 선택, route 이동 등 |
| Space on multiselect | `{ type: 'select', ids, to }` | selection state 변경 |
| Backspace in editable tree | `{ type: 'remove', id }` | zod-crud remove |

이벤트 어휘는 `types.ts`와 `schema.ts`가 같이 관리한다. TypeScript type은 개발 중 추론을 제공하고, zod schema는 외부 boundary에서 런타임 gate가 된다.

## event를 직접 읽는 연습

다음 event를 보면 앱이 무엇을 해야 할지 대략 추론할 수 있어야 한다.

```ts
{ type: 'select', ids: ['a'], anchor: true }
```

단일 항목을 선택하고 selection anchor도 갱신한다.

```ts
{ type: 'select', ids: ['a', 'b', 'c'], to: true }
```

여러 항목을 additive하게 선택한다. range selection이나 select all에서 나올 수 있다.

```ts
{ type: 'open', id: 'menu-file', open: true }
```

popover, menu, dialog처럼 open state를 가진 대상이 열린다.

```ts
{ type: 'insertAfter', siblingId: 'node-3' }
```

편집 가능한 tree/list에서 현재 항목 뒤에 새 entity를 삽입하려는 의도다. kernel core reducer는 이 event를 직접 처리하지 않고 host reducer 또는 zod-crud adapter로 넘긴다.

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

### schema가 잡는 실수

다음 event는 틀렸다.

```ts
{ type: 'navigate', id: 'a', dir: 'next' }
```

`id`는 이미 계산된 결과 focus이고, `dir`은 아직 계산 전인 의도다. 둘을 동시에 넣으면 “결과를 믿을지, 방향을 다시 계산할지”가 모호해진다. `UiEventSchema`는 이 경우를 거부한다.

반대로 다음 둘은 각각 유효하다.

```ts
{ type: 'navigate', id: 'a' }
{ type: 'navigate', dir: 'next' }
```

이 작은 제약이 reducer와 axis 사이의 책임을 선명하게 만든다.

## contract가 해결하는 문제

이 구조는 접근성 구현을 “컴포넌트 안의 분기”에서 “검증 가능한 데이터 계약”으로 옮긴다.

- UI는 props getter를 spread한다.
- pattern은 `UiEvent`를 emit한다.
- reducer는 core 영역만 처리한다.
- host는 domain effect만 처리한다.

결과적으로 화면이 달라도 같은 event vocabulary를 공유한다.

## 미니 체크리스트

새 pattern 또는 앱 adapter를 만들 때는 다음을 확인한다.

- 새 데이터가 외부 boundary를 통과한다면 zod schema가 있는가?
- focus, expanded, open 같은 보조 상태를 domain entity에 섞지 않았는가?
- DOM event를 reducer까지 넘기지 않고 `UiEvent`로 낮췄는가?
- event가 core-reduced인지 host territory인지 분명한가?
- 같은 의미를 가진 event가 이미 `UiEvent`에 있지는 않은가?

---
product: aria-kernel
slug: faq
title: "FAQ"
description: "도입 전 자주 나오는 질문과 @p/aria-kernel의 명확한 비목표를 정리한다."
section: "05-ops"
sectionLabel: "운영"
sectionOrder: 5
order: 2
status: "source-aligned"
source:
  - packages/aria-kernel/src/index.ts
  - packages/aria-kernel/src/patterns/navigationList.ts
  - README.md
tags: [faq, adoption]
---

# FAQ

## 이 프로젝트는 디자인 시스템인가?

아니다. 현재 repo의 제품은 `@p/aria-kernel`이고, 역할은 ARIA/APG behavior layer다. visual component, brand theme, design token 제품화는 이 repo의 목표가 아니다.

다르게 말하면, 이 패키지는 버튼 색이나 카드 모양을 정하지 않는다. 대신 listbox에서 어떤 키가 focus를 어디로 옮기는지, tree에서 닫힌 parent에 ArrowRight가 들어오면 무엇을 해야 하는지 같은 행동 계약을 다룬다.

## Radix나 React Aria와 무엇이 다른가?

Radix는 headless component를 제공한다. React Aria는 강력한 hook과 collection model을 제공한다. `@p/aria-kernel`은 그보다 더 낮은 층위에서, APG 상호작용을 `NormalizedData`와 `UiEvent` 계약으로 제공한다.

가장 큰 차이는 다음이다.

- component를 제공하지 않는다.
- markup을 결정하지 않는다.
- style을 제공하지 않는다.
- event channel을 `onEvent(UiEvent)` 하나로 유지한다.
- APG chord coverage를 source-level 데이터로 추적한다.

예를 들어 Radix를 쓰면 `DropdownMenu.Root`, `DropdownMenu.Trigger`, `DropdownMenu.Item` 같은 component vocabulary를 사용한다. `@p/aria-kernel`에서는 menu behavior가 event와 props getter로 나오고, markup과 component vocabulary는 소비자 쪽에 남는다.

## 그러면 소비자가 너무 많은 markup을 직접 써야 하지 않나?

소비자는 markup을 직접 쓴다. 하지만 keyboard behavior와 aria state는 recipe가 props getter로 제공한다.

이 trade-off는 의도적이다. 이 프로젝트는 chrome을 줄이고 behavior를 재사용하기 위해 존재한다.

소비자가 직접 써야 하는 것:

- element 선택
- class/style
- item label rendering
- 앱별 activation effect

recipe가 제공하는 것:

- role
- aria state
- focus binding
- keyboard handler
- pattern-specific item projection

## LLM을 왜 문서에서 계속 언급하나?

이 프로젝트의 실무 배경은 LLM codegen이다. LLM은 자유도가 높은 API에서 같은 의도를 여러 방식으로 표현한다. `@p/aria-kernel`은 behavior vocabulary를 좁혀서 같은 상호작용이 같은 event/data 형태로 수렴하게 한다.

다만 패키지는 LLM 전용 도구가 아니다. 사람이 직접 사용하는 React 앱에서도 같은 이점을 얻는다.

## navigationList가 왜 listbox가 아닌가?

site sidebar나 문서 navigation은 선택 widget이 아니다. 현재 페이지를 가리키는 link 목록이다. 따라서 `role="listbox"`와 `aria-selected`가 아니라 native `<nav>`, `<a>`, `aria-current="page"`가 맞다.

이 판단은 `patterns/navigationList.ts`에 recipe로 들어 있다.

## `activate`와 `select`는 왜 분리되어 있나?

둘은 사용자 관점에서도 다르다. `select`는 항목을 선택 상태로 만드는 의미다. `activate`는 항목의 기본 동작을 실행하는 의미다.

예를 들어 파일 목록에서 클릭 한 번은 선택이고, Enter는 열기일 수 있다. 메뉴에서는 Enter가 명령 실행이다. tree에서는 Space가 선택이고 ArrowRight가 expand일 수 있다. 이 차이를 하나의 `onClick`으로 뭉개면 앱마다 의미가 섞인다.

## 왜 `NormalizedData`가 필요한가? 그냥 배열로는 부족한가?

flat list만 있다면 배열로 충분해 보인다. 하지만 tree, grouped listbox, treegrid, selection anchor, expanded state가 들어오면 배열만으로는 공통 traversal을 만들기 어렵다.

`NormalizedData`는 “항목”, “관계”, “UI 보조 상태”를 분리한다. 이 분리 덕분에 pattern들이 같은 방식으로 root, child, sibling, focus를 읽을 수 있다.

## 언제 쓰지 말아야 하나?

다음 경우에는 이 패키지가 맞지 않을 수 있다.

- 완성된 visual component library가 필요하다.
- design token, theme, brand system을 같이 원한다.
- APG 수준의 키보드 정합보다 빠른 prototype이 우선이다.
- DOM 구조를 라이브러리가 전부 결정해 주길 원한다.
- 자체 collection abstraction을 이미 깊게 사용하고 있다.

## 가장 먼저 읽을 소스는?

추천 순서는 다음이다.

1. `packages/aria-kernel/src/types.ts`
2. `packages/aria-kernel/src/axes/axis.ts`
3. `packages/aria-kernel/src/patterns/listbox.ts`
4. `packages/aria-kernel/src/state/reduce.ts`
5. `packages/aria-kernel/src/spec/apgKeyboardSpec.ts`

이 다섯 파일을 보면 프로젝트의 public vocabulary, behavior primitive, pattern recipe, reducer split, APG 검증 전략이 모두 보인다.

## 첫 기여로 좋은 작업은?

처음 기여한다면 새 pattern을 바로 추가하기보다 다음이 좋다.

- 기존 pattern 문서에 source trace와 예제 보강
- APG coverage gap 확인
- demo에서 keyboard behavior 재현
- `UiEventSchema`와 `UiEvent` type의 정합 확인
- 앱 harness에서 같은 event가 반복 매핑되는 곳 찾기

이 작업들이 프로젝트의 구조를 이해하는 가장 빠른 길이다.

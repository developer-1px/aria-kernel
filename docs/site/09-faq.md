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

## Radix나 React Aria와 무엇이 다른가?

Radix는 headless component를 제공한다. React Aria는 강력한 hook과 collection model을 제공한다. `@p/aria-kernel`은 그보다 더 낮은 층위에서, APG 상호작용을 `NormalizedData`와 `UiEvent` 계약으로 제공한다.

가장 큰 차이는 다음이다.

- component를 제공하지 않는다.
- markup을 결정하지 않는다.
- style을 제공하지 않는다.
- event channel을 `onEvent(UiEvent)` 하나로 유지한다.
- APG chord coverage를 source-level 데이터로 추적한다.

## 그러면 소비자가 너무 많은 markup을 직접 써야 하지 않나?

소비자는 markup을 직접 쓴다. 하지만 keyboard behavior와 aria state는 recipe가 props getter로 제공한다.

이 trade-off는 의도적이다. 이 프로젝트는 chrome을 줄이고 behavior를 재사용하기 위해 존재한다.

## LLM을 왜 문서에서 계속 언급하나?

이 프로젝트의 실무 배경은 LLM codegen이다. LLM은 자유도가 높은 API에서 같은 의도를 여러 방식으로 표현한다. `@p/aria-kernel`은 behavior vocabulary를 좁혀서 같은 상호작용이 같은 event/data 형태로 수렴하게 한다.

다만 패키지는 LLM 전용 도구가 아니다. 사람이 직접 사용하는 React 앱에서도 같은 이점을 얻는다.

## navigationList가 왜 listbox가 아닌가?

site sidebar나 문서 navigation은 선택 widget이 아니다. 현재 페이지를 가리키는 link 목록이다. 따라서 `role="listbox"`와 `aria-selected`가 아니라 native `<nav>`, `<a>`, `aria-current="page"`가 맞다.

이 판단은 `patterns/navigationList.ts`에 recipe로 들어 있다.

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

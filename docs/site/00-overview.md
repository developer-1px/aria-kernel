---
product: aria-kernel
slug: overview
title: "@p/aria-kernel 공식 기술 개요"
description: "WAI-ARIA/APG 상호작용을 React 앱에서 재사용 가능한 데이터·이벤트 계약으로 분리하는 headless behavior layer의 목적과 범위를 설명한다."
section: "01-start"
sectionLabel: "시작"
sectionOrder: 1
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/index.ts
  - packages/aria-kernel/src/types.ts
  - README.md
tags: [overview, korean, source]
---

# @p/aria-kernel 공식 기술 개요

`@p/aria-kernel`은 시각 컴포넌트 라이브러리가 아니다. 이 패키지는 WAI-ARIA와 APG가 요구하는 키보드 이동, 포커스, 선택, 열림/닫힘, 값 변경 같은 **행동 계약**을 React에서 재사용 가능한 headless layer로 제공한다.

프로젝트의 핵심 판단은 간단하다.

> 접근성 동작은 매 화면에서 다시 구현할 대상이 아니라, 데이터와 이벤트 위에서 검증 가능한 계약이어야 한다.

## 30초 그림

`@p/aria-kernel`을 처음 볼 때 가장 쉬운 그림은 “화면을 그리는 도구”가 아니라 “화면 뒤에서 키보드·포커스 의미를 번역하는 엔진”으로 이해하는 것이다.

```txt
사용자 입력
  ArrowDown / Enter / Space / Click
        |
        v
@p/aria-kernel
  APG 규칙에 맞게 의미 이벤트로 번역
        |
        v
앱 reducer
  focus, selection, open, edit, CRUD 반영
        |
        v
React markup
  소비자가 원하는 모양으로 렌더링
```

예를 들어 사용자가 listbox에서 `ArrowDown`을 누르면, 앱은 직접 “다음 enabled option이 누구인지”를 매번 계산하지 않는다. pattern recipe가 현재 `NormalizedData`를 읽고 `{ type: 'navigate', dir: 'next' }` 또는 결과 focus event를 만들고, reducer가 `meta.focus`를 갱신한다.

## 먼저 알아야 할 용어

처음 읽는 사람을 위해 이 문서에서 반복되는 용어를 먼저 고정한다.

| 용어 | 뜻 | 비유 |
|---|---|---|
| `NormalizedData` | 화면의 항목과 구조를 담는 표준 데이터 | 좌석 배치도 |
| `Meta` | focus, expanded, open 같은 UI 보조 상태 | 현재 어디를 보고 있는지 표시한 포스트잇 |
| `Axis` | 입력을 의미 이벤트로 바꾸는 작은 규칙 | “아래 화살표는 다음 항목으로”라는 한 줄 규칙 |
| Pattern recipe | APG pattern 단위의 조립된 행동 API | listbox/tree/menu별 수업 교안 |
| `UiEvent` | UI가 앱에 올리는 의미 이벤트 | DOM event를 번역한 업무 요청서 |
| Host reducer | 앱이 소유하는 최종 상태 반영 로직 | 업무 요청서를 실제 데이터 변경으로 처리하는 부서 |

이 용어만 잡히면 나머지 문서는 같은 모델의 다른 각도를 설명한다.

## 제품의 경계

이 repo의 제품은 `packages/aria-kernel`이다. `apps/*`와 `apps/site`는 제품이 아니라 소비자 관점의 검증 harness다. 즉 Finder, Slides, Markdown, Kanban, Outliner는 각각 독립 제품을 키우는 공간이 아니라 `@p/aria-kernel`의 API가 실제 앱 구조에서도 버티는지 확인하는 표면이다.

패키지는 다음을 소유한다.

| 영역 | 소유하는 것 | 소유하지 않는 것 |
|---|---|---|
| 데이터 | `NormalizedData`, `Meta`, `fromList`, `fromTree` | 도메인 entity의 최종 schema |
| 이벤트 | `UiEvent`, `UiEventSchema`, reducer identity/core split | 화면별 비즈니스 effect |
| 행동 | axes, roving tabindex, active-descendant, pattern recipes | Tailwind class, brand theme, component chrome |
| 검증 | APG keyboard spec mirror, implementation chord matrix | 디자인 토큰 품질 |
| 연결 | resource/store adapter, zod-crud bridge | 서버 API 또는 DB 모델 |

## 가장 작은 예제

다음 예제는 “과일 목록을 키보드로 이동하고 선택할 수 있게 만드는” 최소 흐름이다.

```tsx
import { fromList, reduce } from '@p/aria-kernel'
import { useListboxPattern } from '@p/aria-kernel/patterns'
import { useState } from 'react'

const initial = fromList([
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
])

export function FruitListbox() {
  const [data, setData] = useState(initial)
  const onEvent = (event) => setData((prev) => reduce(prev, event))
  const { rootProps, optionProps, items } =
    useListboxPattern(data, onEvent, { label: 'Fruits' })

  return (
    <ul {...rootProps}>
      {items.map((item) => (
        <li key={item.id} {...optionProps(item.id)}>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
```

여기서 중요한 점은 `ul`과 `li`의 모양은 소비자가 결정하지만, listbox role, option role, roving focus, keyboard handler는 recipe가 제공한다는 것이다. 이 예제를 이해하면 `tree`, `tabs`, `menu`, `grid`도 같은 방식으로 읽을 수 있다.

## 왜 문서도 Markdown 기반인가

이 문서 사이트는 `docs/site/*.md`를 source of truth로 삼는다. route는 frontmatter가 `product: aria-kernel`인 문서만 게시한다. 예전 `ds` 방향성 초안은 보존되지만, 공식 사이트에는 노출되지 않는다.

이 구조를 택한 이유는 코드와 같다.

- 문서가 React JSX에 묻히지 않는다.
- frontmatter가 문서의 공개 여부, 순서, source trace를 선언한다.
- 같은 문서를 사이트, LLM context, release note로 재사용할 수 있다.
- 문서 변경 diff가 UI 변경 diff와 분리된다.

## 읽는 순서

처음 읽는다면 다음 순서가 가장 빠르다.

1. [왜 만들었나](./01-why.md)
2. [첫 번째 Listbox 만들기](./10-first-listbox-tutorial.md)
3. [Core Concept](./02-core-concept.md)
4. [Source Architecture](./03-source-architecture.md)
5. [Data & Event Contract](./04-data-event-contract.md)
6. [Behavior Patterns](./05-behavior-patterns.md)

운영·검증 관점은 [Showcase & Verification](./07-showcase-verification.md)에서 다룬다.

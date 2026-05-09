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
2. [Core Concept](./02-core-concept.md)
3. [Source Architecture](./03-source-architecture.md)
4. [Data & Event Contract](./04-data-event-contract.md)
5. [Behavior Patterns](./05-behavior-patterns.md)

운영·검증 관점은 [Showcase & Verification](./07-showcase-verification.md)에서 다룬다.

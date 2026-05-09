---
product: aria-kernel
slug: showcase-verification
title: "Showcase & Verification"
description: "apps/site와 apps/*가 제품이 아니라 API 검증 표면으로 존재하는 이유와 검증 기준을 설명한다."
section: "04-runtime"
sectionLabel: "런타임"
sectionOrder: 4
order: 2
status: "source-aligned"
source:
  - apps/site/src/routes/patterns.tsx
  - apps/site/src/routes/docs.$slug.tsx
  - apps/outliner/src/resource.ts
  - apps/kanban/src/features/boardResource.ts
tags: [showcase, verification, site]
---

# Showcase & Verification

이 repo의 `apps/*`는 독립 제품이 아니다. 각 앱은 `@p/aria-kernel`이 실제 소비자 코드에서도 작동하는지 확인하는 검증 harness다.

## site

`apps/site`는 통합 배포 surface다. 다음을 한 곳에 모은다.

- pattern catalog
- axes/reference pages
- wrappers
- demo apps
- Markdown 기반 공식 문서
- `/llms.txt`, `/llms-full.txt`

라우팅은 TanStack file-based routing을 사용한다. 각 route는 `staticData.palette`를 노출하고, sidebar와 landing은 palette를 수집해 navigation을 구성한다.

## Finder

Finder는 tree 데이터를 column view로 그리는 검증 표면이다. 이 앱은 “데이터 구조와 시각 표현이 다르다”는 프로젝트 문제 정의를 직접 검증한다.

검증하는 것:

- tree traversal
- route-like path navigation
- keyboard-first browsing
- source/file preview integration

## Slides

Slides는 Markdown deck harness다. 줄 단독 `---`를 slide boundary로 쓰고, keyboard navigation으로 deck을 이동한다.

검증하는 것:

- content source와 runtime view 분리
- keyboard paging
- markdown source reuse

## Outliner

Outliner는 editable tree와 zod-crud bridge를 검증한다.

검증하는 것:

- tree command descriptor
- `insertAfter`, `appendChild`, `remove`, `move`
- undo/redo
- resource subscription

## Kanban

Kanban은 board-like domain data와 CRUD resource 연결을 검증한다.

검증하는 것:

- host-owned board schema
- resource adapter
- `UiEvent` → domain operation bridge

## 공식 문서 사이트 검증

이 문서 사이트 자체도 검증 표면이다.

- 문서는 `docs/site/**/*.md`에 있다.
- frontmatter schema는 zod로 검증한다.
- `product: aria-kernel`인 문서만 게시한다.
- Markdown 내부 link는 route href로 변환된다.
- route는 HTML payload를 `MarkdownArticle` entity로 격리한다.

즉 문서도 선언으로부터 렌더된다. 이 프로젝트의 핵심 원칙과 같은 방식이다.

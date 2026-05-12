---
product: aria-kernel
slug: showcase-verification
title: "Showcase & Verification"
description: "apps/site와 apps/*가 제품이 아니라 API 검증 표면으로 존재하는 이유와 검증 기준을 설명한다."
section: "05-runtime"
sectionLabel: "런타임"
sectionOrder: 5
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

## 왜 showcase가 문서보다 강한 검증인가

문서 예제는 이상적인 상황을 보여준다. 하지만 실제 앱은 훨씬 지저분하다.

- route param이 있다.
- 외부 파일을 읽는다.
- focus와 selection이 동시에 변한다.
- keyboard command와 mouse click이 같은 effect로 이어져야 한다.
- undo/redo, clipboard, persistence가 끼어든다.

`apps/*`는 이런 실제 압력을 제공한다. 그래서 새 API가 “예제에서는 좋아 보이지만 앱에서는 불편한지”를 빠르게 드러낸다.

## site

`apps/site`는 통합 배포 surface다. 다음을 한 곳에 모은다.

- pattern catalog
- axes/reference pages
- wrappers
- demo apps
- Markdown 기반 공식 문서
- `/llms.txt`, `/llms-full.txt`

라우팅은 TanStack file-based routing을 사용한다. 각 route는 `staticData.palette`를 노출하고, sidebar와 landing은 palette를 수집해 navigation을 구성한다.

### site에서 확인할 것

공식 문서 또는 pattern 변경 후 site에서 최소한 다음을 확인한다.

- `/docs/overview`가 열린다.
- sidebar에서 문서 섹션이 보인다.
- “이 문서” TOC가 heading과 맞는다.
- `/patterns`, `/wrappers`, `/data`, `/uievents`, `/axes` 링크가 유지된다.
- browser console error가 없다.

## Finder

Finder는 tree 데이터를 column view로 그리는 검증 표면이다. 이 앱은 “데이터 구조와 시각 표현이 다르다”는 프로젝트 문제 정의를 직접 검증한다.

검증하는 것:

- tree traversal
- route-like path navigation
- keyboard-first browsing
- source/file preview integration

### Finder가 중요한 이유

Finder는 classic tree view가 아니다. 같은 tree data를 column으로 보여준다. 이 앱이 통과한다는 것은 `@p/aria-kernel`이 “tree component”가 아니라 “tree behavior”를 제공한다는 주장을 검증한다.

## Slides

Slides는 Markdown deck harness다. 줄 단독 `---`를 slide boundary로 쓰고, keyboard navigation으로 deck을 이동한다.

검증하는 것:

- content source와 runtime view 분리
- keyboard paging
- markdown source reuse

### Slides가 중요한 이유

Slides는 content source가 Markdown이고, runtime UI는 deck이다. source format과 interaction format이 다르다. 이 차이는 “source를 선언으로 유지하고, runtime behavior를 별도 layer로 연결한다”는 운영 방식을 검증한다.

## Outliner

Outliner는 editable tree와 zod-crud bridge를 검증한다.

검증하는 것:

- tree command descriptor
- `insertAfter`, `appendChild`, `remove`, `move`
- undo/redo
- resource subscription

### Outliner가 중요한 이유

Outliner는 keyboard-heavy 앱이다. Enter, Backspace, Tab, Shift+Tab, paste 같은 명령이 모두 구조 편집으로 이어진다. 이 앱은 `UiEvent`가 단순 focus event가 아니라 실제 편집 workflow까지 감당하는지 확인한다.

## Kanban

Kanban은 board-like domain data와 CRUD resource 연결을 검증한다.

검증하는 것:

- host-owned board schema
- resource adapter
- `UiEvent` → domain operation bridge

### Kanban이 중요한 이유

Kanban은 tree/listbox 같은 표준 예제보다 도메인성이 강하다. lane, card, ordering, board state가 들어온다. 이 앱은 kernel event vocabulary가 도메인 앱에서도 과도하게 새 callback을 만들지 않고 버티는지 확인한다.

## 공식 문서 사이트 검증

이 문서 사이트 자체도 검증 표면이다.

- 문서는 `docs/site/**/*.md`에 있다.
- frontmatter schema는 zod로 검증한다.
- `product: aria-kernel`인 문서만 게시한다.
- Markdown 내부 link는 route href로 변환된다.
- route는 HTML payload를 `MarkdownArticle` entity로 격리한다.

즉 문서도 선언으로부터 렌더된다. 이 프로젝트의 핵심 원칙과 같은 방식이다.

## 변경 후 검증 루틴

문서나 site route를 바꿨다면 다음 순서로 확인한다.

```bash
pnpm exec vite build
```

그 다음 브라우저에서 다음을 본다.

1. `/docs/overview`
2. 새로 추가한 문서 slug
3. sidebar active state
4. TOC anchor
5. 이전/다음 pager

전체 repo 타입 검증은 `pnpm build`가 목표지만, 현재 worktree에는 기존 타입 오류가 남아 있을 수 있다. 이 경우 변경 파일이 오류 목록에 새로 들어갔는지부터 확인한다.

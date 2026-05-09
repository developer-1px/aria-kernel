---
product: aria-kernel
slug: operating-rules
title: "운영 규칙"
description: "이 repo에서 새 기능·문서·검증 앱을 추가할 때 지켜야 하는 실무 규칙을 정리한다."
section: "05-ops"
sectionLabel: "운영"
sectionOrder: 5
order: 1
status: "source-aligned"
source:
  - AGENTS.md
  - CANONICAL.md
  - package.json
tags: [operations, contribution, rules]
---

# 운영 규칙

이 프로젝트는 “만들기 전에 계약을 닫는다”는 방향으로 운영된다. 새 코드는 기존 public vocabulary와 source hierarchy를 먼저 확인해야 한다.

## 패키지 우선

재사용 가능한 behavior, schema, event, reducer는 `apps/*`에 숨기지 않는다. 먼저 `packages/*`에 둘 수 있는지 판단한다.

기준:

- 두 개 이상의 검증 앱에서 필요하면 package 후보
- WAI-ARIA/APG 의미와 직접 관련되면 `packages/aria-kernel`
- 파일/markdown/source helper면 `packages/fs`
- site 전용 presentation이면 `apps/site`

## 이름은 spec에서 온다

이름과 위계는 WAI-ARIA, APG, WHATWG HTML을 우선한다. Radix, Ariakit, React Aria 같은 라이브러리에서 가져올 수 있는 것은 동작 수렴이지 이름 체계가 아니다.

예:

- 값 어휘: `role="listbox"`, `aria-selected`, `aria-expanded`
- pattern 식별자: `useListboxPattern`
- app navigation: `navigationListPattern` with native `<nav>` and `<a>`

## 새 데이터 형태는 zod 먼저

외부 입력 또는 문서 frontmatter처럼 boundary를 통과하는 데이터는 zod schema가 먼저다.

이 문서 사이트도 같은 규칙을 따른다.

- `DocFrontmatterSchema`
- `DocRecordSchema`
- `HeadingSchema`

Markdown file은 string source지만, site에 올라오기 전 frontmatter가 schema를 통과해야 한다.

## Markdown 문서 작성 규칙

공식 사이트에 게시하려면 frontmatter가 필요하다.

```md
---
product: aria-kernel
slug: core-concept
title: "Core Concept"
description: "..."
section: "02-model"
sectionLabel: "모델"
sectionOrder: 2
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/types.ts
tags: [core]
---
```

`product: aria-kernel`이 없으면 사이트에는 노출되지 않는다. 예전 초안이나 내부 메모는 같은 폴더에 있어도 안전하게 숨길 수 있다.

## 검증 명령

주요 변경 후 기본 검증은 다음이다.

```bash
pnpm build
```

문서 라우트 변경은 브라우저에서 `/docs/overview`를 열어 다음을 확인한다.

- sidebar 문서 목록
- 본문 heading anchor
- On this page TOC
- 이전/다음 문서 링크
- console error 0

## 변경 원칙

이 프로젝트에서는 새 abstraction이 자동으로 좋은 것이 아니다. 먼저 기존 source vocabulary를 찾고, 없을 때만 추가한다. 추가한 경우에는 source trace와 문서 설명도 같이 남긴다.

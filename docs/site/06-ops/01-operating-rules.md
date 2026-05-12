---
product: aria-kernel
slug: operating-rules
title: "운영 규칙"
description: "이 repo에서 새 기능·문서·검증 앱을 추가할 때 지켜야 하는 실무 규칙을 정리한다."
section: "06-ops"
sectionLabel: "운영"
sectionOrder: 6
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

## 운영 원칙을 한 문장으로

새 자유도를 추가하기 전에, 그 자유도가 실제로 필요한 계약인지 확인한다. 필요하다면 schema, event, source trace, 검증 표면까지 같이 추가한다.

## 패키지 우선

재사용 가능한 behavior, schema, event, reducer는 `apps/*`에 숨기지 않는다. 먼저 `packages/*`에 둘 수 있는지 판단한다.

기준:

- 두 개 이상의 검증 앱에서 필요하면 package 후보
- WAI-ARIA/APG 의미와 직접 관련되면 `packages/aria-kernel`
- 파일/markdown/source helper면 `packages/fs`
- site 전용 presentation이면 `apps/site`

### 예시

Finder에서만 필요한 hover style은 `apps/finder`에 둔다. 하지만 Finder와 Outliner가 모두 쓰는 tree keyboard behavior라면 `packages/aria-kernel` 후보가 된다. Markdown 문서를 읽고 frontmatter를 파싱하는 helper는 앱 기능이 아니라 source helper이므로 `packages/fs`에 둔다.

## 이름은 spec에서 온다

이름과 위계는 WAI-ARIA, APG, WHATWG HTML을 우선한다. Radix, Ariakit, React Aria 같은 라이브러리에서 가져올 수 있는 것은 동작 수렴이지 이름 체계가 아니다.

예:

- 값 어휘: `role="listbox"`, `aria-selected`, `aria-expanded`
- pattern 식별자: `useListboxPattern`
- app navigation: `navigationListPattern` with native `<nav>` and `<a>`

### 이름을 정할 때의 질문

새 이름을 만들기 전에 다음을 확인한다.

1. ARIA role 이름으로 이미 존재하는가?
2. APG pattern slug로 이미 존재하는가?
3. WHATWG HTML element 의미로 표현 가능한가?
4. 기존 `UiEvent` type으로 표현 가능한가?

모두 아니면 그때 새 이름을 고려한다.

## 새 데이터 형태는 zod 먼저

외부 입력 또는 문서 frontmatter처럼 boundary를 통과하는 데이터는 zod schema가 먼저다.

이 문서 사이트도 같은 규칙을 따른다.

- `DocFrontmatterSchema`
- `DocRecordSchema`
- `HeadingSchema`

Markdown file은 string source지만, site에 올라오기 전 frontmatter가 schema를 통과해야 한다.

### schema 없이 시작하면 생기는 문제

frontmatter에 `order: "first"` 같은 값이 들어왔는데 route가 number라고 가정하면 정렬이 조용히 깨진다. schema가 있으면 이 경계에서 실패하거나 coercion 정책을 명시할 수 있다.

## Markdown 문서 작성 규칙

공식 사이트에 게시하려면 frontmatter가 필요하다.

```md
---
product: aria-kernel
slug: core-concept
title: "Core Concept"
description: "..."
section: "03-model"
sectionLabel: "모델"
sectionOrder: 3
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/types.ts
tags: [core]
---
```

`product: aria-kernel`이 없으면 사이트에는 노출되지 않는다. 그래도 공식 문서 트리에는 초안이나 내부 메모를 두지 않는다. 게시하지 않을 자료는 `docs/site` 밖에서 관리한다.

### 좋은 문서의 구조

공식 문서는 다음 순서를 권장한다.

1. 독자가 무엇을 알게 되는지 먼저 말한다.
2. 용어를 짧게 정의한다.
3. 작은 예제를 하나 든다.
4. 실제 source file과 연결한다.
5. 흔한 오해 또는 실패 사례를 설명한다.
6. 다음에 읽을 문서를 안내한다.

이 구조가 “강의식 공식문서”의 기본 형태다.

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

## PR 또는 작업 설명에 포함할 것

문서와 코드가 같이 바뀌었다면 다음을 남긴다.

- 어떤 source contract가 바뀌었는가
- 어떤 문서가 그 contract를 설명하는가
- 어떤 route 또는 showcase에서 확인했는가
- `pnpm exec vite build` 또는 관련 테스트 결과
- 전체 `pnpm build`가 실패했다면 기존 오류인지 새 오류인지

## 변경 원칙

이 프로젝트에서는 새 abstraction이 자동으로 좋은 것이 아니다. 먼저 기존 source vocabulary를 찾고, 없을 때만 추가한다. 추가한 경우에는 source trace와 문서 설명도 같이 남긴다.

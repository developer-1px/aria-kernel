---
product: aria-kernel
slug: why
title: "왜 만들었나"
description: "컴포넌트 라이브러리가 해결하지 못하는 행동·시각·데이터의 결합 문제와 @p/aria-kernel이 메우는 위치를 정리한다."
section: "01-start"
sectionLabel: "시작"
sectionOrder: 1
order: 2
status: "source-aligned"
source:
  - packages/aria-kernel/src/patterns/listbox.ts
  - packages/aria-kernel/src/patterns/tree.ts
  - packages/aria-kernel/src/spec/apgKeyboardSpec.ts
tags: [why, apg, headless]
---

# 왜 만들었나

웹 앱의 접근성 동작은 이미 WAI-ARIA와 APG에 상당 부분 정의되어 있다. 문제는 그 정의가 실제 제품 화면에서 자주 **컴포넌트 형태**로만 포장된다는 점이다.

기존 라이브러리는 보통 다음 중 하나를 묶어서 제공한다.

- markup + behavior + 일부 state
- component API + style token
- collection abstraction + hook
- 복사 가능한 component template

이 방식은 표준적인 화면에는 효과적이다. 그러나 실제 제품에서는 데이터 구조와 시각 표현이 자주 어긋난다.

## 실제로 막히는 지점

예를 들어 PowerPoint의 좌측 슬라이드 목록을 생각하면 데이터는 tree다. 섹션 아래에 슬라이드가 있고, 섹션은 접고 펼칠 수 있다. 하지만 시각 표현은 tree indentation이 아니라 썸네일 카드의 세로 list다.

비슷한 문제는 여러 곳에서 반복된다.

| 화면 | 데이터 구조 | 시각 표현 |
|---|---|---|
| Finder column view | tree | 여러 column |
| Kanban board | lane → card tree | 가로 board |
| Slides thumbnail strip | section → slide tree | card list |
| Outliner | recursive tree | editable text rows |
| TreeGrid | tree + grid cells | table-like grid |

이때 컴포넌트 라이브러리의 `<TreeView>`는 tree 모양 markup을 기대하고, `<List>`는 tree 행동을 모른다. 소비자는 결국 키보드 이동, roving tabindex, typeahead, selection, expand/collapse를 직접 다시 구현한다.

## LLM 시대의 추가 문제

LLM이 UI 코드를 생성하면 이 문제는 더 커진다. LLM은 “보이는 것”을 빠르게 만들지만, APG keyboard interaction과 ARIA state를 끝까지 유지하는 코드는 쉽게 빠뜨린다.

자주 누락되는 항목은 다음과 같다.

- Arrow/Home/End/Page 계열 이동
- roving tabindex 또는 `aria-activedescendant`
- `aria-selected`, `aria-expanded`, `aria-multiselectable`
- typeahead buffer와 deadline
- multi-select anchor와 range selection
- collapse 상태를 반영한 visible traversal
- click, Enter, Space의 activation 의미 차이

`@p/aria-kernel`은 이 반복 구현을 화면 밖으로 끌어낸다. 화면은 markup과 style을 결정하고, 패키지는 행동의 최소 계약을 제공한다.

## 이 프로젝트가 메우는 위치

`@p/aria-kernel`의 위치는 “APG 바로 위, component library 바로 아래”다.

```txt
Design System / Component Library
Headless UI Components
React Aria-style hooks
@p/aria-kernel
WAI-ARIA / APG
```

이 프로젝트는 컴포넌트를 덜 만들기 위해 만들어졌다. 더 정확히 말하면, **컴포넌트가 갖고 있던 행동 책임을 데이터·이벤트 layer로 낮추기 위해** 만들어졌다.

## 해결하려는 문제

공식 문제 정의는 다음과 같다.

> 제품 화면마다 반복되는 ARIA/APG 상호작용을, markup·style·도메인 state와 분리된 직렬화 가능한 데이터/이벤트 계약으로 제공한다.

그 결과 소비자는 다음을 얻는다.

- APG keyboard semantics를 매번 직접 작성하지 않는다.
- 화면별 markup 자유도는 유지한다.
- 시각 component vocabulary를 이 repo에 새로 키우지 않는다.
- `UiEvent` 단일 채널로 앱 reducer와 연결한다.
- source-level spec coverage로 동작 drift를 추적한다.

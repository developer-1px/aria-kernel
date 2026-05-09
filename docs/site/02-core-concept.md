---
product: aria-kernel
slug: core-concept
title: "Core Concept"
description: "NormalizedData, Axis, Pattern, UiEvent, Reducer가 한 방향으로 연결되는 핵심 모델을 설명한다."
section: "02-model"
sectionLabel: "모델"
sectionOrder: 2
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/types.ts
  - packages/aria-kernel/src/axes/axis.ts
  - packages/aria-kernel/src/state/reduce.ts
tags: [core, model, data-flow]
---

# Core Concept

`@p/aria-kernel`의 핵심은 하나의 방향성이다.

```txt
NormalizedData
  -> Axis
  -> Pattern recipe
  -> UI markup
  -> UiEvent
  -> Reducer
  -> NormalizedData
```

이 흐름에서 UI는 상태를 직접 소유하지 않는다. UI는 pattern recipe가 반환한 `rootProps`, `itemProps`, `items`를 받아 markup을 그리고, 사용자 입력은 `UiEvent`로 다시 올린다.

## NormalizedData

`NormalizedData`는 세 store를 분리한다.

```ts
type NormalizedData = {
  entities: Record<string, Record<string, unknown>>
  relationships: Record<string, string[]>
  meta?: {
    root?: string[]
    focus?: string | null
    expanded?: string[]
    open?: string[]
    typeahead?: { buf: string; deadline: number }
    selectAnchor?: string | null
    editing?: string | null
  }
}
```

분리 기준은 소유권과 변경 빈도다.

| store | 소유권 | 변경 빈도 | 예 |
|---|---|---|---|
| `entities` | 소비자 도메인 | 도메인 변경 시 | label, disabled, selected, value |
| `relationships` | 소비자 도메인 | 구조 변경 시 | parent → child ids |
| `meta` | kernel | 키보드·포커스 입력마다 | focus, expanded, open, typeahead |

이 구조 덕분에 tree, list, grid, menu가 모두 같은 데이터 rail 위에서 움직인다.

## Axis

Axis는 입력 gesture를 의미 이벤트로 번역하는 작은 함수다.

```ts
type Axis = (
  data: NormalizedData,
  focusId: string,
  trigger: Trigger,
) => UiEvent[] | null
```

Axis는 DOM을 렌더링하지 않는다. 대신 “현재 focus에서 ArrowDown이 들어오면 어떤 `UiEvent`가 나가야 하는가”만 답한다. `composeAxes`는 여러 axis를 우선순위로 합성하고, 첫 번째 non-null 결과를 채택한다.

## Pattern recipe

Pattern recipe는 APG pattern 단위의 public API다. 예를 들어 listbox는 다음 형태를 반환한다.

```ts
const { rootProps, optionProps, items } =
  useListboxPattern(data, onEvent, options)
```

recipe는 다음 책임만 가진다.

- role과 aria state를 props getter로 노출한다.
- roving tabindex 또는 active descendant 연결을 담당한다.
- axis 결과를 `onEvent(UiEvent)`로 relay한다.
- rendering은 소비자에게 맡긴다.

## UiEvent

`UiEvent`는 UI와 app reducer 사이의 단일 어휘다. DOM event를 그대로 흘리지 않고, 의미 이벤트로 낮춘다.

예:

```ts
{ type: 'navigate', dir: 'next' }
{ type: 'activate', id: 'slide-3' }
{ type: 'select', ids: ['a', 'b'], to: true }
{ type: 'expand', id: 'section-1', open: true }
```

중요한 점은 `UiEvent`가 앱 효과를 직접 실행하지 않는다는 것이다. `activate`는 “활성화 의도”이고, 그 의도가 라우팅인지 선택인지 편집 진입인지는 host reducer가 결정한다.

## Reducer split

`reduce`는 두 영역을 분리한다.

| 영역 | kernel이 처리 | 예 |
|---|---|---|
| core-reduced | focus, expanded, open, typeahead, pan, zoom | `navigate`, `expand`, `open` |
| host territory | 도메인 효과 | `activate`, `value`, `insertAfter`, `remove`, `save` |

이 split이 중요하다. 접근성 동작의 공통 의미는 kernel이 닫고, 제품별 의미는 앱이 소유한다.

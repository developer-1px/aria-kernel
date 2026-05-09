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

## 한 번 끝까지 따라가기

listbox에서 사용자가 `ArrowDown`을 누르는 장면을 단계별로 보면 전체 구조가 선명해진다.

1. 사용자는 현재 focus된 option에서 `ArrowDown`을 누른다.
2. `rootProps.onKeyDown`이 key event를 받는다.
3. listbox recipe가 합성한 `navigate` axis가 현재 `NormalizedData`와 focus id를 읽는다.
4. axis는 다음 focus 의도를 `UiEvent`로 만든다.
5. `onEvent`가 host reducer 또는 resource dispatch로 event를 보낸다.
6. reducer가 `meta.focus`를 다음 id로 바꾼다.
7. React가 다시 렌더링되고, `optionProps(id)`가 새 focus 항목에 `tabIndex=0`을 준다.

이 과정에서 소비자 컴포넌트는 “다음 항목 찾기”를 직접 구현하지 않는다. 소비자는 data와 markup만 제공한다.

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

### list가 NormalizedData가 되는 모습

입력:

```ts
fromList([
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta', disabled: true },
])
```

결과는 개념적으로 다음과 같다.

```ts
{
  entities: {
    a: { label: 'Alpha' },
    b: { label: 'Beta', disabled: true },
  },
  relationships: {},
  meta: { root: ['a', 'b'] },
}
```

항목 자체는 `entities`에 있고, root 순서는 `meta.root`에 있다. disabled 여부는 entity data에 남아 있으므로 axis와 pattern이 같은 정보를 읽는다.

### tree가 NormalizedData가 되는 모습

입력:

```ts
fromTree([
  {
    id: 'docs',
    label: 'Docs',
    children: [
      { id: 'overview', label: 'Overview' },
      { id: 'api', label: 'API' },
    ],
  },
])
```

결과는 개념적으로 다음과 같다.

```ts
{
  entities: {
    docs: { label: 'Docs' },
    overview: { label: 'Overview' },
    api: { label: 'API' },
  },
  relationships: {
    docs: ['overview', 'api'],
  },
  meta: { root: ['docs'] },
}
```

tree를 화면에서 꼭 들여쓰기 형태로 보여줄 필요는 없다. `relationships`가 행동 그래프를 보존하고, 화면은 card list나 column view로 따로 그릴 수 있다.

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

### Axis를 함수로 생각하기

Axis는 다음 질문에 답하는 pure behavior 함수에 가깝다.

> 현재 data와 focus id가 주어졌을 때, 이 trigger는 어떤 의미인가?

예를 들어 listbox의 `ArrowDown`은 “다음 sibling으로 focus 이동”이다. tree의 `ArrowRight`는 더 복잡하다. 닫힌 parent면 expand, 열린 parent면 first child로 이동, leaf면 아무 일도 하지 않는다. 이런 차이를 화면 컴포넌트 안에 넣지 않고 axis로 분리한다.

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

### Pattern recipe는 component가 아니다

`useListboxPattern`은 `<Listbox />`를 반환하지 않는다. 대신 consumer가 원하는 markup에 붙일 props를 반환한다.

```tsx
const listbox = useListboxPattern(data, onEvent)

return (
  <div {...listbox.rootProps}>
    {listbox.items.map((item) => (
      <button key={item.id} {...listbox.optionProps(item.id)}>
        {item.label}
      </button>
    ))}
  </div>
)
```

이 예제에서 `button`이 항상 권장된다는 뜻은 아니다. 핵심은 recipe가 markup을 강제하지 않는다는 것이다. 소비자는 semantic HTML과 제품 요구에 맞게 element를 고른다.

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

### DOM event와 다른 점

DOM event는 너무 구체적이다.

```ts
KeyboardEvent { key: 'ArrowDown', shiftKey: false, target: ... }
```

앱 reducer가 알고 싶은 것은 DOM의 세부 정보가 아니라 의미다.

```ts
{ type: 'navigate', dir: 'next' }
```

이 차이가 중요하다. DOM event를 reducer까지 끌고 가면 reducer가 browser, focus target, modifier key를 모두 알아야 한다. `UiEvent`로 낮추면 reducer는 제품 의미만 처리한다.

## Reducer split

`reduce`는 두 영역을 분리한다.

| 영역 | kernel이 처리 | 예 |
|---|---|---|
| core-reduced | focus, expanded, open, typeahead, pan, zoom | `navigate`, `expand`, `open` |
| host territory | 도메인 효과 | `activate`, `value`, `insertAfter`, `remove`, `save` |

이 split이 중요하다. 접근성 동작의 공통 의미는 kernel이 닫고, 제품별 의미는 앱이 소유한다.

## 전체 예제: 선택 가능한 문서 목록

다음 예제는 문서 목록을 listbox로 만들고, 선택 이벤트는 host가 처리하는 구조다.

```tsx
import { fromList, reduce, singleSelect, composeReducers } from '@p/aria-kernel'
import { useListboxPattern } from '@p/aria-kernel/patterns'

const reduceDocs = composeReducers(reduce, singleSelect)

const initial = fromList([
  { id: 'overview', label: 'Overview' },
  { id: 'contract', label: 'Data & Event Contract' },
  { id: 'patterns', label: 'Behavior Patterns' },
])

function DocsList() {
  const [data, setData] = useState(initial)
  const onEvent = (event) => setData((prev) => reduceDocs(prev, event))
  const { rootProps, optionProps, items } =
    useListboxPattern(data, onEvent, { label: 'Docs' })

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

여기서 `reduce`는 focus 같은 공통 의미를 처리하고, `singleSelect`는 selection 정책을 추가한다. 이처럼 kernel reducer와 host reducer는 합성된다.

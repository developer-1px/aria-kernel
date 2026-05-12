---
product: aria-kernel
slug: first-listbox-tutorial
title: "첫 번째 Listbox 만들기"
description: "처음 사용하는 독자가 fromList, useListboxPattern, reducer, onEvent 흐름을 손으로 따라갈 수 있는 단계별 튜토리얼이다."
section: "02-tutorial"
sectionLabel: "튜토리얼"
sectionOrder: 2
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/state/fromTree.ts
  - packages/aria-kernel/src/patterns/listbox.ts
  - packages/aria-kernel/src/state/reduce.ts
tags: [tutorial, listbox, beginner]
---

# 첫 번째 Listbox 만들기

이 튜토리얼은 `@p/aria-kernel`을 처음 보는 사람을 위한 가장 작은 실습이다. 목표는 “과일 목록”을 listbox로 만들고, 키보드로 focus를 이동할 수 있게 하는 것이다.

완성 후에는 다음을 이해하게 된다.

- `fromList`가 왜 필요한지
- `useListboxPattern`이 무엇을 반환하는지
- `onEvent`가 왜 단일 통로인지
- reducer가 어떤 상태를 바꾸는지

## 1단계: 그냥 배열로 시작하기

처음에는 도메인 데이터가 보통 배열이다.

```ts
const fruits = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
]
```

이 배열은 화면에 출력하기에는 충분하지만, keyboard behavior에는 정보가 부족하다. 현재 focus가 어디인지, root 순서는 무엇인지, disabled 항목을 어떻게 건너뛸지 같은 질문을 공통 방식으로 답해야 한다.

그래서 `fromList`로 `NormalizedData`를 만든다.

```ts
import { fromList } from '@p/aria-kernel'

const initial = fromList(fruits)
```

개념적으로는 다음 데이터가 만들어진다.

```ts
{
  entities: {
    apple: { label: 'Apple' },
    banana: { label: 'Banana' },
    cherry: { label: 'Cherry' },
  },
  relationships: {},
  meta: {
    root: ['apple', 'banana', 'cherry'],
  },
}
```

## 2단계: React state로 보관하기

이제 `NormalizedData`를 React state로 둔다.

```tsx
import { useState } from 'react'
import { fromList } from '@p/aria-kernel'

const initial = fromList([
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
])

function FruitListbox() {
  const [data, setData] = useState(initial)
}
```

여기서 `data`는 화면의 항목과 UI 보조 상태를 함께 담는다. 아직 listbox behavior는 붙지 않았다.

## 3단계: reducer 연결하기

사용자가 키보드를 누르면 pattern은 `UiEvent`를 emit한다. 그 event를 state에 반영하려면 reducer가 필요하다.

```tsx
import { reduce } from '@p/aria-kernel'

function FruitListbox() {
  const [data, setData] = useState(initial)
  const onEvent = (event) => {
    setData((prev) => reduce(prev, event))
  }
}
```

`reduce`는 focus, expanded, open, typeahead 같은 공통 상태를 처리한다. 예를 들어 navigation event가 들어오면 `meta.focus`가 바뀐다.

## 4단계: listbox recipe 붙이기

이제 `useListboxPattern`을 호출한다.

```tsx
import { useListboxPattern } from '@p/aria-kernel/patterns'

function FruitListbox() {
  const [data, setData] = useState(initial)
  const onEvent = (event) => {
    setData((prev) => reduce(prev, event))
  }
  const { rootProps, optionProps, items } =
    useListboxPattern(data, onEvent, { label: 'Fruits', autoFocus: true })
}
```

반환값의 의미는 다음과 같다.

| 반환값 | 어디에 쓰나 | 담긴 것 |
|---|---|---|
| `rootProps` | listbox root element | `role="listbox"`, keyboard handler |
| `optionProps(id)` | 각 option element | `role="option"`, tabIndex, aria state |
| `items` | 렌더링 loop | id, label, selected, disabled |

## 5단계: markup에 spread하기

이제 원하는 markup을 고르고 props를 붙인다.

```tsx
export function FruitListbox() {
  const [data, setData] = useState(initial)
  const onEvent = (event) => {
    setData((prev) => reduce(prev, event))
  }
  const { rootProps, optionProps, items } =
    useListboxPattern(data, onEvent, { label: 'Fruits', autoFocus: true })

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

이제 사용자는 Tab으로 listbox에 들어가고, ArrowUp/ArrowDown으로 option 사이를 이동할 수 있다. role과 aria state도 recipe가 제공한다.

## 6단계: activation 처리하기

Enter 또는 Space로 항목을 실행하고 싶다면 `activate` event를 host가 처리한다.

```tsx
const onEvent = (event) => {
  if (event.type === 'activate') {
    console.log('run:', event.id)
  }
  setData((prev) => reduce(prev, event))
}
```

여기서 `@p/aria-kernel`은 “activate가 발생했다”까지만 말한다. 그 activate가 route 이동인지, command 실행인지, modal open인지는 앱이 정한다.

## 7단계: selection까지 추가하기

선택 상태도 처리하고 싶다면 selection reducer를 합성한다.

```tsx
import { composeReducers, reduce, singleSelect } from '@p/aria-kernel'

const appReduce = composeReducers(reduce, singleSelect)

const onEvent = (event) => {
  setData((prev) => appReduce(prev, event))
}
```

이제 focus 이동과 selection 정책이 함께 적용된다. selection 정책을 single에서 multi로 바꾸고 싶다면 reducer와 pattern option을 같이 바꾼다.

```tsx
const { rootProps, optionProps, items } =
  useListboxPattern(data, onEvent, {
    label: 'Fruits',
    multiSelectable: true,
  })
```

## 흔한 실수

### 실수 1: rootProps를 빼먹기

```tsx
<ul>
  ...
</ul>
```

이렇게 하면 keyboard handler와 listbox role이 붙지 않는다. root에는 반드시 `rootProps`를 spread한다.

### 실수 2: optionProps를 일부 항목에만 붙이기

```tsx
<li>{item.label}</li>
```

각 option은 `role`, `tabIndex`, `aria-selected` 같은 state를 받아야 한다. 모든 항목에 `optionProps(item.id)`를 붙인다.

### 실수 3: DOM event를 reducer로 직접 보내기

```tsx
onKeyDown={(event) => setData((prev) => reduce(prev, event))}
```

reducer는 DOM `KeyboardEvent`가 아니라 `UiEvent`를 받는다. DOM event를 의미 event로 번역하는 책임은 pattern recipe가 가진다.

## 다음 단계

이 튜토리얼을 이해했다면 다음 문서를 읽으면 된다.

1. [Core Concept](./02-core-concept.md)
2. [Data & Event Contract](./04-data-event-contract.md)
3. [Behavior Patterns](./05-behavior-patterns.md)

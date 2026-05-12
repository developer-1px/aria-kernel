---
product: aria-kernel
slug: state-resource
title: "State & Resource"
description: "Reducer, resource, zod-crud bridge가 UiEvent를 실제 앱 상태와 연결하는 방식을 설명한다."
section: "05-runtime"
sectionLabel: "런타임"
sectionOrder: 5
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/state/reduce.ts
  - packages/resource/src/data.ts
  - packages/resource/src/routeUiEventToCrud.ts
  - apps/outliner/src/resource.ts
tags: [state, resource, reducer]
---

# State & Resource

`@p/aria-kernel`은 UI event를 생성하고 core reducer를 제공한다. `@p/resource`는 그 `UiEvent`를 실제 앱 상태와 연결하기 위한 선택형 resource rail을 제공한다.

## 한 문장 요약

Pattern은 “무슨 일이 일어났는가”를 event로 말하고, reducer/resource는 “그 일을 앱 상태에 어떻게 반영할 것인가”를 결정한다.

```txt
Pattern recipe
  emits UiEvent
        |
        v
Core reducer
  focus/open/expanded 같은 공통 상태 처리
        |
        v
Host reducer 또는 Resource
  도메인 데이터, CRUD, persistence 처리
```

## Core reducer

`state/reduce.ts`는 `UiEvent`의 기본 의미를 처리한다.

처리하는 이벤트:

- `navigate`
- `expand`
- `open`
- `typeahead`
- `pan`
- `zoom`
- `focus`
- `editStart`
- `editEnd`
- `revert`

처리하지 않고 host에 맡기는 이벤트:

- `activate`
- `value`
- `insertAfter`
- `appendChild`
- `update`
- `remove`
- `copy`, `cut`, `paste`
- `undo`, `redo`
- `save`, `find`, `sort`, `filter`

이 분리는 API의 안정성을 만든다. keyboard focus와 ARIA state는 공통 규칙으로 처리하고, “선택한 항목을 열면 무엇이 일어나는가”는 앱이 결정한다.

### reducer 합성 예제

단일 선택 listbox라면 core reducer에 selection reducer를 합성할 수 있다.

```ts
import { composeReducers, reduce, singleSelect } from '@p/aria-kernel'

const appReduce = composeReducers(reduce, singleSelect)

setData((prev) => appReduce(prev, event))
```

이 예제에서 `reduce`는 focus 이동을 처리하고, `singleSelect`는 selection 정책을 처리한다. 같은 `UiEvent`를 여러 reducer가 순서대로 해석하는 구조다.

## Resource interface

`defineResource`와 `useResource`는 앱 데이터 read/write의 단일 인터페이스다.

```ts
const resource = defineResource({
  key: () => 'outline',
  initial: () => crud.snapshot(),
  subscribe: (_key, push) => crud.subscribe(() => push(crud.snapshot())),
  onEvent: (event) => routeUiEventToCrud(crud, event),
})
```

React 컴포넌트에서는 다음 형태로 사용한다.

```ts
const [value, dispatch] = useResource(resource)
dispatch({ type: 'insertAfter', siblingId: 'node-1' })
```

dispatch는 resource event와 `UiEvent`를 모두 받을 수 있다. `UiEvent`는 resource의 `onEvent` router를 거쳐 다음 value로 변환된다.

### resource를 쓰는 이유를 예제로 보기

컴포넌트 내부에서 직접 CRUD를 호출하면 화면마다 wiring이 생긴다.

```tsx
function Row({ node }) {
  return <button onClick={() => crud.remove(node.id)}>Delete</button>
}
```

이 방식은 작을 때는 간단하지만 keyboard command, context menu, toolbar button, paste command가 모두 같은 CRUD를 호출해야 하는 순간 중복된다.

Resource를 쓰면 UI는 event만 보낸다.

```tsx
dispatch({ type: 'remove', id: node.id })
```

삭제가 실제로 zod-crud remove인지, 서버 mutation인지, optimistic update인지는 resource가 결정한다.

## zod-crud bridge

Outliner와 Kanban은 `routeUiEventToCrud`를 사용한다. 이 bridge는 다음 event를 zod-crud operation으로 연결한다.

- `insertAfter`
- `appendChild`
- `update`
- `remove`
- `copy`
- `cut`
- `paste`
- `undo`
- `redo`
- `move`

즉 tree/listbox editable behavior에서 나온 event가 그대로 문서 편집 operation으로 이어진다. 앱마다 별도의 “keyboard event → CRUD action” 매퍼를 반복해서 작성하지 않는다.

### Outliner 흐름

Outliner에서 사용자가 `Backspace`로 노드를 삭제한다고 가정하자.

1. tree editable command가 `{ type: 'remove', id }`를 emit한다.
2. resource dispatch가 이 `UiEvent`를 받는다.
3. `routeUiEventToCrud`가 zod-crud remove operation으로 변환한다.
4. crud snapshot이 바뀐다.
5. resource subscription이 새 snapshot을 React에 push한다.
6. 화면이 새 문서 상태로 렌더링된다.

이 흐름에서 tree component는 zod-crud를 모른다. zod-crud도 keyboard event를 모른다. 둘 사이의 공용 언어가 `UiEvent`다.

## 왜 resource가 필요한가

pattern은 UI와 가까운 layer다. 하지만 fetch, persistence, external subscription, undo history는 UI 안에 두면 안 된다. Resource는 이 책임을 밖으로 빼낸다.

Resource가 제공하는 것:

- key 기반 cache entry
- initial/load hydration
- external subscribe/push channel
- serialize hook
- `UiEvent` router
- `useSyncExternalStore` 기반 React 연결

이 구조 덕분에 UI 컴포넌트는 `(value, dispatch)`만 본다.

## 언제 reducer만 쓰고 언제 resource를 쓰나

| 상황 | 권장 |
|---|---|
| demo, local-only state | `useState` + reducer |
| focus/selection만 필요한 작은 화면 | `reduce` + selection/value reducer |
| CRUD, undo/redo, persistence가 있는 화면 | `defineResource` |
| 외부 store와 동기화해야 하는 화면 | `useResource` + `subscribe` |
| 서버 mutation이 필요한 화면 | resource `onEvent`에서 mutation adapter 연결 |

처음에는 reducer만으로 시작하고, 데이터 lifecycle이 생기면 resource로 올리는 식으로 확장하면 된다.

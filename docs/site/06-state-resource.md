---
product: aria-kernel
slug: state-resource
title: "State & Resource"
description: "Reducer, resource, zod-crud bridge가 UiEvent를 실제 앱 상태와 연결하는 방식을 설명한다."
section: "04-runtime"
sectionLabel: "런타임"
sectionOrder: 4
order: 1
status: "source-aligned"
source:
  - packages/aria-kernel/src/state/reduce.ts
  - packages/aria-kernel/src/store/data.ts
  - packages/aria-kernel/src/store/routeUiEventToCrud.ts
  - apps/outliner/src/resource.ts
tags: [state, resource, reducer]
---

# State & Resource

`@p/aria-kernel`은 UI event를 생성하는 데서 멈추지 않는다. `UiEvent`를 실제 앱 상태와 연결하기 위한 reducer와 resource rail도 제공한다.

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

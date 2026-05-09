---
product: aria-kernel
slug: behavior-patterns
title: "Behavior Patterns"
description: "Axis composition과 APG pattern recipe가 어떻게 키보드·포커스·ARIA state를 제공하는지 설명한다."
section: "03-contract"
sectionLabel: "계약"
sectionOrder: 3
order: 2
status: "source-aligned"
source:
  - packages/aria-kernel/src/axes/axis.ts
  - packages/aria-kernel/src/patterns/listbox.ts
  - packages/aria-kernel/src/patterns/tree.ts
  - packages/aria-kernel/src/spec/apgKeyboardSpec.ts
tags: [patterns, axis, apg]
---

# Behavior Patterns

Pattern recipe는 `@p/aria-kernel`에서 가장 소비자에 가까운 API다. 하지만 내부적으로는 더 작은 axis 조합으로 만들어진다.

## Axis composition

Axis는 key 또는 click trigger를 보고 `UiEvent[] | null`을 반환한다. `composeAxes`는 axis를 순서대로 실행하고 첫 결과를 채택한다.

순서가 중요한 예는 tree다.

```ts
composeAxes(treeNavigate, treeExpand, activate, typeahead)
```

ArrowLeft/Right는 tree expand/collapse와 parent/child 이동을 먼저 처리해야 한다. Enter/Space activation보다 tree 전용 의미가 먼저 평가되어야 APG와 맞는다.

## Listbox

`useListboxPattern`은 APG listbox recipe다. 소스 기준으로 다음 요소를 제공한다.

| 반환값 | 의미 |
|---|---|
| `rootProps` | `role="listbox"`, orientation, multiselectable, key handlers |
| `optionProps(id)` | `role="option"`, roving tab index, selected/disabled state |
| `groupProps(id)` | grouped listbox의 `role="group"` |
| `items` | 렌더링 가능한 option projection |
| `groups` | grouped mode projection |

multi-select인 경우 axis 순서는 `multiSelect → navigate → activate → typeahead`다. Shift+Arrow 범위 선택이 일반 navigation보다 먼저 처리되어야 하기 때문이다.

## Tree

`useTreePattern`은 tree navigation, expand/collapse, activation, typeahead를 합성한다. editable mode에서는 command descriptor가 추가된다.

tree의 중요한 설계는 command도 데이터로 선언한다는 점이다.

```ts
{ chord: 'Tab', command: 'demote', effect: { op: 'move', target: 'prevSibling', mode: 'child' } }
```

이 구조에서는 단축키가 imperative handler가 아니라 effect data가 된다. 앱은 command table을 바꾸어 편집 정책을 조정할 수 있고, kernel은 effect를 `UiEvent`로 낮춘다.

## NavigationList

`navigationListPattern`은 APG 단일 pattern이 아니다. HTML `<nav>` landmark와 `<a aria-current="page">` 조합을 표준으로 삼은 합성 recipe다.

이 recipe가 있는 이유는 sidebar를 listbox로 만드는 안티패턴을 막기 위해서다. route navigation은 selection widget이 아니므로 `aria-selected`가 아니라 `aria-current`를 사용한다.

## APG coverage

`spec/apgKeyboardSpec.ts`는 APG keyboard interaction을 데이터로 옮긴다. `spec/implChords.ts`는 구현이 노출하는 chord를 모은다. 테스트는 둘의 차이를 snapshot으로 검증한다.

이 방식은 문서와 구현이 따로 노는 문제를 줄인다. pattern이 새 chord를 흡수하면 coverage matrix에 표시되고, APG 누락도 gap으로 드러난다.

## 소비자 코드의 형태

소비자 컴포넌트는 보통 다음 정도만 작성한다.

```tsx
const { rootProps, optionProps, items } =
  useListboxPattern(data, onEvent, { label: 'Files' })

return (
  <ul {...rootProps}>
    {items.map((item) => (
      <li key={item.id} {...optionProps(item.id)}>
        {item.label}
      </li>
    ))}
  </ul>
)
```

markup은 소비자가 결정한다. behavior는 recipe가 제공한다.

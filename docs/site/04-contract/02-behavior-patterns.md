---
product: aria-kernel
slug: behavior-patterns
title: "Behavior Patterns"
description: "Axis composition과 APG pattern recipe가 어떻게 키보드·포커스·ARIA state를 제공하는지 설명한다."
section: "04-contract"
sectionLabel: "계약"
sectionOrder: 4
order: 2
status: "source-aligned"
source:
  - packages/aria-kernel/src/axes/axis.ts
  - packages/aria-kernel/src/patterns/listbox.ts
  - packages/aria-kernel/src/patterns/treeview.ts
  - packages/aria-kernel/src/spec/apgKeyboardSpec.ts
tags: [patterns, axis, apg]
---

# Behavior Patterns

Pattern recipe는 `@p/aria-kernel`에서 가장 소비자에 가까운 API다. 하지만 내부적으로는 더 작은 axis 조합으로 만들어진다.

## 수업 목표

이 문서를 읽고 나면 다음 질문에 답할 수 있어야 한다.

1. `useListboxPattern`은 왜 component가 아니라 props getter를 반환하는가?
2. `composeAxes`의 순서가 왜 중요한가?
3. APG keyboard interaction이 구현과 어떻게 연결되는가?
4. 소비자는 어느 부분까지 직접 markup을 작성해야 하는가?

## Axis composition

Axis는 key 또는 click trigger를 보고 `UiEvent[] | null`을 반환한다. `composeAxes`는 axis를 순서대로 실행하고 첫 결과를 채택한다.

순서가 중요한 예는 tree다.

```ts
composeAxes(treeNavigate, treeExpand, activate, typeahead)
```

ArrowLeft/Right는 tree expand/collapse와 parent/child 이동을 먼저 처리해야 한다. Enter/Space activation보다 tree 전용 의미가 먼저 평가되어야 APG와 맞는다.

### 순서가 틀리면 생기는 문제

multi-select listbox에서 Shift+ArrowDown은 “다음 항목으로 focus를 이동하면서 범위 선택을 확장”해야 한다. 그런데 일반 `navigate`가 먼저 실행되면 Shift 정보를 무시한 focus 이동으로 끝날 수 있다.

그래서 multi-select listbox는 다음 순서를 사용한다.

```ts
composeAxes(multiSelect, navigate(orientation), activate, typeahead)
```

`multiSelect`가 먼저 Shift+Arrow를 볼 기회를 가져야 range selection이 동작한다. 이것이 axis 순서가 단순 취향이 아니라 behavior contract인 이유다.

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

### listbox 예제: command palette 후보 목록

검색 결과를 listbox로 보여주는 예제다. 스타일은 생략하고 behavior 구조만 본다.

```tsx
const data = fromList([
  { id: 'open-file', label: 'Open File' },
  { id: 'go-symbol', label: 'Go to Symbol' },
  { id: 'toggle-terminal', label: 'Toggle Terminal' },
])

function CommandResults({ onRun }) {
  const [state, setState] = useState(data)
  const onEvent = (event) => {
    if (event.type === 'activate') onRun(event.id)
    setState((prev) => reduce(prev, event))
  }
  const { rootProps, optionProps, items } =
    useListboxPattern(state, onEvent, { label: 'Command results', autoFocus: true })

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

Enter가 눌렸을 때 실행할 명령은 앱이 결정한다. 하지만 option focus, disabled 처리, aria-selected 같은 behavior surface는 recipe가 맡는다.

## Tree

`useTreeviewPattern`은 tree navigation, expand/collapse, activation, typeahead를 합성한다. editable mode에서는 command descriptor가 추가된다.

tree의 중요한 설계는 command도 데이터로 선언한다는 점이다.

```ts
{ chord: 'Tab', command: 'demote', effect: { op: 'move', target: 'prevSibling', mode: 'child' } }
```

이 구조에서는 단축키가 imperative handler가 아니라 effect data가 된다. 앱은 command table을 바꾸어 편집 정책을 조정할 수 있고, kernel은 effect를 `UiEvent`로 낮춘다.

### tree 예제: 문서 목차

문서 목차는 tree data지만 화면에서는 꼭 classic tree view처럼 보이지 않을 수 있다.

```tsx
const data = fromTree([
  {
    id: 'guide',
    label: 'Guide',
    children: [
      { id: 'overview', label: 'Overview' },
      { id: 'contract', label: 'Data Contract' },
    ],
  },
])

function DocsTree() {
  const [state, setState] = useState(data)
  const onEvent = (event) => setState((prev) => reduce(prev, event))
  const { rootProps, itemProps, items } =
    useTreeviewPattern(state, onEvent, { label: 'Docs tree' })

  return (
    <nav {...rootProps}>
      {items.map((item) => (
        <a key={item.id} href={`/docs/${item.id}`} {...itemProps(item.id)}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
```

실제 markup은 제품 요구에 맞게 조정해야 한다. 중요한 점은 tree behavior가 데이터 구조에서 나온다는 것이다.

## NavigationList

`navigationListPattern`은 APG 단일 pattern이 아니다. HTML `<nav>` landmark와 `<a aria-current="page">` 조합을 표준으로 삼은 합성 recipe다.

이 recipe가 있는 이유는 sidebar를 listbox로 만드는 안티패턴을 막기 위해서다. route navigation은 selection widget이 아니므로 `aria-selected`가 아니라 `aria-current`를 사용한다.

## APG coverage

`spec/apgKeyboardSpec.ts`는 APG keyboard interaction을 데이터로 옮긴다. `spec/implChords.ts`는 구현이 노출하는 chord를 모은다. 테스트는 둘의 차이를 snapshot으로 검증한다.

이 방식은 문서와 구현이 따로 노는 문제를 줄인다. pattern이 새 chord를 흡수하면 coverage matrix에 표시되고, APG 누락도 gap으로 드러난다.

### coverage를 읽는 법

coverage matrix에서 gap은 “APG에는 있는데 구현 chord set에는 없는 것”이다. extra는 “구현에는 있는데 APG에는 없는 것”이다. extra가 항상 나쁜 것은 아니다. 일부 앱 보편 단축키나 optional behavior는 allowlist로 관리된다. 중요한 것은 차이가 데이터로 드러난다는 점이다.

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

## pattern 선택 가이드

비슷해 보이는 화면에서 어떤 pattern을 써야 하는지 헷갈리면 다음 표를 기준으로 판단한다.

| 화면 의도 | 우선 pattern | 이유 |
|---|---|---|
| 선택 가능한 후보 목록 | listbox | option 선택과 typeahead가 핵심 |
| route 이동용 sidebar | navigationList | 현재 페이지 표시에는 `aria-current`가 맞음 |
| 접고 펼치는 계층 구조 | tree | visible traversal과 expand/collapse가 필요 |
| 탭 패널 전환 | tabs | tab ↔ tabpanel 관계가 필요 |
| 메뉴 명령 | menu/menuButton/menubar | command activation과 submenu 규칙이 필요 |
| 행/열 탐색 | grid/treegrid | cell 단위 navigation이 필요 |

pattern 이름은 화면 모양이 아니라 **상호작용 의미**로 고른다.

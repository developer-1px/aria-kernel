# CANONICAL 합성 (#148)

`@p/aria-kernel` 은 데이터 hook wrapper 를 만들지 않습니다. React 표준 `useReducer` 를 직접 노출하고, 라이브러리는 부품 키트를 제공합니다.

## 1. 합성 형태 (한 가지)

```tsx
import { useReducer } from 'react'
import { reduceWithDefaults, fromList } from '@p/aria-kernel'
import { useListboxPattern } from '@p/aria-kernel/patterns'

const [data, dispatch] = useReducer(reduceWithDefaults, items, fromList)
const { rootProps, itemProps } = useListboxPattern(data, dispatch, { label: '…' })
```

3 줄. 패턴 21 개 전부 같은 형태.

- `useReducer` — **React 표준.** wrapper 없음.
- `reduceWithDefaults` — drop-in reducer (`reduce` + `singleSelect` + `checkToggle` + `setValue`).
  multi-select 데모는 `reduceWithMultiSelect`, radio 는 `reduceWithRadio`. 직접 합성은 `composeReducers(reduce, …)`.
- `fromList` / `fromTree` / `fromFlatTree` — `items → NormalizedData` 생성자.
- `use<APGName>Pattern` — `(data, dispatch, opts?) => { rootProps, …Props }` ARIA recipe.

## 2. 부품 키트

| 부품 | 용도 |
|---|---|
| `NormalizedData` | 보편 데이터 타입 |
| `UiEvent` | 보편 이벤트 어휘 (DOM Event 와 구분되는 `Ui` prefix) |
| `fromList` / `fromTree` / `fromFlatTree` | items → NormalizedData |
| `reduce` | 단일 reducer (event routing) |
| `reduceWithDefaults` / `reduceWithMultiSelect` / `reduceWithRadio` | drop-in pre-합성 |
| `composeReducers` | reducer 합성 (middleware) |
| `useResource` / `defineResource` / `writeResource` | 외부 store 부품 |
| `use<APGName>Pattern` | ARIA recipe (21 개) |

데이터 hook wrapper 0 개. 패턴 hook 21 개 + `useResource` 1 개 = 라이브러리 발명 hook 총 22 개.

## 3. middleware 합성 (HMR / devtools / persist)

새 wrapper 가 아니라 `composeReducers` 위에:

```ts
import { useReducer } from 'react'
import { reduce, composeReducers, fromList } from '@p/aria-kernel'

const reduceWithDevtools = composeReducers(devtoolsMiddleware, reduce)
const [data, dispatch] = useReducer(reduceWithDevtools, items, fromList)
```

middleware signature 는 reducer 와 동일 — 합성 형태가 보존됨.

## 4. Escape — 부품 교체

특수 케이스에서도 합성 형태는 그대로. 한 줄만 다른 부품으로:

```ts
// remote backend
const [data, dispatch] = useResource(myResource)

// 그 외 동일
const { rootProps, itemProps } = useListboxPattern(data, dispatch, { label: '…' })
```

## 5. 폐기된 대안 (#148 §7)

| 시도 | 폐기 이유 |
|---|---|
| `useAccordion({ items })` facade | 검은 상자 — 부품 가림 |
| Controlled/Uncontrolled props | 새 개념 증가 |
| `useLocalData` / `useLocalValue` (제거됨) | 모호 prefix + React 표준 복제. `useReducer` / `useState` 직접 |
| `useUiReducer` wrapper | 모호 prefix (`Ui` 가 useReducer 와 무슨 차이?) |

원칙: 라이브러리는 **React 표준 어휘 위에 ARIA recipe 만 더한다.** wrapper 로 React 어휘를 가리지 않는다.

## 6. 합성 불변식

- 모든 데모/소비자는 §1 형태 (`useReducer(reduceWithDefaults, items, fromList)` + `use<Pattern>(data, dispatch)`).
- 같은 시나리오에 부품 2 개 이상 등장 ❌.
- 새 `use*Data` / `use*Reducer` wrapper 추가 ❌ (21 패턴 + `useResource` 외).

## 출처

#143 · #144 · #145 · #146 · #147 누적 결론 (#148 확정).

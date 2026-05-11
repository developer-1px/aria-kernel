# CANONICAL 합성

`@p/aria-kernel` 의 canonical 합성 형태. 데이터 컬렉션 패턴은 `use<Pattern>Reducer` 한 줄로 묶고, 패턴 hook 한 줄을 더해 ARIA recipe 를 얹는다.

## 1. 합성 형태

```tsx
import { useListboxReducer, useListboxPattern } from '@p/aria-kernel/patterns'

const [data, dispatch] = useListboxReducer(items)
const { rootProps, optionProps } = useListboxPattern(data, dispatch, { label: '…' })
```

2 줄. 모든 컬렉션 패턴이 같은 형태 — `use<Pattern>Reducer` ↔ `use<Pattern>Pattern` 1:1.

- `use<Pattern>Reducer` — `items` 입력 + reducer 변형 옵션 (`multi`, `pipe`).
- `use<Pattern>Pattern` — `(data, dispatch, opts?) => { rootProps, …Props }` ARIA recipe.

### 변형

```tsx
// Multi-select
const [data, dispatch] = useListboxReducer(items, { multi: true })

// Middleware (HOR — redux-undo 등)
const [data, dispatch] = useListboxReducer(items, { pipe: undoable })

// Radio
const [data, dispatch] = useRadioGroupReducer(items)
```

## 2. 부품 키트

| 부품 | 용도 |
|---|---|
| `NormalizedData` | 보편 데이터 타입 |
| `UiEvent` | 보편 이벤트 어휘 (DOM Event 와 구분되는 `Ui` prefix) |
| `fromList` / `fromTree` / `fromFlatTree` | items → NormalizedData (escape 경로) |
| `reduce` | 단일 reducer (event routing) |
| `reduceSingleSelect` / `reduceMultiSelect` / `reduceRadio` | drop-in pre-합성 (escape 경로) |
| `composeReducers` | reducer 합성 (middleware) |
| `use<Pattern>Reducer` | items → `[data, dispatch]` (canonical) |
| `use<Pattern>Pattern` | ARIA recipe |
| `useResource` / `defineResource` / `writeResource` | 외부 store 부품 |

## 3. middleware 합성

`use<Pattern>Reducer` 의 `pipe` 옵션:

```ts
const [data, dispatch] = useListboxReducer(items, { pipe: undoable })
```

`pipe` 는 reducer-to-reducer 함수 — redux-undo 등 표준 HOR 호환.

## 4. Escape — React `useReducer` 직접

custom init, 다른 reducer 합성, devtools 등 특수 케이스에서는 React `useReducer` 를 직접 쓴다:

```ts
import { useReducer } from 'react'
import { reduceSingleSelect, fromList, composeReducers } from '@p/aria-kernel'
import { useListboxPattern } from '@p/aria-kernel/patterns'

const reduceWithDevtools = composeReducers(devtoolsMiddleware, reduceSingleSelect)
const [data, dispatch] = useReducer(reduceWithDevtools, items, fromList)
const { rootProps, optionProps } = useListboxPattern(data, dispatch)
```

reducer / init / 합성 형태 모두 동일 — escape 도 같은 부품 위.

## 5. 단일값 / opts-only 패턴

- 단일값 (`switchPattern`, `sliderPattern`, `splitterPattern`, `sliderRangePattern`, `spinbuttonPattern`, `checkboxPattern`, `alertPattern`) — React `useState` 직접.
- opts-only (`useDialogPattern`, `useAlertDialogPattern`, `useTooltipPattern`, `useComboboxDialogPattern`, `useCarouselPattern`) — 데이터 hook 불필요.

## 6. 합성 불변식

- 모든 컬렉션 데모/소비자는 §1 형태 (`use<Pattern>Reducer` + `use<Pattern>Pattern`).
- escape 는 §4 (React `useReducer` 직접) — 새 wrapper 발명 ❌.
- 같은 시나리오에 부품 2 개 이상 등장 ❌.

## 출처

#143 · #144 · #145 · #146 · #147 누적 (#148 React `useReducer` 직접 합성 도입) → 컬렉션 패턴 단순화를 위해 `use<Pattern>Reducer` 1:1 sibling hook 으로 canonical 승격.

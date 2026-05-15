# CANONICAL 합성

`@interactive-os/aria-kernel` 의 canonical 합성 형태. 데이터 컬렉션 패턴은 `use<Pattern>Reducer` 한 줄로 묶고, 패턴 hook 한 줄을 더해 ARIA recipe 를 얹는다.

## 1. Canonical 3 줄 — side effect 포함

```tsx
import { useListboxReducer, useListboxPattern } from '@interactive-os/aria-kernel/patterns'

function Picker() {
  const [data, baseDispatch] = useListboxReducer(FRUITS)

  // side effect: dispatch wrap. onActivate / onSelect / onChange callback prop 0
  const dispatch = (e) => {
    baseDispatch(e)
    if (e.type === 'activate') navigate(`/fruit/${e.id}`)
  }

  const { rootProps, optionProps } = useListboxPattern(data, dispatch, { label: 'X' })
  // ... JSX
}
```

**3 줄.** `use<Pattern>Reducer` + dispatch wrap + `use<Pattern>Pattern`. 모든 컬렉션 패턴이 같은 형태.

### 왜 dispatch wrap?

`onActivate` / `onSelect` / `onChange` 같은 callback prop **없음**. 이유:
- *event 가 진실, callback 은 derived sugar*. event 어휘 (`activate` / `select` / `value` / ...) 는 universal — callback prop 추가하면 #148 §7 가 폐기한 controlled/uncontrolled trap.
- dispatch wrap 은 *모든 event 타입* 에 universal 작동. `if (e.type === 'activate') ...` 처럼 분기.
- 한 번 학습하면 21 패턴 모두 같음.

useEffect 로 `data.entities[id].selected` 변화 감시 ❌ — focus 이동 시에도 fire (잘못). event-trigger 와 state-derive 는 다른 자리.

## 2. 변형

```tsx
// Multi-select
const [data, dispatch] = useListboxReducer(items, { multi: true })

// Middleware (HOR — redux-undo 호환)
const [data, dispatch] = useListboxReducer(items, { enhance: undoable })

// 합성 middleware
const [data, dispatch] = useListboxReducer(items, {
  enhance: (r) => withDevtools(withUndo(r)),
})

// Radio
const [data, dispatch] = useRadioReducer(items)

// Tree
const [data, dispatch] = useTreeviewReducer(roots, { multi: true })
```

## 3. Controlled input (combobox · textbox 통합)

combobox / textbox 의 입력 value 는 *외부* (form 등) 가 source 일 수 있음. 두 패턴:

### A. 외부 controlled — form integration

```tsx
const [data, baseDispatch] = useComboboxReducer(OPTIONS)
const dispatch = (e) => {
  baseDispatch(e)
  // 사용자 입력 (filter event) → form state 푸시
  if (e.type === 'filter') form.setValue('fruit', e.query)
}

const { rootProps, inputProps, listboxProps, optionProps } =
  useComboboxPattern(data, dispatch, {
    value: form.watch('fruit'),    // form value 가 source of truth
    label: 'Fruit',
  })

return (
  <>
    <input {...inputProps} />          {/* aria-* + onKeyDown 만 spread */}
    <ul {...listboxProps}>{/* ... */}</ul>
  </>
)
```

**규칙:**
- `value` opt 를 pattern hook 에 주입 → pattern 이 controlled mode 로 동작 (내부 state 무시)
- `e.type === 'filter'` 가 사용자 입력 emit → 외부 store push
- `inputProps` 가 `onChange` 자동 부착, value 는 spread 후 *외부 source 가 마지막에 wins*

### B. 내부 uncontrolled — 단순 case

```tsx
const [data, dispatch] = useComboboxReducer(OPTIONS)
const { rootProps, inputProps, listboxProps } = useComboboxPattern(data, dispatch, { label: 'Fruit' })
// inputProps 가 value/onChange 모두 자체 관리. spread 만.
```

`data.meta.filterQuery` 가 query 의 source. dispatch event `{type: 'filter', query: '...'}` 가 외부 emit 자리.

## 4. 부품 키트

| 부품 | 용도 |
|---|---|
| `use<Pattern>Reducer(items, opts?)` | **L1 정본** — items → `[data, dispatch]` |
| `use<Pattern>Pattern(data, dispatch, opts?)` | **L2 정본** — ARIA recipe |
| `NormalizedData` | 보편 데이터 타입 |
| `UiEvent` | 보편 이벤트 어휘 (DOM Event 와 구분되는 `Ui` prefix) |
| `useResource` / `defineResource` / `writeResource` | 외부 store 부품 (옵션) |

### Escape primitives (5% 케이스용)

| 부품 | 용도 |
|---|---|
| `fromList` / `fromTree` / `fromFlatTree` | items → NormalizedData |
| `reduce` | event router (no axis mutation) |
| `reduceSingleSelect` / `reduceMultiSelect` / `reduceRadio` | drop-in composed reducer |
| `composeReducers` | reducer 합성 (라이브러리 내부; 일반 사용 X) |

## 5. Escape — React `useReducer` 직접

custom init, applyGesture, 또는 *use\<Pattern\>Reducer 가 다루지 않는 합성* 이 필요할 때 React 표준으로 drop-down:

```ts
import { useReducer } from 'react'
import { reduceSingleSelect, fromList, applyGesture, expandBranchOnActivate } from '@interactive-os/aria-kernel'
import { useTreeviewPattern } from '@interactive-os/aria-kernel/patterns'

// gesture composition — expand branch on activate
const reducer = applyGesture(expandBranchOnActivate, reduceSingleSelect)
const [data, dispatch] = useReducer(reducer, items, fromList)

// custom init — seed initial expanded state
const initFaq = (items) => ({ ...fromList(items), meta: { expanded: ['what'] } })
const [data, dispatch] = useReducer(reduceSingleSelect, FAQ, initFaq)
```

reducer / init / 합성 모두 같은 부품 — escape 도 paradigm 동일.

## 6. 단일값 / opts-only 패턴

- 단일값 (`switchPattern`, `sliderPattern`, `windowsplitterPattern`, `sliderMultithumbPattern`, `spinbuttonPattern`, `checkboxPattern`, `alertPattern`) — React `useState` 직접.
- opts-only (`useDialogModalPattern`, `useAlertdialogPattern`, `useTooltipPattern`, `useComboboxDialogPattern`, `useCarouselPattern`) — 데이터 hook 불필요.

## 7. 합성 불변식

- 모든 컬렉션 데모/소비자 = §1 형태 (`use<Pattern>Reducer` + dispatch wrap + `use<Pattern>Pattern`).
- escape = §5 (React `useReducer` 직접) — 새 wrapper 발명 ❌.
- side effect = dispatch wrap. callback props 추가 ❌.
- 같은 시나리오에 부품 2 개 이상 등장 ❌.

## 출처

#143 · #144 · #145 · #146 · #147 · #148 누적. external review (LLM 첫 시도 / 두 번째 시도 그래디언트) 결과로 dispatch wrap + controlled input 패턴이 docs §1/§3 으로 승격.

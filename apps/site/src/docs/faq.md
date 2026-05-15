# FAQ

자주 묻는 질문 — 도입부에서 다루지 못한 의문에 답합니다.

## 정체성

### Q. 기존 라이브러리에도 markup-less hook 이 있는데 왜 또?

부분 정답입니다. Headless UI · React Aria · Ariakit 모두 hook API 가 있습니다. 차이는 **추상화 단위**입니다.

- 그들은 **컴포넌트 단위 hook** (`useListState` → 한 listbox 전체)
- 본 라이브러리는 **행동 단위 primitive + recipe 합성** (`navigate` · `activate` · `typeahead` axis 가 있고, `useListboxPattern` 은 이들의 합성 recipe)

24 패턴이 충분하면 recipe 만 쓰고, 부족하면 axis 직접 합성합니다 — escape hatch 가 spec 바로 위에 있습니다.

### Q. React Aria 와는 무엇이 가장 다른가?

가장 가까운 이웃입니다. 두 차이:

1. **어휘** — RA 는 자체 어휘(`<ListBox>`, `Item`, `Section`, `useListBox`), `@interactive-os/aria-kernel` 는 W3C ARIA 그대로 (`role="listbox"`, `optionProps`)
2. **데이터·이벤트** — RA 는 Collection iterator + 다중 callback, `@interactive-os/aria-kernel` 는 NormalizedData + 단일 `onEvent(UiEvent)`

ARIA 정확도와 collection 추상화가 1순위면 RA 가 답입니다. **W3C 어휘 일치 + 단일 dispatch** 가 1순위면 `@interactive-os/aria-kernel`.

### Q. `useListboxPattern` · `rootProps` 도 라이브러리 어휘 아닌가?

맞습니다. 정확히는 — **값 어휘**(role, aria-\*, prop 키)는 W3C 그대로, **함수 식별자**는 React 컨벤션과 APG slug 결합입니다.

- `role="listbox"` (값) — spec 그대로
- `optionProps` (값) — ARIA role="option" 그대로
- `useListboxPattern` (식별자) — React Rules of Hooks 컨벤션 + APG `/listbox/` slug
- `rootProps` (식별자) — 한 패턴에 outer 가 하나일 때의 규약

라이브러리가 추가하는 어휘는 React 호환성과 가독성을 위한 최소한입니다.

## W3C·APG

### Q. 24 패턴이 APG 와 정확히 1:1 인가?

거의 그렇습니다. 정확히는:

- **APG `/patterns/`** 카테고리를 미러 (24 항목 중 대부분)
- 일부 ARIA role (`alert`, `switch`) — APG에는 없지만 ARIA 1.2 spec 에 있는 것
- slug 규약: `useTreeviewPattern` ↔ APG `treeview` 처럼 약간의 변환은 있지만 1:1

### Q. APG 가 변하면?

ARIA 1.2 → 1.3 변경 시 라이브러리가 추적합니다. 사용자 마이그레이션은 메이저 버전으로 흡수합니다.

## 데이터·이벤트

### Q. NormalizedData 변환 비용이 매번 들지 않나?

`fromList(items)` 는 한 번 O(N), `fromTree(roots)` 도 한 번 O(N). 대부분 데이터는 fetch 후 한 번만 변환합니다. live update 는 reducer 가 in-place 처리하므로 재변환 ❌.

### Q. TanStack Query · SWR 와 어떻게 결합?

```ts
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
const normalized = useMemo(() => fromList(data ?? []), [data])
return <Listbox data={normalized} ... />
```

또는 `useResource` (`@interactive-os/resource`) 가 query/cache 어댑터 역할을 할 수 있습니다.

### Q. UiEvent 11 variant 가 부족하지 않나?

다음은 의도적 제외:

- drag-and-drop · file-upload — DOM 이벤트 그대로 사용 권장 (`onDragStart` 등)
- copy/paste — 같은 이유
- undo/redo — middleware 책임 (PreDispatchCtx)

`UiEvent` 는 **컬렉션 인터랙션의 의미 어휘**에 한정됩니다. DOM/network 이벤트는 React 표준 채널.

### Q. Date · Map · Set 같은 비-JSON 값은?

직렬화 가능 강제는 라이브러리 영역(meta, ROOT 등) 에만 적용됩니다. 사용자 entity 의 `data` 필드 안에는 자유 — `{ id: 'a', data: { createdAt: new Date() } }` 가능. 직렬화가 필요한 경계에서 string 변환은 사용자 책임입니다.

## 시각

### Q. focus ring · dark mode · motion 은?

라이브러리가 다루지 않습니다 — 시각 invariant 이기 때문. Tailwind v3 의 modifier 로 표현 가능합니다:

```tsx
<li className="focus-visible:ring-2 ring-blue-500 dark:bg-stone-900 motion-reduce:transition-none">
```

이걸 한 곳에 묶고 싶으면 사용자가 자기 wrapper 컴포넌트를 만들면 됩니다 — 사이트 `/wrappers` 에 예시.

### Q. 결국 자기 wrapper 만들면 컴포넌트 라이브러리로 회귀하지 않나?

부분 그렇습니다. 다만 **회귀가 아니라 의도된 분업**입니다:

- `@interactive-os/aria-kernel` = 행동 SSOT (24 패턴 행동을 한 곳에)
- 사용자 wrapper = 시각 SSOT (자기 디자인시스템에 한 번만 입힘)

shadcn/ui 도 결국 같은 구조입니다 — Radix UI 위에 Tailwind 입혀서 사용자 코드베이스로 복사. 차이는 "시각 결정을 라이브러리가 안 한다"는 것뿐.

## 다음 단계

- [Getting Started](/docs/getting-started) — 5분 안에 첫 화면
- [Overview](/docs/overview) — SCQA 로 정체성
- [Comparison](/docs/comparison) — 다른 라이브러리와의 차이
- [Core Concept](/docs/core-concept) — 어휘 · 합성 모델

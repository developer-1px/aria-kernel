# Comparison

`@interactive-os/aria-kernel` 가 다른 라이브러리와 어떻게 다른지 — 그리고 **왜 이 niche 가 메워야 했는지**를 설명합니다. 각 라이브러리는 자기 자리가 명확하므로, 이 글은 우열을 가리는 게 아니라 **빈 자리** 를 보여주려는 것입니다.

## 한눈에 보기

| 라이브러리 | 층위 | markup | style | 데이터 모델 | 이벤트 |
|----|----|----|----|----|----|
| **Material UI · Ant Design · Chakra** | 컴포넌트 + 디자인시스템 | 라이브러리 결정 | 토큰까지 제공 | controlled props | callback per part |
| **shadcn/ui** | 복사 컴포넌트 (Radix + Tailwind) | 라이브러리 결정 (복사 후 수정 가능) | Tailwind utility | controlled props | callback per part |
| **Radix UI** · **Base UI** | 무스타일 컴포넌트 | 라이브러리 결정 (compound) | 무스타일 | controlled/uncontrolled | callback per part |
| **Headless UI** | 무스타일 컴포넌트 | 라이브러리 결정 | 무스타일 | controlled props | callback per part |
| **Ariakit** | 컴포넌트 + 일부 hook | 라이브러리 결정 | 시작 스타일 제공 | store API | callback per part |
| **React Aria / RAC** | 컴포넌트(RAC) + hook(RA) | RAC 가 결정 / hook 은 자유 | 무스타일 | Collection iterator | `onAction`·`onSelectionChange` 등 |
| **`@interactive-os/aria-kernel`** | 행동 인프라 (hook only) | 소비자가 결정 | 0건 | NormalizedData (3-store) | 단일 `onEvent(UiEvent)` |

## 빈 자리 — 왜 또 만들어야 했나

기존 라이브러리들은 모두 **무엇을 묶을지** 의 결정에서 나뉩니다. 시각·markup·행동·데이터·이벤트 — 이 다섯을 어떻게 패키징하는가가 그들의 정체성입니다.

```
                                      더 많이 입혀짐 ↑
   ┌──────────────────────────────────┐
   │ Material UI · Ant Design         │  컴포넌트 + 디자인시스템 토큰
   │ Chakra UI                        │
   ├──────────────────────────────────┤
   │ shadcn/ui                        │  복사 컴포넌트 (Tailwind 입혀짐)
   ├──────────────────────────────────┤
   │ Radix UI · Base UI · Headless UI │  무스타일 컴포넌트 (markup + 행동)
   │ Ariakit                          │
   ├──────────────────────────────────┤
   │ React Aria (hook 부분)           │  컴포넌트 + hook 둘 다
   ├──────────────────────────────────┤
   │ @interactive-os/aria-kernel                      │  행동만 (hook + props getter)
   ├──────────────────────────────────┤
   │ WAI-ARIA / APG spec              │  명세
   └──────────────────────────────────┘
                                      더 적게 입혀짐 ↓
```

이 사다리에서 **spec 바로 위, 컴포넌트 바로 아래** — 이 자리는 비어 있었습니다. 가장 비슷한 곳은 React Aria 의 hook 부분이지만, 그것도 자체 Collection iterator 와 callback set 어휘를 추가합니다.

`@interactive-os/aria-kernel` 가 채우려는 자리는 한 줄로 표현됩니다.

> **WAI-ARIA spec 의 행동만, 추가 어휘는 최소.**

이 자리가 필요했던 구체적 이유는 다음 4가지입니다.

## 왜 이 niche 인가 — 4가지 이유

### 1. markup 결정권을 소비자에게 돌려주기 위해

기존 라이브러리는 거의 모두 **markup 구조를 강요**합니다.

- Radix · Headless UI · Ariakit · RAC: compound API (`<Listbox.Root>` `<Listbox.Item>`) 가 markup 의 부모-자식 관계를 결정
- Material · Ant: 더 강하게, markup + class 까지 결정

이게 잘 맞으면 편하지만, 디자이너가 "이 리스트는 grid 두 줄로, 항목 사이에 separator, 첫 항목은 sticky" 같은 변형을 요구하면 컴포넌트의 markup 기대를 깨야 합니다. 안 되는 건 아닌데 매번 우회 비용이 듭니다.

`@interactive-os/aria-kernel` 는 markup 구조를 모릅니다. `<ul>` 을 쓰든 `<div role="listbox">` 를 쓰든, `<li>` 를 `<button>` 으로 바꾸든 동작합니다. 행동만 챙기고 markup 은 소비자에게.

### 2. 어휘 통역 비용을 없애기 위해

W3C ARIA spec 에는 `role="listbox"` · `aria-selected` · `aria-activedescendant` 가 있습니다. 라이브러리는 거기에 자기 어휘를 더합니다 — `<Listbox.Root>` · `useListBox()` · `Item` · `Section` · `triggerProps` …

이중 어휘는 학습 비용이고, 검색 비용이고, LLM 추론 비용입니다. spec 을 읽다가 코드로 옮길 때 **매번 통역**해야 합니다.

`@interactive-os/aria-kernel` 의 값 어휘(role · aria-\* · prop 키) 는 spec 그대로입니다. spec 페이지(`https://www.w3.org/WAI/ARIA/apg/patterns/listbox/`) 와 코드(`useListboxPattern`) 사이에 통역이 없습니다.

### 3. 단일 데이터 인터페이스를 위해

화면 한 곳에 listbox + tree + grid + combobox 가 같이 있을 때, 각 라이브러리는 각자의 데이터 형태를 요구합니다.

- Listbox 는 `value` + `onChange`
- Tree 는 자체 children 트리 + `expandedKeys`
- Grid 는 row × column 자체 어댑터
- Combobox 는 또 다른 형태

같은 화면 안에서 4가지 데이터 모양을 변환해 가며 props 를 채워야 합니다.

`@interactive-os/aria-kernel` 는 다 같은 형태입니다.

```ts
{ entities, relationships, meta }
```

listbox 도 tree 도 grid 도 combobox 도 이 한 형태. 트리에서 leaf 를 listbox 로 빼고 싶을 때 데이터 변환 없이 같은 store 에서 바로 가능합니다.

### 4. 단일 dispatch 어휘를 위해

기존 라이브러리는 part 마다 callback 이 따로 있습니다 — `onSelect` · `onChange` · `onOpenChange` · `onAction` · `onSelectionChange` · `onSortChange` · `onExpandedChange` …

여러 part 가 같이 사는 화면에서는 callback 이 5개 10개 늘어나고, 각자 다른 인자 형태로 옵니다. middleware (logging, undo/redo, replay, telemetry) 를 끼워 넣으려면 모든 callback 을 일일이 감싸야 합니다.

`@interactive-os/aria-kernel` 는 한 채널입니다.

```ts
onEvent(e: UiEvent)
```

11 variant discriminated union 한 곳에 모든 의미 변화가 흘러갑니다. middleware 한 곳, undo stack 한 곳, replay 한 채널.

이 invariant 는 reducer 패턴(`(data, event) → next data`) 과 자연스럽게 결합되고, **LLM 이 추론하기 쉬운 형태** 입니다.

## 시나리오별 추천

본인 상황에 어떤 도구가 맞는지:

### "당장 화면을 띄워야 한다, 디자인은 표준이면 OK"

→ **Material UI · Ant Design · Chakra UI**. 디자인 시스템 토큰까지 다 정의돼 있습니다.

### "Tailwind 로 직접 디자인하고 싶다, 컴포넌트는 복사해서 수정하는 방식이 좋다"

→ **shadcn/ui**. Radix UI + Tailwind 가 이미 입혀진 코드를 복사해서 본인 코드베이스로.

### "compound 컴포넌트 어휘 (`<Listbox.Root>`) 가 익숙하다, markup 도 라이브러리에 맡기고 싶다"

→ **Radix UI · Base UI · Headless UI · Ariakit**. 무스타일이지만 markup 구조와 동작은 라이브러리가 결정.

### "ARIA 정확도와 collection 추상화가 필요하다"

→ **React Aria / RAC**. Adobe 팀의 행동 정확도가 높고 collection iterator 가 잘 다듬어져 있습니다.

### "자체 디자인 시스템 + 행동 인프라만 빌리려는 niche"

→ `@interactive-os/aria-kernel`. 위 4가지 이유에 공감되면 적합한 자리입니다.

## 다음 단계

- [Getting Started](/docs/getting-started) — 5분 안에 첫 화면
- [Overview](/docs/overview) — SCQA 로 정체성 다시 보기
- [Core Concept](/docs/core-concept) — 어휘 · 합성 모델
- [FAQ](/docs/faq) — 자주 묻는 질문

## 참조

- [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI](https://www.radix-ui.com/) · [Base UI](https://base-ui.com/) · [Headless UI](https://headlessui.com/) · [Ariakit](https://ariakit.org/) · [React Aria](https://react-spectrum.adobe.com/react-aria/)
- [shadcn/ui](https://ui.shadcn.com/) · [Material UI](https://mui.com/) · [Chakra UI](https://chakra-ui.com/) · [Ant Design](https://ant.design/)

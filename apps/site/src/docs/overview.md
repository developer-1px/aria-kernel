# Overview

## 익숙한 풍경

웹앱을 만들 때 우리는 보통 컴포넌트 라이브러리에 손을 내밉니다. Material UI · Ant Design · shadcn/ui · Radix UI · Headless UI — 이름은 다양하지만 약속은 같습니다.

> "리스트, 탭, 메뉴, 드롭다운, 다이얼로그… 자주 쓰는 UI 를 미리 만들어 둘 테니 가져다 쓰세요."

설치 한 줄, import 한 줄, 쓰기만 하면 키보드로 화살표 눌러서 메뉴 항목을 이동하고, Enter 로 선택하고, Escape 로 닫고, 스크린리더가 옳게 읽어 주는 — 이런 **접근성 동작**까지 다 들어 있는 컴포넌트가 화면에 등장합니다. 편합니다.

## 그런데 이런 적이 있지 않으셨나요

PowerPoint 의 좌측 슬라이드 썸네일 목록을 떠올려 보세요.

- 슬라이드는 **번호 매겨진 평평한 리스트** 처럼 보입니다
- 그러나 실제로는 섹션(슬라이드 그룹)이 있고, 섹션을 접고 펼칠 수 있고, 슬라이드를 다른 섹션으로 옮길 수도 있습니다
- 즉 **데이터 구조는 tree 인데, 시각은 (썸네일 카드를 세로로 쌓은) list** 입니다

이런 화면을 만들려고 컴포넌트 라이브러리를 찾아 보면 곧 막힙니다.

- `<TreeView>` 컴포넌트 — 들여쓰기 + disclosure 화살표 + 들여쓴 자식. **시각은 트리 모양 그 자체**. 썸네일 카드 모양으로 못 만듭니다.
- `<List>` 컴포넌트 — 평평한 리스트만. 섹션 접기/펼치기, 자식 이동 같은 tree 행동 없음.

같은 일이 다른 곳에서도 일어납니다.

- **파일 탐색기의 column view** (Mac Finder) — 데이터는 tree, 시각은 가로 컬럼 3개
- **카탈로그의 카테고리 그리드** — 데이터는 tree (대분류 > 중분류 > 상품), 시각은 카드 grid
- **타임라인의 중첩 이벤트** — 데이터는 tree (이벤트 > 하위 단계), 시각은 가로 timeline
- **Kanban 의 그룹 보드** — 데이터는 tree (스윔레인 > 카드), 시각은 가로 컬럼

**행동 그래프(tree)** 와 **시각 표현** 이 다른 경우. 흔합니다. 그런데 이걸 다루는 헤드리스 라이브러리는 없습니다 — 모두 행동과 시각을 묶어서 같이 줍니다.

## 그래서 LLM 에게 시키면

이런 화면이 필요할 때 우리는 보통 LLM 에 시킵니다 — "PPT 슬라이드 썸네일 목록 만들어줘". LLM 은 결국 **custom 코드** 를 씁니다. 그리고 거의 매번 놓칩니다.

- 화살표 키 이동 (위/아래만 챙기고 좌/우 섹션 간 이동은 빠뜨림)
- typeahead — 글자로 슬라이드 찾기
- Home/End · PageUp/PageDown
- 다중 선택 — Shift+클릭 범위, Ctrl/Meta+클릭 토글, Ctrl+A 전체
- `aria-activedescendant` · `aria-selected` · `aria-multiselectable` · `aria-level`
- roving tabindex (포커스 하나 + 나머지 `tabindex="-1"`)
- 섹션 접힘 시 자식 건너뛰는 visible-flat traversal
- 드래그·키보드 이동 시 부모 변경 처리

[W3C APG](https://www.w3.org/WAI/ARIA/apg/) 가이드는 이걸 다 정의해 두었지만, 정확히 따라가려면 listbox 하나에 200줄 이상이 듭니다. LLM 은 그 양을 한 번에 다 챙기지 못합니다.

## 그래서 우리가 정말 원하는 것은

이 두 가지입니다.

> **데이터 구조(tree·list·grid…)와 시각 표현(카드·컬럼·grid·timeline…) 을 따로 결정하고 싶다.
> 그리고 행동(키보드·포커스·접근성) 은 누가 보증해 줬으면 좋겠다.**

기존 라이브러리들은 "행동 + 시각 + markup" 을 묶어서 줍니다. tree 데이터에는 tree 모양 UI 가, list 데이터에는 list 모양 UI 가 따라옵니다. **데이터 구조와 시각이 어긋나는 화면은 라이브러리 밖**입니다.

이 어긋남을 메우는 도구가 있다면 — 행동 그래프는 spec 그대로 보증되고, 시각은 자유롭게 (썸네일이든 컬럼이든 카드든) 그릴 수 있다면 — 어떨까요?

## 답 — `@p/aria-kernel`

`@p/aria-kernel` 는 정확히 그 한 가지만 합니다.

PPT 썸네일 예제로 돌아가 봅시다 — 데이터는 tree, 시각은 평평한 카드 list.

```ts
import { fromTree } from '@p/aria-kernel'
import { useTreeviewPattern } from '@p/aria-kernel/patterns'

// 데이터: tree (섹션 > 슬라이드)
const data = fromTree([
  { id: 'intro', label: 'Intro', children: [
    { id: 's1', label: 'Slide 1' },
    { id: 's2', label: 'Slide 2' },
  ]},
  { id: 'body', label: 'Body', children: [
    { id: 's3', label: 'Slide 3' },
  ]},
])

const { rootProps, itemProps, items } = useTreeviewPattern(data, onEvent)

// 시각: 평평한 카드 list (들여쓰기·disclosure 화살표 없음)
return (
  <div {...rootProps} className="flex flex-col gap-2 p-3">
    {items.map((it) => (
      <div key={it.id} {...itemProps(it.id)} className="rounded border bg-white p-2 shadow-sm hover:bg-stone-50">
        {it.label}
      </div>
    ))}
  </div>
)
```

**행동은 tree** — 화살표로 섹션을 접고 펼치고, 자식 건너뛰기, 부모 이동, `aria-level` · `aria-expanded` · roving tabindex 다 들어 있습니다.
**시각은 list** — 들여쓰기·disclosure 화살표 없이 카드를 세로로 쌓을 뿐입니다.

`useTreeviewPattern` 이 행동을 보증하고, markup 과 className 은 본인이 결정합니다. 카드 grid 로 바꾸고 싶다면? `flex flex-col` 을 `grid grid-cols-3` 로 바꾸기만 하면 됩니다 — 행동은 그대로.

**행동은 끝났고**, 이제 시각은 마음껏.

## 라이브러리의 정체성

이 한 줄이 핵심입니다.

> **컴포넌트 라이브러리가 아니라, 행동 인프라입니다.**

세 가지 약속이 따라옵니다.

### 1. markup · 스타일 · 토큰을 만들지 않습니다

- `<ul>` 을 `<ol>` 로 바꿔도 동작합니다 — 라이브러리는 markup 구조를 강요하지 않습니다
- 색·여백·border 어휘 0건 — Tailwind utility class 또는 본인 CSS 로 직접
- 컴포넌트 wrapper(`<Listbox.Root>` 같은 것) 0건 — hook + props getter 만

### 2. 어휘는 W3C ARIA 그대로

라이브러리가 자체 어휘를 만들지 않습니다. role 이름, ARIA 속성, prop 키 모두 [WAI-ARIA spec](https://www.w3.org/TR/wai-aria-1.2/) 그대로입니다.

- `role="listbox"` · `role="option"` · `aria-selected` · `aria-expanded`
- `optionProps`, `tabProps`, `rowProps`, `gridcellProps` (ARIA role 그대로)

함수 식별자(`useListboxPattern`)는 React 컨벤션과 APG slug(`/listbox/`) 를 결합한 것 — 이 정도가 라이브러리가 추가하는 어휘의 전부입니다.

### 3. 데이터 한 곳, 이벤트 한 채널

```
data → 화면 → 이벤트 → reducer → data
```

- 데이터는 `NormalizedData` 한 형태 — `{ entities, relationships, meta }` plain JSON
- 이벤트는 `onEvent(e)` 한 채널 — 11가지 의미 변종(navigate · activate · expand · select …) 한 union
- 양방향 바인딩 ❌ · class · ref · closure 잔재 ❌

이 한 방향 흐름 덕에 직렬화 · 디버깅 · 테스트 · LLM 추론이 쉬워집니다.

## 진입점

| 진입점 | 어디 | 무엇 |
|--------|------|------|
| Pattern recipe (24개) | `@p/aria-kernel/patterns` | listbox · tabs · tree · menu · combobox · dialog · slider … |
| Axis primitive | `@p/aria-kernel` | navigate · activate · expand · typeahead · multiSelect … (recipe 가 부족할 때 직접 합성) |
| 데이터 빌더 | `@p/aria-kernel` | `fromList`, `fromTree`, `pathAncestors` |
| 단일 dispatch 어휘 | `@p/aria-kernel` (`UiEvent`) | 11 variant union |

라이브 데모: [/patterns](/patterns) · [/axes](/axes) · [/matrix](/matrix) · [/data](/data) · [/uievents](/uievents)

## 다음 단계

- [Getting Started](/docs/getting-started) — 5분 안에 첫 화면
- [Comparison](/docs/comparison) — 다른 라이브러리와의 차이
- [Core Concept](/docs/core-concept) — 데이터 흐름 · 어휘 · 합성 모델
- [FAQ](/docs/faq) — 자주 묻는 질문

## 참조

- [W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) — 정본 어휘 출처

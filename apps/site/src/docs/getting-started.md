# Getting Started

5분 안에 첫 화면을 띄운다. `@p/aria-kernel` 는 ARIA 행동 인프라 — 시각은 Tailwind utility class 가 직접 표현한다.

## 설치

```bash
npm install @p/aria-kernel
npm install react@^19
```

또는 모노레포 인접:

```bash
npm install file:../ds/packages/aria-kernel
```

## 첫 import

컬렉션 패턴은 `use<Pattern>Reducer` + `use<Pattern>Pattern` 두 줄. 둘 다 `@p/aria-kernel/patterns` 에서 끌어 쓴다.

```ts
import { useListboxReducer, useListboxPattern } from '@p/aria-kernel/patterns'
```

- `@p/aria-kernel/patterns` — APG recipe + 1:1 sibling reducer hook (`useListboxReducer`, `useTabsReducer`, ...)
- `@p/aria-kernel` — core 어휘 (`NormalizedData`, `UiEvent`, axes, roving, gesture, `reduce*`, `from*`). escape / custom init 에서 직접 사용.

## 데이터 만들기 — `fromList`

`fromList` 는 flat array 를 `NormalizedData` 로 변환한다. `id` 가 없으면 합성 id (`__0`, `__1`, ...) 가 부여된다.

```ts
const seed = fromList([
  { label: 'Apple' },
  { label: 'Banana' },
  { label: 'Cherry' },
  { label: 'Durian' },
])
```

트리는 `fromTree({ id, children?, ...rest })` 를 쓴다.

## 컴포넌트 — `useListboxPattern`

recipe 한 줄이 `rootProps`, `optionProps(id)`, `items` 를 돌려준다. markup 결정은 소비자.

```tsx
import { useListboxReducer, useListboxPattern } from '@p/aria-kernel/patterns'

const FRUITS = [
  { label: 'Apple' },
  { label: 'Banana' },
  { label: 'Cherry' },
  { label: 'Durian' },
]

export default function Demo() {
  const [data, dispatch] = useListboxReducer(FRUITS)
  const { rootProps, optionProps, items } = useListboxPattern(data, dispatch)

  return (
    <ul
      {...rootProps}
      aria-label="Fruits"
      className="w-56 rounded-md border border-stone-200 bg-white p-1 text-sm"
    >
      {items.map((item) => (
        <li
          key={item.id}
          {...optionProps(item.id)}
          className="cursor-pointer rounded px-2 py-1 hover:bg-stone-100 aria-selected:bg-stone-900 aria-selected:text-white"
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}
```

경계 — **행동은 `useListboxPattern`, 시각은 Tailwind utility class.** 두 축은 섞지 않는다.

## 키보드 동작 확인

`useListboxPattern` 은 [APG `/listbox/`](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) 의 키 매핑을 자동으로 부여한다. 마우스를 떼고 검증한다.

| 키 | 동작 |
|---|---|
| `Tab` | listbox 진입 (roving group 당 tab stop 1개) |
| `ArrowDown` / `ArrowUp` | 이전/다음 option 으로 focus 이동 |
| `Home` / `End` | 첫/마지막 option |
| `Enter` / `Space` | activate (selection-follows-focus 기본 활성) |
| 인쇄 가능 문자 | typeahead — label prefix 매칭 |

검증 체크리스트:

1. `npx tsc --noEmit -p tsconfig.app.json`
2. `npx vite dev` — 콘솔 에러 0
3. 키보드만으로 모든 인터랙션 가능 (Tab + Arrow + Enter + Escape)

## 다음으로

- → [Overview](./overview.md) — 왜 이 라이브러리인가, Radix/Headless UI 와의 위치
- → [Core Concept](./core-concept.md) — 데이터 흐름, `NormalizedData`, `UiEvent`, axis, recipe

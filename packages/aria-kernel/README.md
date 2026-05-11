# @p/aria-kernel

**React + Reducer 기반 ARIA 행동 인프라.** W3C/APG 패턴 recipe + axis 합성 + roving tabindex + gesture/intent 변환. 데이터는 `useReducer(reduceSingleSelect, items, fromList)` 직접 합성. 토큰/CSS/UI 어휘 0건.

## Canonical 합성

```tsx
import { useReducer } from 'react'
import { reduceSingleSelect, fromList } from '@p/aria-kernel'
import { useListboxPattern } from '@p/aria-kernel/patterns'

const ITEMS = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]

function Picker() {
  const [data, dispatch] = useReducer(reduceSingleSelect, ITEMS, fromList)
  const { rootProps, itemProps } = useListboxPattern(data, dispatch, { label: 'Items' })
  return (
    <ul {...rootProps}>
      {data.meta.root.map((id) => <li key={id} {...itemProps(id)}>{data.entities[id].label}</li>)}
    </ul>
  )
}
```

- 데이터 hook wrapper 없음 — React `useReducer` 직접.
- HMR/devtools/persist 는 `composeReducers` middleware.
- 자세한 합성·escape 패턴은 [CANONICAL.md](./CANONICAL.md).

## 설치

```bash
npm install @p/aria-kernel
# peer
npm install react@^19
```

또는 file 경로 (모노레포 인접):

```bash
npm install file:../ds/packages/aria-kernel
```

## 한 줄 사용

```tsx
import { useSpatialNavigation } from '@p/aria-kernel'

function Toolbar() {
  const { ref, onKeyDown } = useSpatialNavigation<HTMLDivElement>(null, {
    orientation: 'horizontal',
  })
  return (
    <div ref={ref} onKeyDown={onKeyDown} role="toolbar">
      <button>A</button><button>B</button><button>C</button>
    </div>
  )
}
```

## 카테고리

| 카테고리 | 핵심 export |
|---|---|
| **Types** | `Entity` · `NormalizedData` · `UiEvent` · `ValueEvent` · `ROOT` |
| **State** | `reduce` · `reduceSingleSelect` · `reduceMultiSelect` · `reduceRadio` · `composeReducers` · `fromTree` · `fromList` · `fromFlatTree` · `useControlState` · `useEventBridge` |
| **Axes** | `composeAxes` · `navigate` · `activate` · `expand` · `treeNavigate` · `typeahead` · `toggle` · `multiSelect` · `gridMultiSelect` |
| **Roving** | `useRovingTabIndex` · `useSpatialNavigation` · `useActiveDescendant` |
| **Gesture** | `composeGestures` · `navigateOnActivate` · `selectionFollowsFocus` · `expandBranchOnActivate` |
| **Patterns** | `@p/aria-kernel/patterns` (subpath) — `useListboxPattern` · `useTreePattern` · ... 21종 |
| **Store** | `@p/aria-kernel/store` (subpath, 옵션) — `useResource` · `defineResource` · `writeResource` · `useFeature` · `defineFeature` |

## Subpath imports

```ts
import { composeAxes, navigate } from '@p/aria-kernel/axes'
import { useRovingTabIndex } from '@p/aria-kernel/roving'
import { useListboxPattern } from '@p/aria-kernel/patterns'
import { useResource } from '@p/aria-kernel/store'
```

## UI Registry Augmentation

`UiNode.component`을 등록된 이름 set으로 좁히기:

```ts
declare module '@p/aria-kernel/layout/nodes' {
  interface Register {
    component: keyof typeof uiRegistry
  }
}
```

## invariant

`INVARIANTS.md` 참조 — §A APG 외부 권위 7 + §B ds 아키텍처 선언 9 + §B-ter ARIA-punt 흡수 5 + 파생.

위반은 버그 또는 정책 전환이지 개선이 아니다.

## /lab — ARIA-punt 흡수 PoC

소비자가 자체 구현하던 ad-hoc 코드(document mousedown · data.entities mutation · `<input onKeyDown>`) 가 kernel 어디에 흡수됐는지 5 PoC + 25 black-box test + 17 kernel hook test 로 가시화. `apps/site/src/lab/` (라우트 `/lab`).

| Demo | 흡수 API | kernel test | lab test |
|---|---|---|---|
| `dialog-backdrop` | `backdropProps` | 4 | 5 |
| `tabs-controlled` | `active` | 3 | 5 |
| `menu-outside-close` | `onInteractOutside` | 4 | 5 |
| `grid-edit-start` | `editStart` UiEvent + Enter chord | 3 | 5 |
| `dialog-on-keymap` | `on` middleware | 3 | 5 |

## 빌드

```bash
pnpm build       # esm + cjs + dts → dist/
pnpm typecheck   # tsc --noEmit
pnpm clean       # dist/ 제거
```

## 라이선스

MIT

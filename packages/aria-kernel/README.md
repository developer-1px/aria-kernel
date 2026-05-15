# @interactive-os/aria-kernel

**React + Reducer 기반 ARIA 행동 인프라.** W3C/APG 패턴 recipe + axis 합성 + roving tabindex + gesture/intent 변환. 데이터는 `use<Pattern>Reducer` 한 줄. 토큰/CSS/UI 어휘 0건.

## Canonical 합성 (with side effect)

```tsx
import { useListboxReducer, useListboxPattern } from '@interactive-os/aria-kernel/patterns'
import { useNavigate } from '@tanstack/react-router'

const FRUITS = [{ id: 'apple', label: 'Apple' }, { id: 'banana', label: 'Banana' }]

function Picker() {
  const [data, baseDispatch] = useListboxReducer(FRUITS)
  const navigate = useNavigate()

  // side effect: dispatch wrapping — onActivate / onSelect 같은 callback prop 0
  const dispatch = (e) => {
    baseDispatch(e)
    if (e.type === 'activate') navigate({ to: '/fruit/' + e.id })
  }

  const { rootProps, optionProps } = useListboxPattern(data, dispatch, { label: 'Fruits' })
  return (
    <ul {...rootProps}>
      {data.meta.root.map((id) => <li key={id} {...optionProps(id)}>{data.entities[id].label}</li>)}
    </ul>
  )
}
```

**중요 — side effect 는 dispatch wrapping 으로.** `onActivate` / `onSelect` / `onChange` 같은 callback prop 없음. event 가 진실, callback 은 dispatch wrap 으로 사용자가 합성 — 모든 event 타입에 universal 작동.

- 컬렉션 패턴마다 `use<Pattern>Reducer` 1:1 sibling — `items` 입력, `{ multi, enhance }` 옵션.
- middleware (HMR/devtools/persist/undo) 는 `enhance` 옵션 (HOR — `redux-undo` 등 호환). custom init / 합성은 React `useReducer` 직접 (escape).
- 자세한 합성·escape·controlled-input 패턴은 [CANONICAL.md](./CANONICAL.md).

## 설치

```bash
npm install @interactive-os/aria-kernel
# peer
npm install react@^19
```

또는 file 경로 (모노레포 인접):

```bash
npm install file:../ds/packages/aria-kernel
```

`file:` link 사용 시, consumer 의 Vite/번들러에 `react` dedupe 를 추가한다 — workspace dev 의 `node_modules/react` symlink 가 함께 노출되어 React 인스턴스가 중복되면 `Invalid hook call` 이 발생한다.

```ts
// vite.config.ts
export default defineConfig({
  resolve: { dedupe: ['react', 'react-dom'] },
})
```

npm registry 설치(`npm install @interactive-os/aria-kernel`)에서는 불필요. 대안으로 `pnpm pack` 으로 tarball 을 만들어 설치하면 dedupe 없이 작동한다.

## 한 줄 사용

```tsx
import { useSpatialNavigation } from '@interactive-os/aria-kernel'

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
| **Gesture** | `composeGestures` · `navigateOnActivate` · `selectionFollowsFocus` · `expandBranchOnActivate` · `expandOnActivate` · `activateProps` · `useZoomPanGesture` |
| **Clipboard** | `@interactive-os/aria-kernel/clipboard` — `usePatternClipboard` · `ClipboardSerializerOptions` |
| **Key** | `@interactive-os/aria-kernel/key` (subpath) — `useShortcut` · `onShortcut` · `bindGlobalKeyMap` · `useKeyMap` · `routeInsideEditable` · `isEditable` · `fromKeyboardEvent` |
| **Spec** | `APG_KEYBOARD_SPEC` · `allApgChords` · `APG_PATTERN_EXAMPLE_SPEC` · `allApgExamples` · `IMPL_CHORDS` · `normalizeChord` · `normalizeChordSet` |
| **Patterns** | `@interactive-os/aria-kernel/patterns` (subpath) — `useListboxPattern` · `useTreeviewPattern` · ... 21종 |

## Subpath imports

```ts
import { composeAxes, navigate } from '@interactive-os/aria-kernel/axes'
import { useRovingTabIndex } from '@interactive-os/aria-kernel/roving'
import { useShortcut } from '@interactive-os/aria-kernel/key'
import { useListboxPattern } from '@interactive-os/aria-kernel/patterns'
```

## UI Registry Augmentation

`UiNode.component`을 등록된 이름 set으로 좁히기:

```ts
declare module '@interactive-os/aria-kernel/layout/nodes' {
  interface Register {
    component: keyof typeof uiRegistry
  }
}
```

## invariant

`INVARIANTS.md` 참조 — §A APG 외부 권위 7 + §B ds 아키텍처 선언 9 + §B-ter ARIA-punt 흡수 5 + 파생.

위반은 버그 또는 정책 전환이지 개선이 아니다.

## Harness

Demo routes and consumer apps are outside this package repo in
`../aria-kernel-apps`. They consume this package through
`@interactive-os/aria-kernel`.

## 빌드

```bash
pnpm build       # esm + cjs + dts → dist/
pnpm typecheck   # tsc --noEmit
pnpm clean       # dist/ 제거
```

## 라이선스

MIT

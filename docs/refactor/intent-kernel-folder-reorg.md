# Intent Kernel 폴더 재구성 계획

`@p/aria-kernel` 패키지명은 하위호환을 위해 유지한다. 내부 책임은 다음 파이프라인으로 재정렬한다.

```text
read model -> accessible affordance -> UiEvent -> write execution
```

ARIA는 패키지 전체 정체성이 아니라 read projection 하위 책임이다.

## 목표 구조

```text
packages/aria-kernel/src
|-- read/
|   |-- focus/
|   `-- roving/
|-- input/
|   |-- keyboard/
|   |   |-- axes/
|   |   `-- key/
|   |-- gesture/
|   `-- clipboard/
|-- intent/
|   |-- events.ts
|   `-- schema.ts
|-- view-state/
|-- patterns/
|-- spec/
`-- index.ts

packages/resource/src
|-- store/
|-- mutation/
|-- feature/
`-- adapters/
    `-- zod-crud/
```

## 책임 맵

| 책임 | 목표 위치 | 규칙 |
|---|---|---|
| ARIA/read affordance | `aria-kernel/src/read` | 데이터가 focus, current, roving, active-descendant, ARIA-facing state로 보이는 방식 |
| native input transport | `aria-kernel/src/input` | keyboard, clipboard, pointer, drag 이벤트를 `UiEvent`로 번역 |
| intent vocabulary | `aria-kernel/src/intent` | `UiEvent`, category, runtime schema |
| local UI state | `aria-kernel/src/view-state` | persistence 없는 focus/select/check/open/expand reducer |
| APG recipe | `aria-kernel/src/patterns` | read projection + input transport + view-state 조립 |
| external store | `resource/src/store` | `useResource`, `defineResource`, `writeResource` |
| mutation routing | `resource/src/mutation` | `UiEvent` edit vocabulary를 port로 라우팅 |
| zod-crud adapter | `resource/src/adapters/zod-crud` | zod-crud 전용 write execution, codec, bridge |

## 하위호환 정책

스크립트는 기존 public import를 깨지 않도록 old path shim을 만든다.

- `@p/aria-kernel`
- `@p/aria-kernel/patterns`
- `@p/aria-kernel/axes`
- `@p/aria-kernel/key`
- `@p/aria-kernel/gesture`
- `@p/aria-kernel/roving`
- `@p/aria-kernel/focus`
- `@p/aria-kernel/state`
- `@p/aria-kernel/axes/chord` 같은 deep wildcard import
- `@p/resource`
- `@p/resource/zod-crud`

이동 후 새 코드는 책임 기반 subpath를 선호한다.

```ts
import type { UiEvent } from '@p/aria-kernel/intent/events'
import { usePatternClipboard } from '@p/aria-kernel/input/clipboard/usePatternClipboard'
import { routeUiEventToCrud } from '@p/resource/mutation'
```

## 스크립트

Dry run:

```bash
pnpm refactor:intent-folders
```

Apply:

```bash
pnpm refactor:intent-folders -- --apply
pnpm build
pnpm --filter @p/aria-kernel test
```

스크립트가 하는 일:

1. old-path -> new-path move map을 만든다.
2. 이동 전 기준으로 relative import의 실제 target을 resolve한다.
3. 새 파일 위치 기준 relative import로 rewrite 계획을 만든다.
4. 파일/디렉터리를 이동한다.
5. rewrite를 새 위치에 반영한다.
6. old public path에 compatibility shim을 만든다.
7. 새 subpath export를 `package.json`에 추가하고 기존 subpath는 유지한다.

## 하지 않는 일

- `@p/aria-kernel` package rename
- behavior 변경
- zod-crud 로직 변경
- 작은 패키지 다수로 split
- visual component/design-system 작업

## 적용 후 검증

1. `pnpm build`
2. `pnpm --filter @p/aria-kernel test`
3. 스크립트가 놓친 import가 있으면 수동 보정
4. 그 다음에만 `useZodCrudResource.ts` 내부 helper 분리를 진행

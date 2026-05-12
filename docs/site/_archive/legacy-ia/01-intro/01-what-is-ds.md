# What is ds

**ds는 role 컴포넌트 어휘 + 정본(canonical form) + lint 강제로 구성된 React 디자인 시스템이다.** 사람이 짠 코드와 LLM이 생성한 코드가 같은 형태로 수렴하도록, 의도적으로 선택지를 줄인다. 대상 독자는 LLM을 도구로 UI 코드를 작성·검토·생성하는 팀이다.

## 30초 멘탈 모델

ds는 세 층으로 작동한다.

1. **어휘 (Vocabulary)** — `ui/`의 role 컴포넌트(`Listbox`, `Menu`, `Tree`, `Dialog`...)와 `parts/`의 부품(`Card`, `Avatar`, `CountBadge`...). 컴포넌트 이름이 곧 의미다. variant prop·임의 className·`as` prop은 없다.
2. **정본 (Canonical form)** — 같은 의도를 표현하는 방법이 1개다. 레이아웃은 `definePage` 트리, 데이터는 `useResource`, wiring은 `defineFlow`. JSON으로 직렬화 가능한 형태만 정본이 된다.
3. **강제 (Enforcement)** — TypeScript + lint + audit 스크립트로 정본 외 형태를 컴파일 시점에 차단한다. 빠져나갈 escape hatch는 없다.

## 한 컴포넌트의 형태

```tsx
<Menu
  data={[
    { id: 'open', label: 'Open' },
    { type: 'separator' },
    { id: 'delete', label: 'Delete', disabled: true },
  ]}
  onEvent={(e) => dispatch(e)}
/>
```

입력은 `data` 1개, 출력은 `onEvent` 1개. children JSX 자유 조립도, `variant`/`size`/`color` enum도 없다. 같은 메뉴를 100번 생성해도 100번 같은 형태가 나온다 — LLM이든 사람이든.

## 누가 쓰는가

- LLM codegen·copilot이 일상 도구가 된 팀
- 일관성을 코드 리뷰가 아니라 lint로 강제하고 싶은 팀
- React + TypeScript 스택에서 ARIA 의미를 우선하는 팀

ds가 적합하지 않은 경우는 [When NOT to use ds](./03-when-not-to-use.md)에서 솔직하게 다룬다.

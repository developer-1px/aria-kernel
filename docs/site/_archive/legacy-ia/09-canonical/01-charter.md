# 정본 헌장 (불변 원칙)

> **원칙**: 극단적 선언적 직렬화 (Extreme Declarative Serialization)
>
> 모든 정본은 다음 두 조건을 만족해야 한다.
> 1. **선언적** — 형태가 데이터로 기술 가능해야 한다 (명령형 절차 X)
> 2. **직렬화 가능** — JSON/문자열로 왕복(round-trip) 가능해야 한다
>
> 이 두 조건을 만족하면 시간(저장·복원)·공간(이관·공유)·도구(검증·생성·diff)를 가로질러 재현 가능하다. 못 만족하는 표현은 정본이 될 수 없다.

## C1~C6

| # | 원칙 | 의미 |
|---|------|------|
| C1 | **데이터가 곧 UI** | UI = f(data). 컴포넌트 children에 비즈니스 콘텐츠 JSX 금지 — `data` prop으로 |
| C2 | **상태는 직렬화 가능** | useState 값은 JSON.stringify 가능해야 한다. DOM·함수·Promise를 상태에 두지 않는다 |
| C3 | **분기는 데이터 룩업** | switch/if 체인 → 선언적 map. 실행 시점이 아닌 정의 시점에 결정 가능해야 한다 |
| C4 | **명령형은 경계로** | DOM·네트워크·시간 같은 부작용은 ds/core 또는 resource로 격리. widget·route는 선언만 |
| C5 | **이름이 곧 셀렉터** | 스타일 전용 className 금지. tag + role + aria + data-part로 셀렉트한다 |
| C6 | **정본 ≠ 이상형** | 코드에 한 곳도 안 쓰이는 형태를 정본으로 못 박지 않는다 |

## 각 항목 해설

### C1 · 데이터가 곧 UI

JSX children에 비즈니스 텍스트·아이콘·항목을 넘기면 같은 의미가 N가지 형태로 흩어진다. `<Button>저장</Button>` 대신 `<Button data={{ label: '저장' }} />`. children 자유도가 닫히면 컴포넌트 내부의 표현 가능성이 결정된다 — 자유도는 데이터 형태로 옮긴다. 관련: [Q58 definePage vs JSX](../11-faq/06-mechanism-questions.md).

### C2 · 상태는 직렬화 가능

`useState`에 DOM ref·함수·Promise를 보관하면 시간(저장)·공간(이관)·도구(diff)를 통과 못 한다. **상태**는 JSON 가능, **이벤트 채널**(dispatch 함수)은 별개 층 — Redux의 store.dispatch와 action의 구분과 동일. 관련: [Q57 dispatch 직렬화](../11-faq/06-mechanism-questions.md).

### C3 · 분기는 데이터 룩업

`switch (kind) { case 'a': ... case 'b': ... }`는 정의 시점에 가능한 분기를 알 수 없다. `{ a: ComponentA, b: ComponentB }[kind]` 룩업으로 환원되면 정적 분석·테스트·LLM 추론 모두 가능해진다.

### C4 · 명령형은 경계로

DOM 측정·네트워크·`setTimeout` 같은 부작용은 widget·route 안에 두지 않는다. `ds/core` (gesture·activate·focus·flow·resource) 또는 명시 boundary 안에서만 발생한다. 콜사이트는 `data, onEvent`만 본다.

### C5 · 이름이 곧 셀렉터

`.btn-primary` 같은 스타일 전용 className은 의미를 마크업 밖으로 빼낸다. ds는 셀렉터를 `tag + role + aria-* + data-part`로만 짠다. `<button role="tab" aria-selected="true">`가 곧 그 자체로 의미·상태·셀렉터다. 관련: [Q30 CSS 생태계](../11-faq/02-customization.md), [Q55 data-part vs className](../11-faq/06-mechanism-questions.md).

### C6 · 정본 ≠ 이상형

코드에 한 곳도 안 쓰이는 형태를 정본으로 못 박지 않는다. 정본은 합의이지 이상이다. 후보는 코드에 등장한 뒤 평가되고, 등장한 적 없는 형태를 미리 정본으로 박으면 도그마가 된다. C6는 헌장 자체에 박힌 자기 제한이다.

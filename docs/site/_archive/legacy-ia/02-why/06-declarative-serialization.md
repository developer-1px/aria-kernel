# Why · Declarative Serialization

`CANONICAL.md`의 첫 줄: **"원칙: 극단적 선언적 직렬화 (Extreme Declarative Serialization)."** 모든 정본은 (1) 선언적이고 (2) JSON으로 round-trip 가능해야 한다. 이 둘을 만족 못하면 정본 후보에서 탈락한다. 이 필터는 ds의 모든 결정을 가로지르는 메타-원칙이다.

## 1. 두 조건의 정의

### 1.1 선언적 (declarative)

- **데이터로 형태가 기술 가능**: "무엇을(what)"만 적고 "어떻게(how)"를 적지 않는다
- **정의 시점에 결정 가능**: 실행 흐름을 따라가지 않아도 의미를 읽을 수 있다
- **반례**: `useEffect(() => { if (x) ref.current.scrollTo(...) })` — 시점·DOM·조건이 얽혀 정의만 보고는 결과를 모름

### 1.2 직렬화 가능 (serializable)

- **JSON.stringify → JSON.parse 왕복 가능**: 손실 없는 round-trip
- **함수·DOM·Promise 보관 금지**: 이들은 직렬화 경계를 못 넘는다
- **반례**: `useState({ onConfirm: () => {...} })` — 함수가 상태에 들어가면 새로고침 후 복원 불가

## 2. 왜 이 둘을 묶는가

선언적이지만 직렬화 불가한 형태가 가능하다 (예: JSX 자체). 직렬화 가능하지만 명령적인 형태도 가능하다 (예: 명령 배열을 JSON으로 직렬화). ds는 **둘 다**를 요구한다.

|  | 직렬화 가능 | 직렬화 불가 |
|---|------------|------------|
| **선언적** | ds 정본 | JSX, render prop |
| **명령적** | command queue | useEffect 부작용 |

ds 정본은 좌상단 1칸이다. 다른 3칸은 정본이 아니다 (임시·유산으로만 허용).

## 3. 왜 이 필터가 강력한가 — 4가지 가로지르기

직렬화 가능 + 선언적 형태는 다음 4가지를 동시에 가능케 한다.

### 3.1 시간 가로지르기 (저장·복원)

- 상태를 저장했다가 나중에 복원할 수 있다
- 라우트 파라미터·로컬 스토리지·서버 DB에 보관 가능
- 시간 여행 디버깅·undo/redo가 자연스럽게 가능

### 3.2 공간 가로지르기 (이관·공유)

- URL로 상태 공유 (deep link)
- 다른 사용자에게 페이지 상태 전송 (collaboration)
- 이메일·메시지로 "지금 내가 보는 화면" 그대로 전달

### 3.3 도구 가로지르기 (검증·생성·diff)

- 정적 검증 (이 정본 형태가 맞는지 lint)
- 자동 생성 (LLM·codegen·visual builder)
- diff (두 상태의 의미 있는 차이)
- 테스트 (입력 = data, 출력 = data, 비교 = `JSON.eq`)

### 3.4 LLM 가로지르기

- LLM의 입출력은 본질적으로 토큰 시퀀스 = 직렬화된 데이터
- 명령형 부작용은 LLM이 검증·재현하기 어렵다
- 데이터로 표현되는 형태는 LLM이 직접 다룰 수 있다

이 4가지는 같은 속성의 다른 이름이다 — **표현이 자기-충족적(self-contained)**이라는 것.

## 4. 정본 갱신 평가에서의 활용

새 정본 후보가 올라오면 ds는 다음을 묻는다.

1. 이 형태가 데이터로 표현되는가? (선언성)
2. JSON으로 round-trip 가능한가? (직렬화)
3. De facto 표준에 가까운가? (학습 분포)
4. 선택지가 줄어드는가? (decision-shrinking)

(1)·(2)를 통과하지 못하면 (3)·(4) 평가 전에 탈락한다. 이는 표면적 우아함보다 구조적 자기-충족성을 우선하는 필터다.

## 5. 정본의 실제 형태들

### 5.1 레이아웃

```ts
definePage({
  entities: [
    { type: 'topbar', ... },
    { type: 'sidebar', ... },
    { type: 'content', children: [...] },
  ]
})
```

트리 데이터. JSON 직렬화 가능. Renderer가 트리를 받아 DOM으로 그린다.

### 5.2 컴포넌트 입력

```ts
<Menu data={[{ id, label, ... }]} onEvent={dispatch} />
```

`data`는 직렬화 가능. `onEvent`는 함수지만 컴포넌트 외부에서 주입되는 dispatch이므로 컴포넌트 내부 상태가 아님.

### 5.3 이벤트

```ts
{ type: 'activate', id: 'open' }
{ type: 'navigate', direction: 'next' }
```

discriminated union. JSON 직렬화 가능. 로그·재현·테스트 가능.

### 5.4 토큰

```ts
foundations.color.surface.muted   // 'var(--surface-muted)'
```

이름 → 값 매핑. 정적이고 직렬화 가능.

## 6. 무엇이 정본에서 추방되는가

이 필터를 거치면 다음이 자연스럽게 탈락한다.

- **render prop**: 함수 prop, 직렬화 불가
- **useRef 기반 imperative API**: DOM 보관, 직렬화 불가
- **side effect 기반 wiring**: useEffect 의존, 선언성 X
- **useMemo·useCallback**: 결과를 외부에서 검증 불가, SRP 실패 신호
- **자유 className**: 문자열 자유도, 검증 불가
- **variant prop**: enum 분기, 동일 의도 → 다른 출력

이들이 정본에서 빠지면 무엇으로 대체되나? — entity·data·foundation·dispatch. 모두 직렬화 가능한 형태다.

## 7. 명령형의 자리 — 경계로 격리

세상에는 본질적으로 명령적인 것이 있다.

- DOM 조작 (focus 이동, scroll)
- 네트워크 (fetch)
- 시간 (setTimeout, animation)

ds는 이를 부정하지 않는다. 다만 **경계로 격리**한다 (Charter C4: "명령형은 경계로").

- **`ds/core`**: DOM·키보드·focus 등 명령형 부작용을 컴포넌트 내부에 self-attach
- **`resource`**: 네트워크·스토리지 부작용을 `useResource` 안에 격리
- **route·widget**: 선언만. 부작용 0개

명령형은 사라지지 않고 **눈에 보이지 않는 곳**으로 옮겨진다. 소비자(LLM 포함)는 데이터만 다룬다.

## 8. 메타-원칙으로서의 위치

이 원칙은 다른 ds 원칙들의 **필터**로 작동한다.

- "1 role = 1 component" → variant 금지 → variant는 enum 분기 = 비-선언적 → 직렬화 가능 형태(컴포넌트 분리)로 대체
- "Classless" → className 자유 변수 = 직렬화·검증 불가 → ARIA로 대체
- "Data-driven" → children JSX = 직렬화 불가 → data prop으로 대체
- "No escape hatch" → `as` prop·raw role = 자유 변수 = 검증 불가 → 컴포넌트 어휘로 대체

각 원칙의 결정이 **선언성·직렬화 여부**로 통일적으로 설명된다. 이것이 메타-원칙의 의미다.

## 9. 결론 — 표현이 도구를 만든다

ds의 why를 한 줄로 압축하면: **표현을 데이터로 만들면 도구가 따라온다.**

- LLM이 다룰 수 있는 도구
- 검증·diff·재현 도구
- 시간·공간·사람 사이를 넘나드는 도구

선언성·직렬화는 이 모든 도구의 전제조건이다. 따라서 정본의 첫 번째 질문은 "이 형태가 데이터로 환원되는가?"다.

## 더 깊이

- [Canonical · Charter C2·C3·C4](../09-canonical/01-charter.md) — 직렬화·룩업·경계
- [FAQ · 측정과 실험](../11-faq/05-philosophy.md)
- [Why · Data-Driven](./04-data-driven.md) — 컴포넌트 인터페이스에서의 적용

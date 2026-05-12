# Why · Overview

LLM이 UI 코드를 생성하는 시대에 기존 디자인 시스템은 사람을 위한 자유도를 그대로 둔 채 추상화만 더했다. 그 결과 LLM은 매번 "그럴듯하지만 일관되지 않은" 코드를 생성하고, 사람은 그것을 일일이 정정한다. ds의 출발점은 이 비대칭이다.

## 1. 풀려는 문제

### 1.1 LLM-friendly가 아닌 디자인 시스템의 한계

- **선택지 폭증**: `<Button variant="contained" color="primary" size="large" startIcon={...} sx={{...}}>` — LLM은 매번 다른 조합을 고른다
- **자유도 = 비결정성**: `className`·`sx`·`as` prop이 열려있으면 LLM은 동일 의도를 100가지 형태로 표현한다
- **escape hatch의 누적**: 한 번 raw `role="..."`이 허용되면 시연 코드·예제·실서비스가 모두 그 형태로 미끄러진다

### 1.2 사람을 위한 추상화 ≠ 모델을 위한 추상화

사람은 variant prop을 보고 "아, 종류가 있구나" 직관한다. LLM은 variant 목록 전체를 토큰으로 들이마셔 매번 다르게 조합한다. 사람에게 친절한 추상화가 모델에게는 결정 불능 지대가 된다.

## 2. 6가지 원칙

| # | 원칙 | LLM 관점에서의 의미 |
|---|------|---------------------|
| P1 | 1 role = 1 component, [variant 금지](./03-no-variant.md) | 선택지가 1개면 잘못 고를 수 없다 |
| P2 | [Classless](./02-classless.md) — tag + role + aria + data-part | 셀렉터 = 의미. 스타일 전용 이름이 없으니 작명 자유도 0 |
| P3 | [Data-driven rendering](./04-data-driven.md) (`data, onEvent`) | children JSX 자유 조립 금지. 입력 형태가 1개로 고정 |
| P4 | No escape hatches | raw role·`as` prop·임의 className 0개 |
| P5 | [De facto standard 우선](./05-de-facto-standard.md) | LLM 학습 분포에 이미 존재하는 형태 |
| P6 | [Extreme Declarative Serialization](./06-declarative-serialization.md) | JSON round-trip 가능한 표현만 정본 |

## 3. 결과로서의 아키텍처

원칙들은 다음 정본 형태로 구체화된다.

- **`definePage` entities tree**: 레이아웃을 JSX 조립이 아닌 데이터 트리로 선언 → LLM은 트리 노드만 채우면 된다
- **`useResource (value, dispatch(event))`**: 데이터 read/write 인터페이스 1개. 종류별 훅 0개
- **`defineFlow` + `useFlow`**: ui ↔ resource wiring 1조각·한 줄. 이벤트 라우팅을 widget이 알지 못한다
- **gesture/intent 분리**: ui/는 `activate` 단발 emit, navigate/expand 도출은 `ds/core/gesture`로 격리 → 컴포넌트 내부 onKeyDown 분기 0개
- **palette → foundations 2층 토큰**: widget은 semantic만 import. raw scale 직접 참조 0개

## 4. 무엇을 포기했는가

ds는 다음을 의도적으로 차단한다.

- **소비자 자유도**: variant·className·`as` prop의 자유는 의도적으로 차단된다
- **단기 생산성**: "그냥 inline style로 5분 만에 끝내자"가 불가능하다 — 정본을 먼저 정의해야 한다
- **시각적 다양성**: 1 role = 1 component이므로 같은 역할은 같은 모습이다 (변형은 surface 소유자가 weight·opacity로만)

이 포기는 **LLM·사람·도구가 같은 표현으로 수렴**하는 대가로 받는 것이다.

## 5. ds라는 이름의 함의

`ds` = design system이지만, 이 프로젝트에서는 **decision-shrinking system**으로 읽어야 한다. 모든 정본 갱신의 평가 기준은 한 줄이다.

> 선택지가 줄어드는가?

이 질문이 yes면 채택, no면 거부.

## 더 깊이

- [Canonical · Charter](../09-canonical/01-charter.md) — C1~C6 헌장
- [FAQ · Trade-offs](../11-faq/03-trade-offs.md) — 컴포넌트·이름 폭증, 프로토타이핑 비용
- [Comparison · vs shadcn/ui](../03-comparison/01-vs-shadcn.md) — 도착점이 반대인 이유

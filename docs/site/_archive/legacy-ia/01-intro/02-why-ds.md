# Why ds

LLM이 UI 코드를 생성하는 시대가 왔다. 그런데 기존 디자인 시스템(MUI·Chakra·Ant·shadcn)은 사람을 위한 자유도 — variant 폭증, prop 오버로드, 자유 className, escape hatch — 를 그대로 둔 채 추상화만 더했다. 그 결과 LLM은 매번 "그럴듯하지만 일관되지 않은" 코드를 생성하고, 사람은 그것을 일일이 정정한다.

ds는 이 문제를 정면으로 다룬다. **목표: LLM이 생성해도 사람이 짠 것과 동일한 결과로 수렴하는 디자인 시스템.**

## 사람을 위한 추상화 ≠ 모델을 위한 추상화

```tsx
<Button variant="contained" color="primary" size="large" startIcon={...} sx={{...}}>
```

사람은 variant를 보고 "아, 종류가 있구나" 직관한다. LLM은 variant 목록 전체를 토큰으로 들이마셔 매번 다르게 조합한다. `variant` 5개 × `size` 5개 × `color` 5개 = 125개 분기. 학습 분포에 어떤 조합이 자주 등장했는지에 따라 선택이 흔들리고, 같은 의도("위험한 작업의 confirm 버튼")에 회마다 다른 결과가 나온다.

자유 className·`sx`·`as` prop도 마찬가지다. 동일 의도가 100가지 표현으로 갈라진다. 한 번 raw `role="..."`이 허용되면 시연 코드·예제·실서비스가 모두 그 형태로 미끄러진다.

**사람에게 친절한 추상화가 모델에게는 결정 불능 지대가 된다.**

## ds의 답 — 6가지 원칙

| # | 원칙 | LLM 관점 의미 |
|---|------|------|
| P1 | 1 role = 1 component, [variant 금지](../02-why/03-no-variant.md) | 선택지가 1개면 잘못 고를 수 없다 |
| P2 | [Classless](../02-why/02-classless.md) — tag + role + aria + data-part | 셀렉터 = 의미. 작명 자유도 0 |
| P3 | [Data-driven rendering](../02-why/04-data-driven.md) — `(data, onEvent)` | children JSX 금지. 입력 1개로 고정 |
| P4 | No escape hatches | raw role·`as` prop·임의 className 0개 |
| P5 | [De facto standard 우선](../02-why/05-de-facto-standard.md) | LLM 학습 분포에 이미 있는 형태만 채택 |
| P6 | [Extreme Declarative Serialization](../02-why/06-declarative-serialization.md) | JSON round-trip 가능한 표현만 정본 |

## 무엇을 포기했는가

ds는 다음을 의도적으로 차단한다.

- **소비자 자유도**: variant·className·`as` prop의 자유는 없다
- **단기 생산성**: "그냥 inline style로 5분 만에 끝내자"가 불가능하다 — 정본을 먼저 정의해야 한다
- **시각적 다양성**: 1 role = 1 component이므로 같은 역할은 같은 모습이다

이 포기는 **LLM·사람·도구가 같은 표현으로 수렴**하는 대가로 받는 것이다.

## decision-shrinking system

`ds` = design system이지만, 이 프로젝트에서는 **decision-shrinking system**으로 읽는다. 모든 정본 갱신의 평가 기준은 단 한 줄이다.

> 선택지가 줄어드는가?

이 질문에 yes면 채택, no면 거부. 그 이상도 이하도 아니다.

다음 챕터 [Why · 6편](../02-why/README.md)에서 각 원칙을 반례 Q&A까지 깊게 다룬다.

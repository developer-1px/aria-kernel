# 3. Comparison

ds를 다른 디자인 시스템·도구와 같은 좌표계 위에 놓고 본다. 목적은 "ds가 이긴다"가 아니라 **무엇을 다르게 우선하는가**를 분명히 하는 것이다. 각 비교는 같은 기능을 양쪽이 어떻게 쓰는지 코드로 보이고, 끝에 "어떤 팀에 ds가 맞나 / 어떤 팀에 비교 대상이 맞나"를 양방향으로 권한다.

## 차원

비교를 6개 축으로 정렬한다.

1. **component vocab** — 정형화된 컴포넌트 어휘를 제공하는가
2. **ARIA** — 접근성 시맨틱이 기본값인가
3. **variant** — `size`·`tone`·`intent` 같은 시각 분기를 권장하는가
4. **className** — 스타일 전용 className·utility로 자유 변형을 허용하는가
5. **data-driven** — `data, onEvent` 인터페이스로 콘텐츠/이벤트를 흘리는가
6. **canonical lint** — 정본 위반을 정적 분석으로 막는가

## 매트릭스

| | shadcn/ui | Radix | Material 3 | Tailwind | Storybook | Web Components | **ds** |
|---|---|---|---|---|---|---|---|
| component vocab | 있음 | 있음 | 있음 | 없음 | 카탈로그용 | 있음 (Custom Element) | **있음** |
| ARIA | 부분 (Radix 위에) | 있음 | 부분 | 없음 | N/A | 자유 (구현자 책임) | **있음** |
| variant | 자유 (cva 권장) | 자유 | 자유 (5+ 변형 표준) | 자유 | N/A | 자유 | **금지** |
| className | 자유 (Tailwind) | 자유 | 자유 | utility 중심 | N/A | 자유 (Shadow DOM) | **금지** |
| data-driven | 없음 (children) | 없음 (children) | 없음 (children) | N/A | N/A | 없음 | **있음** |
| canonical lint | 없음 | 없음 | 부분 (Figma 가이드) | 없음 | 없음 | 없음 | **있음** |

표 값은 "기본 사용법"을 기준으로 한 것이다. 어떤 시스템이든 사용자가 더 엄격한 룰을 얹을 수 있다 — 즉 ds의 우위는 "다른 시스템이 못 하는 것"이 아니라 "기본값으로 닫혀 있다"는 점이다.

## 챕터

- [3.1 vs shadcn/ui](./01-vs-shadcn.md) — 같은 출발점, 반대 도착점
- [3.2 vs Radix](./02-vs-radix.md) — 그 위에 한 층을 더 얹는 이유
- [3.3 vs Material 3 · Polaris · Carbon](./03-vs-big-systems.md) — 직교 axis (사람 자유도 vs LLM 결정성)
- [3.4 vs Tailwind + shadcn](./04-vs-tailwind-shadcn.md) — LLM 결정성 가설 (측정 부재 인정)
- [3.5 vs Storybook · Figma Token](./05-vs-storybook-figma.md) — 직교 도구
- [3.6 vs Web Components · Lit · Stencil](./06-vs-web-components.md) — 표준 진영과의 거리
- [3.7 Code Ownership Model](./07-code-ownership-model.md) — shadcn-style 코드 소유와 ds의 정본 모델

## 한 줄 요약

ds는 다른 시스템이 **사용자에게 열어둔 결정**을 의도적으로 닫는다. 그 닫음의 대가는 디자이너 자유도와 시각 다양성이다. 그 대가가 합당한 팀 — LLM 코드생성을 1차 사용자로 두는 팀 — 에만 ds가 맞는다.

# Why · No Variant

MUI·Chakra·Ant·shadcn — 거의 모든 디자인 시스템이 `variant="primary|secondary|ghost"`, `size="sm|md|lg"`, `color="success|danger"` 같은 enum prop을 가진다. 사람에게는 직관적이다. ds는 이 패턴을 정본에서 추방한다. "1 role = 1 component, variant 금지"가 ds 원칙 P1이다.

## 1. variant는 LLM에게 N×M×K 결정 분기다

`<Button variant size color>`이 각 prop에 5개 옵션을 가지면 LLM은 매 호출마다 5×5×5 = 125개 조합 중 하나를 골라야 한다. 학습 분포에 어떤 조합이 자주 등장했는지에 따라 선택이 흔들린다. 같은 의도("위험한 작업의 confirm 버튼")에 대해 회마다 다른 조합이 나온다.

ds는 이 결정 자체를 컴포넌트 분리로 해소한다.

```tsx
// variant 분기
<Button variant="danger" size="lg">Delete</Button>

// role 분리 (정본)
<DangerAction>Delete</DangerAction>
```

`DangerAction`은 size·color·icon이 **이미 정해져 있다**. LLM이 고를 게 없다.

## 2. variant는 "변하는 것"과 "변하지 않는 것"을 섞는다

`<Button variant="primary" />`와 `<Button variant="secondary" />`는 다음을 동시에 표현한다.

- **시각**: 색·강조·border
- **의미**: 주요 액션 vs 보조 액션
- **위치**: form footer의 오른쪽 vs 왼쪽

variant는 이 셋을 묶어서 1개 enum으로 압축한다. 압축 결과는 **소비자가 매 호출마다 다시 풀어야 하는** 묶음이다. 어떤 호출에서는 색만 바꾸고 싶고, 어떤 호출에서는 의미만 바꾸고 싶다 — 그러면 또 prop을 추가하게 된다 (`color`, `emphasis`, `placement`...). 폭증의 시작이다.

## 3. de facto 표준은 이미 분리된 컴포넌트다

ARIA·HTML 표준 어휘를 보면 답이 이미 있다.

| 의도 | HTML/ARIA |
|------|-----------|
| 폼 제출 | `<button type="submit">` |
| 폼 리셋 | `<button type="reset">` |
| 위험 액션 | (표준 없음 → ds가 정의: `DangerAction`) |
| 페이지 이동 | `<a href>` (button이 아님) |
| 메뉴 열기 | `role="button" aria-haspopup="menu"` |
| 토글 | `role="switch"` 또는 `aria-pressed` |

각 의도가 이미 다른 element/role을 가지고 있다. ds는 이를 **컴포넌트 1:1 대응**으로 받아 정본화한다. variant 통합 단일 Button 대신 의미별 컴포넌트가 나온다.

## 4. 시각 차이만 필요한 경우

같은 의미·다른 시각이 필요하면 그것은 **surface 소유자의 책임**이다. ds는 색을 두 단계로 본다.

- **surface**: 자기 색을 가지는 요소 (Card·Toolbar·Dialog) — pair primitive로 색 1쌍 부여
- **item**: surface 위에 얹히는 요소 (Button·Icon·Text) — `mute()` / `emphasize()`로 weight·opacity만 조절

따라서 "강조된 버튼"은 button 자체의 variant가 아니라, 그 button이 놓인 **surface의 emphasis 결정**이다. 결정 위치가 옮겨지면 결정 빈도가 줄어든다.

## 5. variant 금지의 부산물 — 이름이 어휘가 된다

variant 없는 세계에서는 컴포넌트 이름이 곧 의미다.

```
Button          — 일반 액션
SubmitAction    — 폼 제출
DangerAction    — 위험 액션
LinkAction      — 라우팅
IconButton      — 아이콘만 (label 필수)
SegmentedButton — 그룹 내 단일 선택
```

이름 목록 자체가 디자인 시스템의 어휘 사전이 된다. variant enum을 외울 필요 없이, 컴포넌트 이름을 외우면 된다 — 그리고 LLM은 컴포넌트 이름을 학습 분포에서 더 안정적으로 호출한다.

## 6. variant를 허용했을 때의 미끄러짐

variant 1개를 허용하면 다음이 차례로 따라온다.

1. `variant`만 있다 → "size도 필요한데?" → `size` 추가
2. `size`가 있다 → "compact size에서는 icon-only로 보이고 싶은데?" → `iconOnly` 추가
3. `iconOnly`가 있다 → "그래도 sr-only label은 필요한데?" → `label` 필수화 룰 추가
4. ... 반복 → API 폭증 → 사용처 비결정성 → 일관성 붕괴

ds는 이 미끄러짐의 1단계를 막기 위해 variant를 정본 외부로 추방한다.

## 반례 Q&A

### Q1. size는?

대부분의 size는 surface 위계에 흡수된다. `atom < section < surface < shell` 5단 hierarchy 토큰이 size를 결정한다. 컴포넌트가 자기 size prop을 가지지 않는다.

### Q2. responsive는?

CSS only. JS variant 분기 금지 (`<Button variant={isMobile ? 'compact' : 'full'}>` 금지). 컴포넌트는 viewport 무관하게 1개 형태고, CSS가 reflow·축소를 담당한다.

### Q3. theme(dark/light)은?

variant가 아닌 color token tier로 흡수. semantic token이 자동으로 mode를 따라간다. 컴포넌트는 mode를 모른다.

### Q4. 같은 button인데 32곳에서 다른 padding이 필요하면?

32곳이 다른 padding이라면 32곳의 surface가 다른 hierarchy level이라는 뜻이다. button이 아닌 surface를 정정한다. 그래도 안 풀리면 surface를 새로 만든다.

## 더 깊이

- [Canonical · Charter C6](../09-canonical/01-charter.md) — "정본 ≠ 이상형"
- [FAQ · 컴포넌트 폭증 우려](../11-faq/03-trade-offs.md)
- [Comparison · vs Material 3·Polaris·Carbon](../03-comparison/03-vs-material.md)

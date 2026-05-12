# Why · De Facto Standard

ds 정본 갱신 룰의 한 줄: **"Radix·Base·Ariakit·RAC 최소 2곳 수렴 시 채택."** 새 컴포넌트 이름·prop 시그니처·조립 패턴을 결정할 때 ds는 발명하지 않고 **이미 합의된 형태**를 가져온다. 이는 게으름이 아니라 LLM 결정성을 위한 의도적 제약이다.

## 1. LLM의 학습 분포는 이미 편향돼 있다

대규모 언어 모델은 GitHub·Stack Overflow·문서를 학습한다. 그 안에서 빈도가 높은 패턴이 **모델의 기본 출력 분포**가 된다.

- `Trigger`, `Content`, `GroupLabel`, `TabPanel` 같은 이름은 Radix·Ariakit·RAC가 공유하는 어휘다 — 학습 분포에서 빈도 ↑
- `<MyMenuActivator>`, `<MenuShownContent>` 같은 자체 발명 이름은 빈도 0 — 매번 LLM이 변형해서 생성

ds가 자체 어휘를 발명할수록 LLM은 그 어휘를 안정적으로 호출하지 못한다. 반대로 학습 분포에 이미 존재하는 어휘를 채택하면 LLM은 별도 학습 없이 정본을 재현할 수 있다.

## 2. "2곳 수렴" 룰의 의미

왜 1곳도, 3곳도, "잘 알려진 패턴"도 아닌 **2곳**인가?

- **1곳만**: 한 라이브러리의 idiosyncratic 결정일 수 있다. 그 팀의 취향이 표준이 되면 안 된다
- **2곳 이상**: 서로 다른 팀이 독립적으로 같은 결정에 수렴했다는 증거. 그 형태에 압력이 있다는 뜻
- **3곳 강제**: 너무 보수적. 새 합의가 형성되는 동안에는 2곳이 마지막 신호일 수 있다

2곳 수렴은 "개인 취향과 진짜 합의를 가르는 최소 임계"다.

## 3. 4개 후보 라이브러리

ds가 참조하는 4곳:

| 라이브러리 | 특징 |
|------------|------|
| **Radix** | unstyled headless primitive. ARIA·키보드 모델 사실상 표준 |
| **Base UI (MUI Base)** | Material 진영의 unstyled 버전. Radix와 다른 계보지만 수렴 |
| **Ariakit** | composable primitive. focus·roving 모델이 정교 |
| **React Aria (RAC)** | Adobe의 접근성-우선 모델. AAA 레벨 대안 |

각각 출신·철학이 다르다. 그럼에도 같은 어휘로 수렴하는 부분은 "디자인 시스템의 자연 평형"이라 볼 수 있다. ds는 그 평형점을 채택한다.

## 4. 어휘 예시 — 수렴이 일어난 이름들

| 의도 | Radix | Ariakit | RAC | ds 채택 |
|------|-------|---------|-----|---------|
| 메뉴 트리거 | `Trigger` | `MenuButton` | `MenuTrigger` | **Trigger** |
| 그룹 헤더 | `GroupLabel` | `MenuGroupLabel` | `Header` | **GroupLabel** |
| 서브메뉴 | `Sub`, `SubTrigger`, `SubContent` | `Menu` 재귀 | `SubmenuTrigger` | **Submenu*** |
| 탭 패널 | `Content` | `TabPanel` | `TabPanel` | **TabPanel** |

수렴이 명확하면 그대로, 갈리면 ds가 결정하되 발명하지 않고 후보 중 가장 의미 분리가 좋은 것을 고른다.

## 5. de facto가 없는 영역은?

새로운 패턴 (예: ds 고유의 `defineFlow`, `useResource`)은 어떻게 정하나?

- **표준 어휘에 매핑되는 부분**은 그것을 사용 (`dispatch`, `event`, `onEvent` 등)
- **새 개념의 이름**은 의미가 가장 분리되는 단어를 고른다 (`flow`는 wiring, `resource`는 data source)
- **새 이름이 정본이 되면** 사용처에서 일관되게 쓰이는지 감사하고, 흔들리면 더 표준적인 이름으로 갈아탄다

발명을 두려워하지는 않지만, **표준이 이미 있는데 발명하지 않는다**.

## 6. 표준과 ds 원칙의 관계

de facto 표준이 ds 원칙과 충돌하는 경우는? — 거의 없다. 왜냐하면 ds 원칙은 표준의 부분집합이기 때문이다.

- ARIA는 표준이고 ds도 ARIA를 채택한다
- Radix는 unstyled headless고 ds도 의미와 시각을 분리한다
- RAC는 keyboard·focus를 컴포넌트 내부화하고 ds도 roving self-attach한다

충돌은 표준이 variant를 허용하는 부분(MUI 등)이지만, 그곳은 표준이 아니라 그 라이브러리의 독자적 결정이다. ds는 "표준 + 더 엄격" 관계지 "표준 거부"가 아니다.

## 7. 학습 분포 활용의 윤리

이 전략은 본질적으로 "LLM이 알기 쉬운 형태로 적응한다"이다. 사람만을 위한 디자인 시스템이라면 자체 어휘 발명도 정당하다. 하지만 ds의 why가 **LLM·사람·도구가 같은 표현으로 수렴**이라면, 학습 분포는 도구다 — 활용한다.

이를 뒤집어 말하면, 만약 LLM의 학습 분포가 바뀌면 ds도 따라간다. 정본은 영원하지 않고, **"동일 의도 → 동일 출력 분포"라는 결과**를 영원히 추적한다.

## 더 깊이

- [Canonical · Update procedure](../09-canonical/04-update-procedure.md) — 2곳 수렴 검사 절차
- [FAQ · Radix를 그대로 쓰면 안 되나](../11-faq/04-comparison-nuance.md)
- [Comparison · vs Radix](../03-comparison/02-vs-radix.md)

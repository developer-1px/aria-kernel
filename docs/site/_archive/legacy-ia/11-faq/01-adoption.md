# FAQ · 도입과 학습

## Q: ds 학습 곡선이 가파른 거 아닌가? 신입 온보딩은?

가파르다, 솔직히. 특히 Tailwind·MUI 출신이 처음 ds를 만나면 세 지점에서 멈춘다. 첫째 className을 못 쓴다 — "그러면 스타일을 어디에"가 첫 질문. 답은 ds/parts·ui가 이미 다 입혀져 있고, 화면별 시각은 widget의 root 1곳 className으로 들어간다는 것. 둘째 children을 못 쓴다 — `<Button>저장</Button>`이 안 되고 `<Button data={{ label: '저장' }} />`이 정본. 셋째 `definePage` entities tree — JSX 직접 조립 대신 데이터 트리로 페이지를 선언한다.

다만 학습 곡선이 가파르다고 해서 길지는 않다. 정본 매뉴얼 본체가 100줄 남짓이다. 신입이 첫날 그걸 읽고, 둘째 날부터 ds/ui에 있는 컴포넌트 목록을 보면서 자기 화면을 조립한다. ARIA를 미리 알고 있으면 이미 절반 안 셈이다.

진짜 비결은 ds가 LLM 친화적이라 신입도 LLM을 동료로 쓰면 된다는 것이다. Cursor·Claude Code가 ds 어휘 안에서 작업하면 결정적이라서, 신입이 "이거 어떻게 짜요"를 LLM에 묻는 게 사람 시니어보다 빠른 경우가 많다. 정본이 LLM에 학습 친화적인 만큼 신입에게도 친화적이다. 가파른 부분이 진짜 비싼 것은 *Tailwind 습관 unlearn* 비용이다 — "잠깐만 div에 class 박으면 되는데"를 참는 데 1~2주, 그 후로는 평탄.

비교 대상이 중요하다. MUI도 Polaris도 첫 1주는 자기네 어휘 학습이고, 그 어휘가 ds보다 *더* 임의적이다(variant·sx·slotProps). 표준 ARIA 기반인 ds 학습은 다른 곳으로 옮겨도 재사용된다. 신입 첫 PR까지 평균 며칠인지 같은 측정값은 현재 측정된 데이터는 없다.

**관련**: [정본 헌장](../09-canonical/01-charter.md), [Devices 트리](../09-canonical/03-devices.md).

## Q: Tailwind / MUI 코드베이스에서 ds로 마이그레이션하려면?

마이그레이션은 한 번에 일어나지 않는다. ds의 정본 갱신 절차 자체가 임시·유산 슬롯을 두는 것은 이런 점진 이행을 흡수하기 위해서다. 기존 Tailwind 클래스나 MUI variant가 들어 있는 코드는 *유산*으로 표시되고, 새 화면부터 정본을 따른다. 발견 시 정본으로 끌어당기는 것은 [일탈 감사](../09-canonical/05-update-procedure.md) 사이클로 돈다.

가장 빠른 진입점은 한 라우트를 골라 (a) widget root에 카탈로그 className 1개만 남기고, (b) 내부를 ds/ui와 ds/parts 어휘로 갈아끼우고, (c) 페이지 조립을 `definePage`로 옮기는 것이다. 이 사이클을 한 번 돌면 팀이 "어휘가 닫혀 있다"는 감각을 얻는다. 그 감각이 들면 다음 라우트는 빠르다.

**관련**: [도입과 학습](#q-ds-학습-곡선이-가파른-거-아닌가-신입-온보딩은), [정본 갱신 절차](../09-canonical/05-update-procedure.md).

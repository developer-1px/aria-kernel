# FAQ · 커스터마이징

## Q: dark mode·국제화·고대비 같은 cross-cutting concerns는?

세 가지가 같은 답이 아니다. 각각 다른 layer에서 흡수된다.

**dark mode**는 foundations semantic token으로 흡수된다. palette(raw gray N)는 그대로 두고 semantic(text/surface/border)이 `[data-theme="dark"]` 셀렉터로 다시 매핑된다. 컴포넌트는 mode를 모른다 — variant prop이 아니라 **컴포넌트는 1개 형태, CSS 토큰만 다르다**. 이건 실제로 동작한다. `foundations/color/semantic.ts`가 단일 진입점이고 컴포넌트는 `var(--text)` 같은 이름만 본다.

**고대비**는 같은 메커니즘이다. semantic token tier에 highContrast 변형을 추가하고 `prefers-contrast: more` 미디어 쿼리로 자동 swap. 모바일 분기 정본(CSS only)과 같은 길이다.

**i18n**은 좀 다르다. 콘텐츠 레이어의 문제이지 시각 토큰 문제가 아니다. 텍스트는 entity의 data로 들어가고, entity 안의 라벨이 i18n key를 가지고, route boundary에서 resolve된다. RTL은 CSS logical property(`margin-inline-start` 등)로 흡수, JS 분기 없음. 다만 ds 코드베이스 안에서 i18n을 본격적으로 돌려본 라우트는 거의 없어서 "원칙상 이렇다"이지 검증된 패턴은 아니다.

세 cross-cutting 모두 **"컴포넌트가 모르는 곳"**에서 처리된다는 게 공통점이다. 이게 직렬화·선언성 필터의 결과다. 컴포넌트가 mode·locale·contrast를 prop으로 받기 시작하면 variant 폭증이 시작된다.

**관련**: [정본 선언 - 토큰](../09-canonical/02-declarations.md), [정본 선언 - 반응형](../09-canonical/02-declarations.md).

## Q: 직렬화 가능 → 함수 prop 추방. 진짜로 함수가 필요한 곳(custom render)은 어떻게 우회하나?

핵심 통찰은 이것이다. `renderItem={(item) => <Custom>{item.x}</Custom>}` 같은 함수 prop의 99%는 *분기 데이터*를 위장한 것이다. 직렬화 가능한 형태로 풀면 거의 항상 데이터 룩업으로 환원된다.

실제 패턴 셋으로 정리됐다. 첫째 **discriminated kind** — 셀이 text·badge·avatar·timestamp 중 어느 종류인지를 데이터에 박는다. ui/Table은 `kind`로 룩업해서 ds/parts의 부품을 고른다. 함수 0개. 둘째 **신뢰된 HTML payload entity** — 마크다운·코드 하이라이트처럼 외부 라이브러리가 HTML 문자열을 만들어내는 건 `Prose`·`CodeBlock` entity 안에서만 `dangerouslySetInnerHTML`을 쓴다. 콜사이트는 데이터(string)만 넘긴다 — 함수가 아니라 string. 셋째 **진짜 한 화면에서만 쓰이는 표시 형태** — entity로 승격한다. 사용처 1곳도 entity 승격이 정본이다. content widget 1개 만들어서 root 1곳에 className 붙이고, 콜사이트는 그 widget을 데이터로 가리킨다.

남는 1%는 어쩌나. 인터랙티브 캔버스, 실시간 차트의 path 함수 같은 것. 이건 ds/core 또는 명령형 경계로 떨어뜨려서 widget·route는 선언적으로 data만 넘기게 한다. 헌장 C4 "명령형은 경계로"가 이 자리에 있다.

**관련**: [헌장 C2·C4](../09-canonical/01-charter.md), [Q57 dispatch 직렬화](./06-mechanism-questions.md).

## Q: classless가 CSS-in-JS·Tailwind 생태계와 단절시키지 않나?

오해 둘이 있다. 첫째 ds가 className 자체를 금지한다고 착각하기 쉬운데, 실제 정본은 "**스타일 전용** className 금지"다. content widget root 1곳에 카탈로그용 className은 허용된다. 셀렉터 namespace는 `tag + role + aria + data-part`로 잡는다. 둘째 classless = "CSS 안 씀"이 아니다. ds는 vanilla-extract / 일반 CSS / styled-components 어느 것이든 쓸 수 있다. 다만 셀렉터를 `[role="tab"][aria-selected="true"]` 같은 ARIA로 쓴다. CSS 자체와 단절이 아니라 *className을 시각 변형 carrier로 쓰는 관행*과 단절이다.

생태계 비용은 솔직히 있다. Tailwind 클래스 자동완성·Shadcn 카탈로그·도구체인 — 이걸 못 쓴다. 대신 얻은 것: 의미가 마크업에 박혀서 LLM이 코드 읽을 때 ARIA 트리만 봐도 의도가 보이고, DOM이 평탄해진다(스타일 wrapper 없음). 다크모드·고대비·hover·focus 분기가 ARIA·data-* 셀렉터로 자연스럽게 풀린다.

학습 자료 빈약 — 사실이지만 ds의 어휘가 ARIA 그 자체라서 MDN·W3C·Radix 문서가 그대로 학습 자료다. Tailwind 학습 자료보다 양은 적지만 표준 기반이라 수명이 길다. Tailwind 사용 팀이 ds로 전환할 때의 학습 비용은 현재 측정된 데이터는 없다.

**관련**: [헌장 C5](../09-canonical/01-charter.md), [Q55 data-part vs className](./06-mechanism-questions.md).

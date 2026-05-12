# FAQ · 메커니즘 질문

## Q: 캘린더·차트·코드 에디터 같은 도메인 화면은 정본이 어디까지 커버하나?

ds는 **표현 어휘**까지는 정본이고, **도메인 알고리즘**은 정본 외부다. 경계가 실제로 코드에 보인다.

`ui/0-primitive/CodeBlock.tsx`가 정본이다. shiki/prism 같은 외부 라이브러리가 HTML 문자열을 만들어내는 부분은 entity 안에서만 `dangerouslySetInnerHTML` 허용("신뢰된 HTML payload entity"). 도메인 알고리즘(syntax highlight)은 외부, 표현(`<pre><code>`)은 정본이다. 차트는 `ui/7-pattern/BarChart.tsx`가 있는데 SVG primitive 조립으로 끝나는 단순 케이스만 ds 안에 있다. 진짜 차트 라이브러리(d3·visx) 수준은 ds 안에 들어오지 않는다 — 도메인 패키지로 분리될 자리. 캘린더·코드 에디터는 아직 정본화되지 않았다. 들어온다면 `@p/domain-calendar`·`@p/domain-editor` 형태로 별도 패키지가 될 것이다.

경계 원칙은 단순하다. ds 내부 ui/는 ARIA pattern 어휘만. ARIA에 grid·tree·listbox·textbox는 있지만 "캘린더"·"코드 에디터"·"간트차트"는 없다 → ds 어휘 아님 → 도메인 패키지. 다만 도메인 패키지도 ds 정본을 따른다. 인터페이스는 `ControlProps(data, onEvent)`, 직렬화 가능 state, gesture/intent 분리, ARIA pattern 위에 얹기(예: 캘린더 = `role="grid"` + datetime semantics).

즉 ds는 **만드는 길**(인터페이스 4종 + 직렬화 필터)을 정본화하고, **만든 결과물**은 도메인이 가진다. 모호한 케이스(파일 트리·드래그 가능한 칸반)에서 어디로 가는지 룰이 약하다는 점은 알고 있는 한계다.

**관련**: [정본 선언 - 콘텐츠/패키지 구조](../09-canonical/02-declarations.md).

## Q: data-part가 결국 className의 다른 이름 아닌가?

본질 차이는 두 가지다. **누가 부여하는가**, **무엇을 가리키는가**.

`className`은 호출자가 자유롭게 붙인다 — `<article className="card hero featured-2 mb-4">`. 같은 카드에 사용처마다 다른 이름이 붙고, 스타일·레이아웃·상태·variant가 한 문자열에 섞인다. `data-part`는 컴포넌트 root가 박아 넣는다 — 호출자가 못 넣는다. `data-part="card"`는 **DS 부품 카탈로그의 ID**다. 1 component = 1 data-part. 호출자가 늘릴 수 없으니 셀렉터 어휘 폭발이 구조적으로 막힌다.

상태/variant는 어차피 ARIA로 표현된다. `aria-current`·`aria-selected`·`aria-expanded`가 상태 슬롯이고 `data-part`는 부품 슬롯이다. 둘이 직교한다. `packages/ds/src/parts/Card.tsx`에서 root가 `data-part="card"`를 직접 박는다. 호출자에게 className prop을 받지 않는다.

즉 className은 "스타일을 거는 임의 hook"이고 data-part는 "부품 카탈로그의 정본 namespace"다. 표면상 attribute 1개의 이름 차이지만 **누가 통제권을 갖는가**가 반대다. 추가로 `data-ds`(layout primitive 전용)와 `data-part`(content 부품 전용)로 namespace를 둘로 쪼갠 점도 의미 분리에 기여한다.

**관련**: [헌장 C5](../09-canonical/01-charter.md), [Q30 CSS 생태계](./02-customization.md).

## Q: useResource dispatch는 함수 = 직렬화 불가, C2 위반 아닌가?

C2는 **상태(state)** 의 직렬화를 말하는 것이지 **이벤트 채널**의 직렬화가 아니다. 두 층을 구분해야 한다.

상태 층 — `value`. JSON 가능해야 한다. store에 저장되는 값으로 직렬화 round-trip 대상이다. 이벤트 층 — `dispatch(e)`의 `e: ResourceEvent<T>`. `{ type: 'set', value }`, `{ type: 'patch', partial }`, `{ type: 'refetch' }`, `{ type: 'invalidate' }` — 모두 데이터 객체다. 이게 직렬화 가능해야 한다. **dispatch 함수 자체는 채널이지 상태가 아니다**.

같은 구분이 React redux/elm/Flux 전통에 있다. `store.dispatch`는 함수지만 `action`은 plain object다. 직렬화·diff·재생(replay)·time-travel은 action에 대해 일어난다. ds도 정확히 그 모델이다. `defineFlow + useFlow`는 "resource.onEvent가 intent 라우터 흡수"라고 명시한다. `e`는 `UiEvent`(plain object)이고 router는 `(e, ctx) => nextValue` 순수 함수에 가깝게 정의된다. 함수 prop은 흐르지만, 흐르는 것은 그 함수가 호출될 때 전달될 직렬화 가능한 event다.

따라서 C2 위반이 아니다. 위반은 `useState({ ref: domNode })` 같은 케이스다 — 값에 함수·DOM이 박힌 경우. dispatch는 useState 값이 아니다. C2 문구를 "**state 값**은 직렬화 가능"으로 명시화하면 오해를 줄일 여지가 있다.

**관련**: [헌장 C2](../09-canonical/01-charter.md), [정본 선언 - 데이터 흐름](../09-canonical/02-declarations.md).

## Q: definePage entity tree = JSX의 이름만 바꾼 것 아닌가?

표면 구조는 같지만 **무엇이 데이터로 환원되는가**가 다르다.

JSX는 `ReactElement`를 만든다. 노드에는 함수 reference(컴포넌트 type), closures(prop으로 캡처된 onClick), children fragment가 박힌다 — JSON.stringify 시 깨진다. `definePage`는 `NormalizedData`를 반환한다. 그냥 객체다. round-trip 가능하다.

이게 가능한 이유는 entity의 `kind` 필드가 **registry lookup key**이기 때문이다. JSX에서 `<Sidebar/>`는 `Sidebar` 컴포넌트 함수 reference를 박지만, `definePage` 안의 `{ id: 'sidebar', kind: 'Sidebar' }`는 문자열 key 하나만 박는다. Renderer가 `kind` → 컴포넌트를 registry에서 찾는다.

세 가지가 따라온다. 첫째 **저장 가능** — URL·DB·파일에 그대로 직렬화. JSX는 불가. 둘째 **검증 가능** — `validatePage`가 orphan/cycle/unknown kind를 dev에 경고. JSX는 런타임 마운트 후에나 안다. 셋째 **변환 가능** — entity tree에 map/filter/replace를 데이터 변환으로 적용 가능. JSX는 React.cloneElement 같은 우회로 필요.

즉 "이름만 다른 JSX"가 아니라, **JSX의 함수-reference 슬롯을 문자열 kind로 치환해 직렬화 차원을 한 단계 내린 표현**이다. 정본 원칙(선언적 + 직렬화 가능)을 통과하려면 JSX는 못 쓴다. JSX 임시(Row/Column/Grid)는 "이유 명기 시" 허용되는데, 그 게이트는 현재 PR review로만 지켜지고 있다 — lint로의 자동화는 미비.

**관련**: [헌장 C1·C2](../09-canonical/01-charter.md), [정본 선언 - 레이아웃](../09-canonical/02-declarations.md).

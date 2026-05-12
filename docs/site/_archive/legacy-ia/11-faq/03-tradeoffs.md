# FAQ · 트레이드오프

## Q: variant 0개 · 1 role = 1 component이면 컴포넌트 수가 폭발하지 않나?

폭발하지 않는다. 막상 ds를 쓰면서 실제로 ui/ 폴더에 쌓인 role 수는 **수십 개 단위**에서 자연 수렴한다. variant N개를 가진 1 컴포넌트가 N개 컴포넌트로 풀리는 게 아니라, **ARIA role 어휘 자체가 유한**하기 때문이다. ds/ui/ 폴더는 ARIA pattern + de facto 수렴(Radix·Ariakit·RAC) 교집합으로만 채워진다.

실제 분포를 보면 `0-primitive/`는 3개 안팎, `1-indicator` ~ `7-pattern`은 카테고리당 5~15개, `8-layout/`은 한 줌이다. variant로 풀어 적으면 "Button × 5 variant × 3 size × 2 emphasis = 30가지 출력"이 되지만, ds에서는 그 30가지가 컴포넌트 30개가 아니다. 시각 차이는 surface 위계(`atom < section < surface < shell`)로, 강조는 `mute()`/`emphasize()`로 흡수된다. 결국 컴포넌트는 "ARIA role의 수"에 가깝게 수렴한다 — Button, SubmitAction, DangerAction, IconButton, MenuItemRadio처럼 의미가 진짜 다른 경우만 이름을 가진다.

content 부품은 다른 축이다. parts/ 폴더에는 Avatar·Badge·Card·Tag 등 18개가 있는데, 이것은 "비즈니스 콘텐츠 어휘"이지 role이 아니다. role과 part는 직교한다. 폭발은 doubt 스킬을 통과 못한 합성 컴포넌트에서만 생긴다. "사용처 1곳도 entity 승격" 원칙이 한쪽으로 압력을 주지만 동시에 doubt(존재·적합·분량·효율) 필터가 반대 압력을 준다. 이 둘의 균형이 실제 폭발을 막는다.

**관련**: [Devices ① 정본 어휘](../09-canonical/03-devices.md), [정본 선언 - 네이밍](../09-canonical/02-declarations.md).

## Q: variant 금지로 이름이 폭증하면 LLM이 이름을 잘못 부르지 않나?

실제로 ds/ui를 까보면 폴더가 `0-primitive ~ 8-layout`까지 9층, 그 안의 컴포넌트는 ARIA role 이름을 그대로 가져가서 종류가 그렇게 많지 않다. role 자체가 W3C에서 닫힌 집합이기 때문이다 — `button·link·tab·tabpanel·menuitem·option·row·gridcell·treeitem·dialog·alertdialog·…` 정도에서 끝난다. variant를 풀었을 때 생기는 `PrimaryButton·DangerButton·GhostButton·IconButton·LoadingButton…`의 조합 폭발과는 차원이 다르다.

ds/parts/도 마찬가지다. `Avatar·Badge·Breadcrumb·Callout·Card·Code·EmptyState·Heading·KeyValue·Link·Phone·Progress·Skeleton·Table·Tag·Thumbnail·Timestamp` 17개. `ContractCardLarge·ContractCardCompact·ContractCardWithAvatar`처럼 변형을 펼쳤으면 50개도 우습게 넘었을 것이다.

LLM이 이름을 잘못 부르는 건 "이름이 많아서"가 아니라 **"같은 의미의 이름이 여러 개라서"**다. `Btn·Button·CTAButton·ActionButton`이 공존할 때 LLM은 분포에서 가장 흔한 걸 던진다. ds는 ARIA 1곳으로 수렴시켜서 이 분기를 제거한다 — `<button>` 태그가 곧 button role이고, role과 컴포넌트 이름이 같다.

오히려 variant 허용 시스템이 이름을 더 못 부른다. `<Button variant="destructive">`인지 `variant="danger"`인지 `intent="danger"`인지 `color="red"`인지 — 라이브러리마다 다르고 LLM은 매번 헷갈린다. ds의 prop 이름 정본이 "ARIA 그대로, 인위적 통일 금지"인 이유가 여기 있다.

**관련**: [정본 선언 - 네이밍](../09-canonical/02-declarations.md), [Q15 component 폭증](#q-variant-0개--1-role--1-component이면-컴포넌트-수가-폭발하지-않나).

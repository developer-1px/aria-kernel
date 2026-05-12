# Why · Classless

ds는 셀렉터 어휘를 `tag + role + aria + data-part` 4개로 고정한다. 스타일 전용 className(`.btn-primary`, `.card-elevated`)은 정본에서 추방된다. 처음 보면 과격해 보이지만, "선택지를 줄여 LLM·사람·도구가 같은 표현으로 수렴시킨다"는 ds의 why에서 논리적으로 도출되는 결정이다.

## 1. className은 자유 변수다

`className="card-elevated"`라는 문자열은 다음 모든 자유도를 동시에 연다.

- **작명 자유**: `card-elevated` vs `elevated-card` vs `cardLevel2` — 동일 의도가 N가지 표현으로
- **위치 자유**: 같은 시각 효과가 카드·패널·다이얼로그에 모두 붙을 수 있다
- **결합 자유**: `className="card elevated bordered hover-lift"` — 조합 폭발
- **검증 불가**: 문자열은 타입 시스템 밖이다. 없는 클래스를 써도 컴파일러가 모른다

LLM에게 자유 변수는 비결정성의 원천이다. 같은 "강조된 카드"를 100번 생성하면 100가지 className 조합이 나온다.

## 2. 의미는 이미 ARIA에 있다

웹 표준은 이미 의미 어휘를 가지고 있다.

| 의도 | 표준 표현 |
|------|-----------|
| 이건 버튼이다 | `<button>` 또는 `role="button"` |
| 이건 선택됐다 | `aria-selected="true"` |
| 이건 비활성이다 | `aria-disabled="true"` / `disabled` |
| 이건 펼쳐졌다 | `aria-expanded="true"` |
| 이건 현재 페이지다 | `aria-current="page"` |

`className="selected"`는 이 위에 **중복된 두 번째 진실**을 만든다. 두 진실은 반드시 어긋나며 (aria만 바뀌고 className은 안 바뀌는 버그), 보조 기술은 className을 못 읽으므로 진짜 진실은 ARIA뿐이다. 그렇다면 className은 처음부터 없어야 한다.

## 3. 스타일은 의미를 따라간다

CSS 셀렉터는 다음으로 충분하다.

```css
[role="option"][aria-selected="true"] { ... }
[role="treeitem"][aria-expanded="true"] > [data-part="chevron"] { ... }
button[aria-disabled="true"] { ... }
```

이 형태가 갖는 속성:

- **단일 진실원**: 상태는 ARIA에만 존재. 스타일은 그것을 비추는 거울
- **자동 일관성**: `aria-selected`가 바뀌면 스타일이 따라온다 — 동기화 코드 0줄
- **무료 접근성**: 의미 표시가 곧 시각 표시

## 4. namespace는 어디에?

순수 ARIA만으로는 부족한 경우가 있다.

- 같은 role이 여러 시각 변형을 가질 때 (`Card` vs `CountBadge` vs `StatusBadge`) — 부품 식별
- 의미 없는 시각 보조 요소 (구분선·아이콘 슬롯) — DOM 위치 식별

이때 사용하는 namespace는 `data-part="<name>"` 단 1개로 고정된다.

```tsx
<article role="listitem">
  <span data-part="chevron" />
  <h3 data-part="title">...</h3>
  <span data-part="meta">...</span>
</article>
```

`data-part`의 속성:

- **컴포넌트 내부 부품 어휘**: 외부에서 임의로 추가하지 못함 (`ds/parts/`에 등록된 이름만)
- **셀렉터 최후 수단**: tag·role·aria로 풀리면 그것이 우선
- **`aria-roledescription`을 namespace로 쓰지 않는다** — 보조 기기에 사용자 라벨로 노출되어 ARIA 의미를 왜곡하기 때문

## 5. wrapper의 운명

className을 금지하면 종종 "그러면 wrapper div가 필요하지 않나?"라는 압력이 온다. 답은 두 가지다.

- **DOM 평탄화**: subgrid·`display: contents`로 시각적 wrapper를 DOM에서 제거
- **portal**: 의미상 다른 곳에 속하는 요소(메뉴·툴팁)는 portal로 보내 DOM 부모-자식 의미를 보존

wrapper를 만들고 className을 붙이는 길은 항상 닫혀있다.

## 6. 결과로서의 코드 형태

```tsx
// 금지
<div className="user-card user-card--featured">
  <span className="user-card__avatar">...</span>
  <h3 className="user-card__name">{name}</h3>
</div>

// 정본
<UserCard data={user} />
// 내부:
<article role="listitem" aria-current={featured ? 'true' : undefined}>
  <Avatar data-part="avatar" data={user.avatar} />
  <h3 data-part="name">{user.name}</h3>
</article>
```

LLM이 어느 쪽을 더 일관되게 생성할 수 있는가? 후자는 입력 1개·출력 1개의 함수다.

## 반례 Q&A

### Q1. 시각 전용 효과는? (그림자·hover·애니메이션)

시각 효과도 의미가 있다. "강조된 카드"는 `aria-current` 또는 `data-part="featured"`로 표현된다. 의미 없는 순수 장식이라면 component 정의 자체에 들어간다 (Card는 그림자가 있다 — variant가 아니라 fixed).

### Q2. 디자이너가 "여기만 좀 다르게" 하고 싶을 때는?

그건 새 role 또는 새 part다. variant prop을 추가하지 않고 `<FeaturedCard>` 또는 `<Card data-part="hero">`를 만든다. 1 role = 1 component 원칙에 따라.

### Q3. utility-first(Tailwind)는?

utility class도 className 자유 변수다. `class="flex gap-4 p-6 rounded-lg bg-white"` — 동일 카드를 N가지 utility 조합으로 표현 가능. ds는 이를 받아들이지 않는다. utility로 풀고 싶은 것은 layout primitive(`data-ds="Row|Column|Grid"`)와 foundation token으로 흡수된다.

## 더 깊이

- [Canonical · Charter C5](../09-canonical/01-charter.md) — "이름이 곧 셀렉터"
- [FAQ · Tailwind와 비교](../11-faq/04-comparison-nuance.md)
- [Comparison · vs Tailwind + shadcn](../03-comparison/04-vs-tailwind.md)

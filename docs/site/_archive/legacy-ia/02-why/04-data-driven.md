# Why · Data-Driven

React의 표준 작법은 children compound pattern이다. `<Menu><MenuItem>A</MenuItem><MenuItem>B</MenuItem></Menu>` — 자유롭고 유연하다. ds는 이 패턴을 **`ui/` role 컴포넌트에서 금지**한다. 모든 `ui/` 컴포넌트는 `(data, onEvent)` 단일 인터페이스를 받는다. 이는 ds 원칙 P3이다.

## 1. children JSX는 무한 분기 입력이다

```tsx
<Menu>
  {items.map(item => 
    item.type === 'separator'
      ? <Separator />
      : item.disabled
      ? <DisabledMenuItem>{item.label}</DisabledMenuItem>
      : <MenuItem onClick={...}>{item.label}</MenuItem>
  )}
</Menu>
```

이 코드의 입력 공간은 사실상 무한대다. 누가 어떤 컴포넌트를, 어떤 prop으로, 어떤 순서로, 몇 개 넣을지 컴포넌트는 알 수 없다. 결과:

- **검증 불가**: Menu가 자기 children에 잘못된 요소가 있는지 런타임 전엔 모른다
- **roving·focus 책임 분산**: keyboard navigation은 children 전체를 알아야 하는데 children은 자유 형태
- **LLM 비결정성**: 같은 메뉴를 100번 생성하면 100가지 children 조립이 나온다

## 2. data prop은 입력 공간을 닫는다

```tsx
<Menu
  data={[
    { id: 'open', label: 'Open' },
    { type: 'separator' },
    { id: 'delete', label: 'Delete', disabled: true },
  ]}
  onEvent={(e) => ...}
/>
```

입력은 1개 — `data` 배열. 형태는 `MenuItemData` 타입에 고정된다. 결과:

- **타입 검증**: TS가 잘못된 data 모양을 컴파일 타임에 잡는다
- **roving 내부화**: Menu가 자기 children을 알므로 keyboard navigation을 self-attach 할 수 있다
- **직렬화 가능**: `JSON.stringify(data)` 가능 — Charter C2 만족
- **LLM 결정성**: 같은 메뉴 = 같은 data 배열. 표현이 1개로 수렴

## 3. onEvent — 이벤트 면도 1개로

자유 children에서는 각 item이 자기 `onClick`을 가진다. data-driven에서는 컴포넌트 단위로 event 1개를 emit한다.

```tsx
onEvent={(e) => {
  // e: { type: 'activate', id: 'open' }
  //  | { type: 'navigate', direction: 'next' }
  //  | ...
}}
```

- **discriminated union**: event는 type 필드로 분기되는 데이터
- **gesture/intent 분리**: `ui/`는 `activate` 단발만 emit. navigate·expand 도출은 `ds/core/gesture` 헬퍼가 담당
- **resource 연결 단순화**: `defineFlow(menu.onEvent → resource.dispatch)` 한 줄로 wiring

## 4. compound pattern과의 차이 — 그리고 왜 ds는 후자인가

| 측면 | Compound (children) | Data-driven |
|------|---------------------|-------------|
| 입력 형태 | JSX 자유 조립 | 타입 고정 데이터 |
| 검증 | 런타임 (또는 X) | 컴파일 타임 |
| roving·focus | 소비자 책임 분산 | 컴포넌트 내부 self-attach |
| 직렬화 | 불가 (JSX는 React element) | 가능 (JSON) |
| LLM 결정성 | 낮음 (분포에서 무작위 조립) | 높음 (입력 1개) |
| 유연성 | 매우 높음 | 의도된 만큼만 |

"매우 높은 유연성"이 사람에게는 자유지만 LLM에게는 비결정성이다. ds는 유연성을 **의도된 슬롯**으로만 노출한다 (data 안의 optional 필드, `ds/parts` 슬롯).

## 5. 자유 콘텐츠가 진짜 필요한 곳은?

Dialog 본문·tooltip 내부·페이지 콘텐츠처럼 **그 컴포넌트가 콘텐츠에 의미를 가지지 않는 경우**가 있다. 이때는 두 분리가 적용된다.

- **content vs control 분리**: 비즈니스 콘텐츠는 entity로 승격 (사용처 1곳이어도)
- **content widget = DS 부품 조합**: route가 직접 JSX를 자유 조립하지 않고, 명명된 widget이 DS 어휘로만 조립

따라서 자유 콘텐츠도 결국 명명된 entity 안에 격리된다. `ui/` role 컴포넌트는 children을 받지 않는다 — 이 경계가 정본이다.

## 6. parts 슬롯은 예외인가?

`<Card><Card.Header>...</Card.Header></Card>` 같은 `ds/parts` 슬롯은 children처럼 보인다. 하지만 차이가 있다.

- **슬롯 이름이 고정**: `Card.Header`, `Card.Body`, `Card.Footer` — 임의 자식 금지
- **슬롯 = data-part**: `<div data-part="header">` 셀렉터 어휘로 환원됨
- **layout primitive로만 조립**: 슬롯 내부는 다시 `ds/ui` 또는 `ds/parts` 어휘로만 채움

슬롯은 "이름 붙은 자유"다. 이름이 정본 어휘에 등록돼 있으므로 LLM은 슬롯 목록을 enumerate 할 수 있다.

## 반례 Q&A

### Q1. 작은 케이스에 over-engineering 아닌가?

작은 케이스에도 data 형태가 1개로 고정되는 가치가 있다. "작아서 children으로 빨리 짜자"가 허용되면 그 패턴이 다른 곳으로 번진다. 정본 = 모든 크기의 케이스에 적용 가능한 형태.

### Q2. 동적·재귀 구조는?

재귀 데이터(tree)는 data가 자기 자신을 참조하는 형태로 표현된다. `TreeNode = { id, label, children?: TreeNode[] }`. JSX 재귀가 아니라 데이터 재귀.

### Q3. render prop은?

정본에서 추방. 슬롯이 필요하면 data 안의 entity 참조로 (예: `data.icon: IconRef`) 표현. 함수를 prop으로 넘기는 형태는 직렬화 불가.

### Q4. 성능은? (큰 data 배열)

virtualization은 별도 엔티티로 (List·Table·Card Grid 정본의 일부). data 형태 자체는 변하지 않는다.

## 결론 — UI = f(data)

ds의 모든 `ui/` 컴포넌트는 순수 함수다.

```
UI = f(data, dispatch)
```

- **f**: 컴포넌트 정의 (정본 1개)
- **data**: 입력 (직렬화 가능)
- **dispatch**: 출력 (이벤트 emit)

이 형태에서 LLM의 일은 "컴포넌트 이름 + data 형태"만 결정하는 것이다. 분기·조립·event wiring은 전부 ds 내부로 격리된다.

## 더 깊이

- [Canonical · Charter C1·C2](../09-canonical/01-charter.md) — "데이터가 곧 UI", "상태는 직렬화 가능"
- [FAQ · 컴포넌트 마이그레이션](../11-faq/01-adoption.md)
- [Declarative Serialization](./06-declarative-serialization.md) — 메타-원칙

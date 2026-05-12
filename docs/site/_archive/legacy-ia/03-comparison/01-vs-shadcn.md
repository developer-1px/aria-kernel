# 3.1 vs shadcn/ui — 같은 출발점, 반대 도착점

shadcn/ui와 ds는 **표면이 닮았다**. 둘 다 Radix·Ariakit 같은 de facto headless를 base로 본다. 둘 다 사용자 레포에 컴포넌트 코드가 들어간다(shadcn은 `components/ui/*`, ds는 monorepo `packages/ds`). 그래서 자주 같은 부류로 묶인다.

차이는 "복제 단위"가 아니라 **결정 단위**에 있다. shadcn은 Radix를 wrap한 소스를 떨어뜨린 뒤 그 다음 모든 결정 — variant·className·composition 형태 — 을 사용자에게 넘긴다. ds는 그 결정 자체를 정본으로 미리 닫아놓는다.

## 같은 메뉴를 작성한다면

**shadcn 스타일**:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm" className="ml-auto">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuItem onClick={() => doRename()}>
      Rename
      <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => doDelete()} className="text-destructive">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**ds 스타일**:

```tsx
<Menu
  data={[
    { id: 'rename', label: 'Rename', shortcut: '⌘R' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ]}
  onEvent={(e) => e.type === 'activate' && dispatch({ type: e.id })}
/>
```

같은 결과를 내는 두 작성법이지만 LLM이 자유롭게 휘는 표면적이 전혀 다르다. shadcn 쪽은 `variant`·`size`·`className`·`asChild`·children 구조 모두가 자유 변수다. ds 쪽은 `data` 한 곳으로 수렴한다.

## 구체적 차이 4가지

1. **variant**. shadcn은 `cva({ variants: { size, variant } })`가 표준 사용법이다. ds는 P1 "1 role = 1 component, variant 금지".
2. **className**. shadcn은 사용자가 Tailwind class로 자유롭게 변형한다. ds는 C5 "이름이 곧 셀렉터" — 스타일 전용 className 금지.
3. **children**. shadcn은 children에 자유 JSX를 조립한다. ds는 P3 "Data-driven rendering — `data, onEvent`".
4. **escape hatch**. shadcn은 `asChild`·`as`·`className`이 풍부하다. ds는 P4 "No escape hatches".

요약하면: shadcn은 "Radix를 사용자 코드로 owning"이고, owning 후 무엇을 하느냐는 자유다. ds는 "owning 후의 모든 변형을 정본 1개로 수렴"이다.

## 정직한 한계

"사용자 레포에 코드가 들어간다"는 모델은 두 시스템이 동형이다. 정본이 사용자 손에 의해 흔들릴 위험은 ds도 똑같이 안고 있다(예: `packages/ds`에 사용자가 cva를 새로 추가한다면). 이를 막는 메커니즘은 lint와 hook이며, 구조적으로 절대 막을 방법은 아직 없다.

또 shadcn 사용자가 실제로 variant·className을 얼마나 쓰는지의 분포는 아직 측정한 적 없다. 1인 프로젝트라면 ds처럼 빈약하게 쓸 수도 있다.

## 어떤 팀에 ds가 맞나

- LLM이 코드를 생산하는 비중이 큰 팀
- "디자이너가 한 번 만들면 끝"보다 "수십 명이 같은 패턴을 반복 생성"이 더 흔한 팀
- 정본 갱신 절차를 1인이라도 명문화해 운용할 의지가 있는 팀

## 어떤 팀에 shadcn이 맞나

- 디자이너·개발자가 컴포넌트 시각을 자유롭게 변주하고 싶은 팀
- Tailwind 어휘에 이미 깊이 투자한 팀
- 시각 결정의 자유도가 결정성보다 중요한 마케팅·브랜드 사이트
- 빠른 1회성 프로토타이핑이 주된 활동인 팀

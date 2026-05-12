# 3.2 vs Radix — 그 위에 한 층을 더 얹는 이유

Radix를 그대로 쓰면 안 되나? 왜 그 위에 또 한 층을 얹나?

Radix는 **headless primitive**다. ARIA·키보드·focus는 정확히 풀어주지만, "의미와 시각의 결합"·"데이터 인터페이스"·"조립 형태"는 풀지 않는다. 그 풀리지 않은 결정들이 LLM의 비결정성을 만든다. ds는 그 결정을 마저 닫는 추가 층이다.

## Radix가 풀지 않는 것

1. **시각**. Radix는 unstyled. 색·간격·shape를 사용자가 매번 결정한다. ds는 `packages/ds/src/foundations/` 토큰으로 결정 1개.
2. **인터페이스 형태**. Radix는 children-driven JSX다.
   ```tsx
   <Menu>
     <Menu.Trigger />
     <Menu.Content>
       <Menu.Item />
     </Menu.Content>
   </Menu>
   ```
   ds는 `data, onEvent` 단일 인터페이스. 트리 데이터를 LLM이 매번 다른 JSX로 조립할 자유를 차단한다.
3. **gesture/intent 분리**. Radix 컴포넌트는 onKeyDown 등이 노출돼 있어 소비자가 분기 코드를 끼워 넣을 여지가 있다. ds는 `ui/`가 activate만 emit하고 intent 도출은 `ds/core/gesture`로 격리한다.
4. **Resource·Flow**. Radix는 데이터 흐름에 의견이 없다. ds는 `useResource`·`defineFlow` 1개로 닫는다.
5. **레이아웃**. Radix는 컴포넌트 단위. 페이지 레이아웃은 사용자가 짠다. ds는 `definePage` entities tree를 정본으로 둔다.

## 같은 트리를 작성한다면

**Radix**:

```tsx
<Tree.Root value={selection} onValueChange={setSelection}>
  {nodes.map((n) => (
    <Tree.Item key={n.id} value={n.id}>
      <Tree.Header>{n.label}</Tree.Header>
      {n.children && (
        <Tree.Group>
          {n.children.map((c) => <Tree.Item key={c.id} value={c.id}>...</Tree.Item>)}
        </Tree.Group>
      )}
    </Tree.Item>
  ))}
</Tree.Root>
```

**ds**:

```tsx
<Tree data={nodes} value={selection} onEvent={dispatch} />
```

Radix는 "JSX 형태"를 LLM이 매번 결정해야 한다. ds는 트리 데이터 한 변수로 닫힌다. 둘 다 같은 ARIA·키보드·focus 동작이지만 — ds는 그 동작을 닫은 뒤 **인터페이스 형태까지** 닫는다.

## Radix를 거부하는 게 아니다

ds는 Radix·Ariakit 어휘를 그대로 채택한다. 컴포넌트 명명 규칙이 그것이다 — `Trigger`·`GroupLabel`·`Submenu*`·`TabPanel`을 별도 export하고, Radix·Base·Ariakit·RAC 최소 2곳에서 수렴된 이름만 쓴다(de facto standard 룰). ds의 답은 "Radix 거부"가 아니라 "표준 + 더 엄격"이다.

## 정직한 한계

- Radix 자체도 시간이 지나면서 더 많은 결정을 내릴 수 있다(예: themes 패키지). 그 경우 ds 추가 층의 부피는 줄지만 0이 되진 않을 것이다 — children JSX 인터페이스는 Radix가 절대 버리지 않을 가능성이 크다.
- "Ariakit이나 RAC가 아니라 그 위에 한 층"인 이유도 똑같이 답할 수 있다. 결정 닫힘의 정도 문제이지 라이브러리 선택 문제가 아니다.

## 어떤 팀에 ds가 맞나

- ARIA·키보드는 이미 Radix가 풀었다고 인정하면서, **그 위의 결정**(시각·인터페이스·데이터 흐름)도 닫고 싶은 팀
- 페이지 단위 정본(`definePage`)을 받아들일 수 있는 팀

## 어떤 팀에 Radix가 맞나

- 자체 디자인 시스템을 빌드 중이며 시각·인터페이스 결정의 자유가 핵심 가치인 팀
- 컴포넌트 children 조립을 LLM이 아닌 디자이너가 주도하는 팀
- Radix 위에 자체 한 층을 얹을 의지·여력이 있는 팀

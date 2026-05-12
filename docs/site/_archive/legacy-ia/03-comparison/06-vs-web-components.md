# 3.6 vs Web Components · Lit · Stencil — 표준 진영과의 거리

Web Components·Lit·Stencil은 W3C 표준 위에 선 컴포넌트 모델이다. 표준이라는 점에서 매력적이다. 그런데 ds는 적극적으로 채택하지 않는다. 이유는 학습 분포와 호환성에 있다.

## Web Components가 푸는 것

- **Custom Element**. 브라우저 네이티브 컴포넌트 등록.
- **Shadow DOM**. 스타일·DOM 격리.
- **HTML Templates**. 선언적 마크업.

배포·격리·재사용의 표준이다. ds는 "결정 수렴의 정본"이다 — layer가 다르며 정면 충돌하진 않는다.

## ds가 채택하지 않는 이유

1. **학습 분포 mismatch**. LLM이 가장 안정적으로 출력하는 컴포넌트 모델은 React JSX다. de facto 4개 라이브러리(Radix·Base·Ariakit·RAC)가 모두 React 기반이다. Web Components·Lit는 학습 분포에서 빈도가 낮다. ds의 "표준 채택" 룰이 가리키는 곳은 React·JSX 쪽이다.
2. **Shadow DOM이 정본 셀렉터를 차단**. ds의 C5는 "tag + role + aria + data-part"로 외부에서 셀렉트 가능하다는 전제다. Shadow DOM은 의도적으로 외부 셀렉터·스타일을 막아 audit·devtools 도구의 가시성을 떨어뜨린다.
3. **직렬화 가능성**. Web Components는 imperative API(`element.someProperty = ...`)가 흔하다. ds C2 "상태 직렬화 가능"과 마찰한다. Lit는 reactive property로 일부 해결하지만 React 진영의 데이터 인터페이스만큼 표준화돼 있지 않다.

## 같은 트리거를 작성한다면

**Lit**:

```ts
@customElement('ds-button')
class DsButton extends LitElement {
  static styles = css`button { /* ... */ }`;
  @property() label = '';
  render() {
    return html`<button @click=${() => this.dispatchEvent(new Event('activate'))}>
      ${this.label}
    </button>`;
  }
}
```

```html
<ds-button label="Save"></ds-button>
```

**ds (React)**:

```tsx
<Button data={{ id: 'save', label: 'Save' }} onEvent={dispatch} />
```

기능은 같지만 ds는 (a) 외부 CSS로 `button[role=...]`를 audit 가능하고, (b) `data`가 그대로 JSON 직렬화되며, (c) LLM이 더 흔히 본 형태다.

## 같은 정신을 공유하는 부분

- "표준에 수렴" 철학은 동일하다. Web Components는 W3C 표준이고 ds는 ARIA 표준을 채택한다.
- 결정을 닫는 방향성도 비슷하다. Custom Element는 한 번 등록하면 한 형태로 사용한다.

따라서 ds의 답은 거부가 아니라 **연기**다. "표준 진영을 거부하지 않지만, LLM 학습 분포가 React로 쏠려 있는 한 ds도 React 위에 머문다. 분포가 바뀌면 따라간다." 정본은 영원하지 않다.

## 정직한 한계

- Lit가 SSR·streaming에서 React보다 가벼운 점은 무시 못 한다. 성능이 결정성을 이기는 시점이 오면 재고할 수 있다.
- Web Components custom element + ARIA 채택이 보편화되면(Adobe `spectrum-web-components` 등) ds의 4개 후보 목록이 확장될 가능성이 있다. 현재는 확장 안 한다.

## 어떤 팀에 ds가 맞나

- React/JSX 자산이 이미 있고, LLM 학습 분포에 베팅하는 팀
- 외부에서 셀렉터·devtools·audit이 가능해야 하는 팀(Shadow DOM 거부)
- 직렬화 가능 상태를 정본으로 받아들이는 팀

## 어떤 팀에 Web Components / Lit / Stencil이 맞나

- 다중 프레임워크(React·Vue·Svelte) 환경에서 컴포넌트를 공유해야 하는 팀
- Shadow DOM의 격리가 외부 audit 가능성보다 더 가치 있는 팀(예: 외부 호스트 페이지에 임베드되는 위젯)
- W3C 표준 위에서만 컴포넌트를 만든다는 정책상의 제약이 있는 팀
- React 학습 분포 바깥에서 LLM 사용 비중이 크지 않은 팀

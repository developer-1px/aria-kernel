# 3.3 vs Material 3 · Polaris · Carbon — 직교 axis

Material 3·Polaris·Carbon은 이미 큰 시스템이다. 거기에 비하면 ds는 양적으로 비교 불가다. 그래서 "ds가 이긴다"는 프레임은 옳지 않다. **다른 목적함수를 최적화**하는 시스템들이라고 보는 게 정확하다.

대형 시스템은 사람 디자이너·개발자의 자유도(variant·테마·composition 유연성)를 보장하면서 시각 일관성을 추구한다. ds는 그 자유도를 의도적으로 깎아 LLM 결정성을 추구한다. 같은 차원에서 비교 불가능한 시스템들이다.

## 대형 시스템이 LLM 관점에서 갖는 구조적 한계

1. **variant 폭증**. Material 3 Button만 해도 filled / tonal / elevated / outlined / text 5개에 size·icon 변형이 더해진다. LLM은 매번 다른 조합을 고른다.
2. **시각 prop 노출**. `color`·`elevation`·`shape`가 prop이라 LLM이 비즈니스 로직과 시각 결정을 섞어 생성한다. ds는 색은 surface 소유자만 가진다(`item`은 `mute()`/`emphasize()`).
3. **Token이 별도 도구**. M3 토큰은 Figma·코드·문서가 분리되어 있다. ds는 palette → foundations 2층 코드 import 1경로다.
4. **Composition이 자유**. Polaris의 `<Card>`는 children에 무엇이든 들어간다. ds는 Card slot + 부모 Grid subgrid가 정본이다.

## Button 한 개를 작성한다면

**Material 3**:

```tsx
<Button
  variant="tonal"
  size="medium"
  startIcon={<Icon name="save" />}
  color="primary"
>
  Save
</Button>
```

**ds**:

```tsx
<Button data={{ id: 'save', label: 'Save', icon: 'save' }} onEvent={dispatch} />
```

`variant`·`size`·`color`가 prop으로 열려 있는 한, LLM은 같은 의도("저장 버튼")에 대해 매번 다른 조합을 만들어낼 수 있다. ds는 그 자유도를 닫는 대신 시각 다양성을 잃는다.

## ds가 못하는 것

- Material 3 수준의 시각 다양성·브랜드 표현·motion 풍부함은 없다. 초기 단계라 양적으로도 비교 불가.
- 디자이너 친화 도구(Figma kit·token sync 도구)도 없다.
- 산업 표준급 a11y QA·문서·번역 인프라도 없다.

## 정직한 한계

- M3·Polaris·Carbon이 자체 LLM 도구를 도입하면서 variant 축소를 시도할 가능성은 있다. 그 경우 ds의 차별점은 "더 일찍 수렴"으로 좁혀진다.
- "디자이너 친화 vs LLM 결정성"이 진짜 zero-sum인지는 아직 증거가 없다.
- 같은 task에 대해 M3 기반 LLM 출력 vs ds 기반 LLM 출력의 결정성 분포를 측정한 적 없다.

즉 "큰 시스템 vs ds"가 아니라 **사람 자유도 우선 vs LLM 결정성 우선**의 다른 axis다. M3가 LLM을 위해 variant를 0개로 줄일 일은 없을 것이다 — 그러면 디자이너 사용자 기반을 잃기 때문이다. ds는 디자이너 친화를 처음부터 포기했기 때문에 그 길이 열린다.

## 어떤 팀에 ds가 맞나

- 대형 DS의 시각 다양성보다 결정성·audit 가능성이 더 중요한 팀
- 자체 브랜드 표현이 거의 없는 내부 도구·관리자 화면 중심 팀
- 디자이너 인력보다 엔지니어·LLM 인프라가 더 큰 팀

## 어떤 팀에 Material 3 / Polaris / Carbon이 맞나

- 디자이너 인력이 충분하고 시각 일관성·브랜드 표현이 핵심인 팀
- 외부 사용자 대상 제품으로 시각 풍부함이 경쟁력인 팀
- 이미 Figma·디자이너 워크플로에 깊이 투자한 팀
- 산업 표준 a11y·국제화·문서를 거저 받고 싶은 팀

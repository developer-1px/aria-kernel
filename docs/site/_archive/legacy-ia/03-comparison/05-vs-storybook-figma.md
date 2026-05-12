# 3.5 vs Storybook · Figma Token — 직교 도구

Storybook과 Figma Token은 자주 "디자인 시스템"이라는 같은 어휘 안에서 ds와 함께 거론된다. 하지만 풀려는 문제 자체가 다른 layer에 있다. 직교 도구이며 ds와 같이 쓰일 수 있다.

## 각자가 푸는 문제

**Storybook**. 컴포넌트의 **시각·동작 카탈로그**. 디자이너·개발자가 가능한 variant·state 조합을 눈으로 확인하고 QA한다. "사람이 컴포넌트를 이해·검증하는 도구"다. 컴포넌트가 variant 폭증해도 잘 작동한다 — 오히려 variant가 많을수록 Storybook의 가치가 커진다.

**Figma Token**. 디자인 결정의 **단일 출처(SSOT)**. 색·간격·typography 값을 Figma·코드·문서가 같은 토큰을 참조하게 한다. "사람이 만든 결정을 도구 간에 동기화"하는 도구다.

**ds**. LLM의 출력 분포를 **같은 의도 → 같은 출력**로 수렴시키는 시스템. 결정 자체를 줄이는 게 목적이다(decision-shrinking system).

세 문제는 직교한다.

## ds는 Storybook을 재발명하지도, 의존하지도 않는다

ds의 카탈로그 라우트(`/canvas`·`/content`)는 **Storybook clone이 아니다**. variant grid·MDX·controls panel 같은 Storybook UX를 따라가지 않는다. 목적이 다르기 때문이다.

ds 카탈로그의 의도는 **"받아들여진 시각 어포던스를 모은다"** — 어떤 모양·간격·라벨·인터랙션이 이미 사람들에게 검증된 패턴인지를 한 장에서 보여주고, 그 패턴이 ds에서 어떻게 1 role = 1 component로 응축됐는지 노출한다. Storybook은 "내 컴포넌트의 모든 variant"가 대상이지만, ds 카탈로그는 "업계가 이미 합의한 ARIA role·tier·affordance"가 대상이다.

Storybook은 **variant가 있어야 의미가 있는 도구**다. ds는 variant 0이라 Storybook 가치 함수의 입력이 비어있다.

## ds가 Figma Token과도 정합 가능

ds의 토큰 구조는 palette → foundations 2층이다(Material 3의 ref/sys 등가). Figma Token이 그 두 층 중 어느 쪽과 매핑되어도 흐름은 닫힌다. 다만 권한 모델은 다르다 — Figma Token은 디자이너가 결정을 만든다는 전제이고, ds는 결정 자체를 줄이려 한다. 도구가 같이 쓰이지만 정본 갱신의 권한 흐름은 같지 않다.

## 같은 컴포넌트를 보여준다면

**Storybook**:

```tsx
// Button.stories.tsx
export const Primary: Story = { args: { variant: 'primary', size: 'md' } };
export const PrimaryLarge: Story = { args: { variant: 'primary', size: 'lg' } };
export const Secondary: Story = { args: { variant: 'secondary', size: 'md' } };
// ... N x M 카르테시안 그리드
```

**ds /canvas 라우트** (`showcase/canvas/src/...`):

```tsx
definePage({
  entities: [
    { type: 'Button', data: { id: 'save', label: 'Save' } },
    // 1 role = 1 component, variant가 없으니 N x M 그리드도 없다
  ],
});
```

ds는 카탈로그가 짧다. 그게 가능한 건 variant가 0이기 때문이다. Storybook은 variant가 풍부할수록 가치가 커지고, ds 카탈로그는 variant가 0일수록 가치가 보존된다.

## 정직한 한계

- ds도 사람 검증용 카탈로그(`/canvas`·`/content`)가 필요하다. 다만 그것은 Storybook 재발명이 아니라 "받아들여진 시각 어포던스를 모으는 자리". 의도와 평가축이 다르다.
- Figma → ds token 자동 동기화 흐름은 아직 ds 정본에 들어 있지 않다.

## 어떤 팀에 ds가 맞나

- 시각 카탈로그 외에 **출력 분포 자체를 좁히는 시스템**까지 필요한 팀
- Figma SSOT보다 코드 정본을 1차 출처로 두고 싶은 팀

## 어떤 팀에 Storybook · Figma Token이 (계속) 맞나

- 변형 풍부한 컴포넌트를 디자이너·개발자가 시각으로 검증해야 하는 팀
- Figma → 코드 디자인 토큰 동기화가 핵심 워크플로인 팀
- 결정 자체를 줄이는 게 아니라 **결정을 잘 동기화**하는 게 더 절실한 팀

(이 둘은 ds와 함께 쓸 수 있다 — 양자택일이 아니다.)

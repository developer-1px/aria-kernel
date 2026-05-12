# 3.4 vs Tailwind + shadcn — LLM 결정성 가설 (측정 부재 인정)

> **솔직한 단서**: 이 챕터의 핵심 주장 — "ds가 LLM에게 더 결정적이다" — 은 **아직 측정되지 않은 가설**이다. 가설이 어떻게 구성돼 있고 어떻게 반증·확증할 수 있는지를 설명할 뿐, "증명됐다"고 말하지 않는다.

## 비교 대상

LLM이 React UI 코드를 생성하는 가장 흔한 조합은 **Tailwind + shadcn**이다. 학습 분포에서 압도적이고, 사용자 레포 안에 컴포넌트가 들어가는 모델도 동일하다. ds도 같은 자리를 노린다 — 따라서 "ds가 굳이 따로 있을 이유"는 이 조합과의 차이로 답해야 한다.

## 가설

> **같은 의도가 주어졌을 때, LLM이 ds로 생성한 코드는 Tailwind+shadcn으로 생성한 코드보다 더 좁은 출력 분포를 가진다.**

여기서 "좁은 분포"는 같은 자연어 prompt를 N번 돌렸을 때 (a) 토큰 단위 차이, (b) AST 단위 차이, (c) 시각/동작 단위 차이의 평균 거리를 말한다.

## 가설의 구조

가설은 다음 인과 사슬에 의존한다.

```
제약된 어휘  →  엔트로피 감소  →  생성 코드 분포의 분산 감소  →  audit·diff·재생성 비용 감소
```

각 고리를 풀어 쓰면:

1. **제약된 어휘**. ds는 동일 기능에 대해 (a) variant 0, (b) className 자유 0, (c) children JSX 자유 0, (d) 컴포넌트 1개를 강제한다. 같은 자리에서 Tailwind+shadcn은 (a) `cva` variant 자유, (b) 임의 utility class 조합, (c) children 자유 JSX, (d) 비슷한 컴포넌트 다중 후보를 허용한다.
2. **엔트로피 감소**. LLM이 다음 토큰을 고를 때 후보 집합이 작을수록 분기 엔트로피가 줄어든다(이론적). 어휘 제약은 후보 집합 크기에 직접 작용한다.
3. **분포 분산 감소**. 같은 prompt를 N번 sampling했을 때 출력 변동이 줄어든다는 가설은 (2)의 자연스러운 귀결이지만 — temperature·context·모델 종류에 의해 매개되므로 자명하지 않다.
4. **비용 감소**. 분포가 좁으면 사람·LLM 양쪽이 다음에 일어날 일을 예측할 수 있고 diff·audit·patch 비용이 줄어든다.

## 같은 카드 그리드를 작성한다면

**Tailwind + shadcn**:

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {item.body}
      </CardContent>
    </Card>
  ))}
</div>
```

**ds**:

```tsx
<CardGrid data={items} onEvent={dispatch} />
```

LLM이 자유 변수로 다룰 표면이 양쪽에서 얼마나 다른지 눈으로 보인다 — 위쪽은 grid breakpoint·gap·hover·typography·color 모두 자유이고, 아래쪽은 `data` 형태만 자유다. 이 관찰이 위 가설의 동기다. 단, **이건 아직 관찰일 뿐 측정이 아니다**.

## 어떻게 측정할 것인가 (제안)

본 문서는 측정 결과를 제공하지 않는다. 다만 어떻게 측정할 수 있는지의 윤곽은 다음과 같다.

- **task suite**: "할 일 리스트"·"카드 그리드"·"폼" 등 30개 prompt
- **모델**: 최소 2개 모델 × 3개 temperature
- **N**: prompt당 20회 샘플
- **지표**:
  - AST diff 평균 거리 (jscodeshift 기반)
  - 시각 diff (rendered DOM screenshot pHash)
  - lint 위반 비율 (ds canonical lint vs eslint+a11y만)
- **대조군**: ds / shadcn+Tailwind / Radix raw / Material 3

이 측정은 아직 수행되지 않았다. 결과가 가설을 반증한다면 ds의 차별 가치는 "결정성"이 아니라 다른 축(예: lint 가능성·정본 갱신 절차·audit ergonomic)으로 옮겨가야 한다.

## 정직한 한계

- 이 가설은 직관적이지만 자명하지 않다. "어휘를 줄였다고 LLM 출력이 더 결정적이 된다"는 명제는 모델 내부에서 그 어휘에 충분한 학습 신호가 있을 때만 성립한다. ds 자체가 학습 분포 바깥의 dialect라면 오히려 분산이 커질 수도 있다.
- 측정이 없으니 "ds가 더 좋다"라고 단정할 수 없다.
- 결정성이 좋아도 그 대가(시각 다양성·디자이너 자유도 상실)가 더 크면 net loss다.

## 어떤 팀에 ds가 맞나

- 위 가설이 맞다고 **베팅**할 수 있는 팀 — 실험을 직접 돌릴 의지·여력이 있고, 아니면 가설을 받아들이고 일찍 들어갈 의지가 있는 팀
- 같은 prompt에 같은 결과를 받는 일이 시각 다양성보다 더 가치 있는 팀

## 어떤 팀에 Tailwind + shadcn이 맞나

- 학습 분포 바깥으로 나가지 않고 가장 표준적인 LLM 출력을 받고 싶은 팀
- variant·className 자유의 가치가 결정성 손실보다 큰 팀
- "측정도 안 된 가설을 위해 dialect 학습 비용을 지불"하기 싫은 팀

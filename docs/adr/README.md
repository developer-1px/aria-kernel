# Architecture Decision Records

이 폴더는 아키텍처 결정 기록(ADR)을 담는다.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| 0001 | [Axis helpers stay in axes](./0001-axis-helpers-stay-in-axes.md) | accepted | — |
| 0002 | [check 와 select 는 별개의 축](./0002-check-and-select-two-axes.md) | accepted | 2026-05-05 |
| 0003 | [ARIA-punt 흡수 책임선](./0003-aria-punt-absorption-line.md) | accepted | 2026-05-11 |

## 명명

`NNNN-kebab-title.md` — 4자리 zero-padded 순번 + 설명적 제목.

예: `0001-keymap-100-percent-serializable.md`

## 형식

각 ADR은 다음 섹션:

```markdown
# NNNN. <Title>

- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD

## Context
무엇이 문제였고 어떤 제약이 있었는지.

## Decision
무엇을 결정했는지.

## Consequences
좋은 결과 / 나쁜 결과 / 후속 작업.
```

## 우선순위

ADR이 있는 영역을 만질 때는 ADR을 먼저 읽는다. 새 결정이 기존 ADR과 충돌하면 해당 ADR을 `superseded by`로 표시하고 새 ADR을 만든다.

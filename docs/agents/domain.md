# Domain Docs

이 repo의 도메인 어휘는 `packages/aria-kernel` 하나에 집중한다.

## 진입점

- 루트 `CONTEXT-MAP.md` — 어떤 컨텍스트들이 있는지 인덱스
- `packages/aria-kernel/CONTEXT.md` — 정본 어휘 + 정본 문서 포인터

## 컨텍스트 목록

`CONTEXT-MAP.md`가 정본. 요약:

- `packages/aria-kernel/CONTEXT.md` — ARIA behavior infra

## ADR

`docs/adr/` — 아키텍처 결정 기록. `NNNN-title.md` 명명. 자세한 형식은 `docs/adr/README.md`.

## 소비 규약

스킬(`improve-codebase-architecture`·`diagnose`·`tdd`·`grill-with-docs` 등)이 패키지를 만질 때:

1. 먼저 해당 패키지의 `CONTEXT.md`를 읽는다.
2. 그 `CONTEXT.md`가 가리키는 정본 문서(`INVARIANTS.md`·`PATTERNS.md`·`spec.md`·`README.md`)를 읽는다.
3. `docs/adr/` 에서 그 영역에 해당하는 ADR이 있는지 확인.
4. 작업 중 새 결정이 생기면 ADR 추가 (`NNNN-title.md`).
5. 도메인 어휘에 변화가 생기면 해당 `CONTEXT.md` 업데이트.

루트 `AGENTS.md`의 코딩 규칙과 현재 source tree가 모든 컨텍스트에 우선 적용된다.

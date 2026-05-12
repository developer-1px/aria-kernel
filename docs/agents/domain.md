# Domain Docs — Multi-context

이 repo는 모노레포라 도메인 어휘가 패키지/앱 단위로 다르다.

## 진입점

- 루트 `CONTEXT-MAP.md` — 어떤 컨텍스트들이 있는지 인덱스
- 각 패키지의 `CONTEXT.md` — 그 패키지의 정본 어휘 + 정본 문서 포인터

## 컨텍스트 목록

`CONTEXT-MAP.md`가 정본. 요약:

- `packages/aria-kernel/CONTEXT.md` — ARIA behavior infra (단 하나의 제품)
- `packages/fs/CONTEXT.md` — 파일시스템 추상
- `packages/devtools/CONTEXT.md` — 개발 도구

## ADR

`docs/adr/` — 아키텍처 결정 기록. `NNNN-title.md` 명명. 자세한 형식은 `docs/adr/README.md`.

## 소비 규약

스킬(`improve-codebase-architecture`·`diagnose`·`tdd`·`grill-with-docs` 등)이 어떤 패키지를 만질 때:

1. 먼저 해당 패키지의 `CONTEXT.md`를 읽는다.
2. 그 `CONTEXT.md`가 가리키는 정본 문서(`INVARIANTS.md`·`PATTERNS.md`·`spec.md`·`README.md`)를 읽는다.
3. `docs/adr/` 에서 그 영역에 해당하는 ADR이 있는지 확인.
4. 작업 중 새 결정이 생기면 ADR 추가 (`NNNN-title.md`).
5. 도메인 어휘에 변화가 생기면 해당 `CONTEXT.md` 업데이트.

루트 `AGENTS.md`의 코딩 규칙과 현재 source tree가 모든 컨텍스트에 우선 적용된다.

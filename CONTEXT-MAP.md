# CONTEXT-MAP

이 repo는 `@interactive-os/aria-kernel` 패키지 전용 워크스페이스다. 도메인 어휘는 `packages/aria-kernel/CONTEXT.md`를 따른다.

## Contexts

| 위치 | 컨텍스트 | 역할 |
|---|---|---|
| `packages/aria-kernel/CONTEXT.md` | ARIA behavior infra | 단 하나의 제품. axes·roving·gesture·patterns. |

Harness 앱과 앱 전용 helper package는 sibling workspace `../aria-kernel-apps`에 둔다.

## ADR

`docs/adr/` — 아키텍처 결정 기록. 새 결정은 `NNNN-title.md` 명명.

## 우선 어휘

분류·이름·위계의 정합 출처는 W3C/WHATWG spec. 1) WAI-ARIA + APG → 2) WHATWG HTML Living Standard → 3) WCAG. 라이브러리/DS 어휘 차용 ❌. 활성 규칙은 루트 `AGENTS.md`와 현재 source tree를 따른다.

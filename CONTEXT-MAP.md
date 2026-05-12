# CONTEXT-MAP

이 repo는 모노레포. 도메인 어휘는 패키지/앱 단위로 다르다. 각 컨텍스트의 `CONTEXT.md`를 따른다.

## Contexts

| 위치 | 컨텍스트 | 역할 |
|---|---|---|
| `packages/aria-kernel/CONTEXT.md` | ARIA behavior infra | 단 하나의 제품. axes·roving·gesture·patterns. |
| `packages/fs/CONTEXT.md` | 파일시스템 추상 | finder/markdown 앱이 소비. |
| `packages/devtools/CONTEXT.md` | 개발 도구 | repro recorder 등. |

Harness 앱(`apps/*`)은 자체 도메인이 있지만 보통 헤드리스 행동의 살아있는 증거 역할로만 쓰인다. 앱 단위 CONTEXT.md는 필요할 때만 추가.

## ADR

`docs/adr/` — 아키텍처 결정 기록. 새 결정은 `NNNN-title.md` 명명.

## 우선 어휘

분류·이름·위계의 정합 출처는 W3C/WHATWG spec. 1) WAI-ARIA + APG → 2) WHATWG HTML Living Standard → 3) WCAG. 라이브러리/DS 어휘 차용 ❌. 활성 규칙은 루트 `AGENTS.md`와 현재 source tree를 따른다.

# 0003. ARIA-punt 흡수 책임선

- Status: accepted
- Date: 2026-05-11
- Origin: spredsheet 개밥먹기 audit (5갭) → /discuss

## Context

spredsheet 개밥먹기에서 5개의 ad-hoc 패턴이 발견됐다:

| 자체 구현 | 자리 |
|---|---|
| `<div class="dialog-backdrop" onClick={close}/>` | HelpDialog |
| `data.entities[id].selected = ...` mutation | Tabs |
| `useEffect document.addEventListener('mousedown')` | ContextMenu |
| `<input onKeyDown={...}>` | Find |
| F2/Enter 직접 handler | useShortcuts |

공통점: 모두 ARIA spec 이 *"implementation-defined"* / *"MAY"* 로 punt 한 자리. 소비자가 매번 재구현. 정체성 메모리 `project_headless_for_llm_inhouse.md` 의 4지점 중 "ARIA punt 무지" 직격.

기존 메모리 `feedback_canonical_source_w3c_aria.md` 가 명시: *"1) ARIA → 2) HTML → 3) WCAG"* 우선순위. ARIA 가 punt 했으면 HTML/WCAG 까지 내려가도 책임선 안.

## Decision

**kernel 책임 = W3C 표준 어휘로 표현 가능한 모든 행동(behavior) 결정 흡수 + 입력 이벤트(dialog · keyboard · clipboard 등) 를 패턴 hook 까지 transport.**

흡수 대상:
- ARIA spec 본문이 punt 한 자리 (backdrop click · outside-close · edit-mode 전이 · controlled prop · chord 미들웨어)
- W3C Clipboard API · UIEvent · HTML interactive · Pointer Events
- de facto 헤드리스 라이브러리 표준 위치 (Radix `onInteractOutside`, RAC `<ModalOverlay>`)

흡수 안 함:
- ARIA spec 본문 어휘 재서술 (링크만)
- 시각·Tailwind·마크업 디자인
- 앱 도메인 어휘

## Consequences

5 kernel API 추가:
- `useDialogPattern` — `backdropProps`, `onOpenChange`, `on` keymap
- `useTabsPattern` — `active` (controlled)
- `useMenuPattern` — `onInteractOutside`
- `useGridPattern` — `editStart` UiEvent + `GRID_EDIT_CHORDS = [F2, Enter]`

5 invariant 신설 (INVARIANTS §B-ter.1~5).

검증 layer:
1. README.md — 인간 진입
2. INVARIANTS.md — 권위 등급
3. NAMING.md — 어휘 등록
4. PATTERNS.md — recipe identity checklist
5. kernel SSOT test
6. lab demo + black-box test

## Out of scope (별 ADR 후보)

- **Grid Clipboard transport** — W3C Clipboard API + UIEvent 흡수 (mod+c/x/v/y). 별 PR.

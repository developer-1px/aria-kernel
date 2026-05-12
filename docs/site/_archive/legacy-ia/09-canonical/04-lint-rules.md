# Lint 1:1 매핑

정본은 1행이 lint 1개로 직결될 때만 종이 위가 아니라 코드 안에 산다. ds의 `scripts/` 폴더에 있는 정적 검사 스크립트는 [정본 선언](./02-declarations.md)의 영역과 1:1로 묶인다.

## 매핑 표

| Lint / Audit 스크립트 | 검증 대상 정본 줄 |
|---|---|
| `scripts/lint-ds-contracts.mjs` | 컴포넌트 인터페이스 — `ControlProps(data, onEvent)` 데이터 주도 (children JSX 금지) |
| `scripts/lint-ds-serializable.mjs` | C2 상태 직렬화 — useState 값에 함수·DOM·Promise 보관 금지 |
| `scripts/lint-ds-invariants.mjs` | 헌장 C1~C6 종합 — 정본 위반 패턴 정적 감지 |
| `scripts/lint-ds-keyboard.mjs` | gesture/intent · roving — 소비자 onKeyDown 분기 차단, `activateProps`·`useSpatialNavigation` 적용 |
| `scripts/lint-ds-shell.mjs` | 반응형 — shell DOM의 JS 분기·matchMedia 차단 (CSS only) |
| `scripts/lint-ds-values.mjs` | 토큰 — palette gray N 직접 import 차단, semantic만 허용 |
| `scripts/lint-ds-css-orphans.mjs` | content widget — 사용처 없는 style 정리 |
| `scripts/lint-flat-layout.mjs` | 앱 레이아웃 — `definePage` 일탈 감지 (직접 flexbox 조립 금지) |
| `scripts/lint-ds.mjs` | ds 전체 — 다른 lint 통합 진입점 |
| `scripts/audit-ds-css.ts` | C5 셀렉터 어휘 — stylesheet에 스타일 전용 className 감사 |
| `scripts/audit-hmi.mjs` | 위계 단조 invariant — Gestalt 5단(atom < section < surface < shell) 분리 강도 자손 ≤ 조상 |
| `scripts/role-css-audit.ts` | 셀렉터 — role 누락된 CSS 셀렉터 색출 |
| `scripts/aria-xray.mjs` · `aria-tree.ts` | ARIA 트리 — role·aria-* 의 구조 검증 (raw role 0개 · 시연 라우트 예외) |
| `scripts/verify-css-guard.mjs` | 색 weight·opacity — surface 소유자만 색 보유, item은 mute/emphasize |
| `scripts/snap-screenshots.mjs` | 변화 추적 — UI 진화 스냅샷 (정본 갱신 절차의 4단계 "감사 재실행" 보조) |
| `scripts/hooks/pre-commit` | 강제 시점 — 커밋 시 위 lint 일괄 실행 |
| `vite-plugin-ds-audit.ts` | 강제 시점 — dev/build 타임 정본 감사 (`scan` + `types` 분리) |

## 자동화율

자동 lint가 잡는 위반과 사람 리뷰가 잡는 위반의 비율은 측정 중이지만, 헌장 6개 중 5개(C1·C2·C3·C4·C5)는 정적으로 검증 가능한 lint가 존재한다. C6(정본 ≠ 이상형)만이 본질적으로 사람 판단이다 — "쓰이지 않는 정본을 박지 마라"는 코드 분석으로는 잡을 수 있어도 의도까지는 못 본다.

## 새 정본 추가 시

새 정본 행이 [02 · 정본 선언](./02-declarations.md)에 추가되면 다음 둘 중 하나로 lint를 잇는다.

1. **기존 lint에 룰 추가** — 같은 영역의 lint 스크립트가 있으면 그 안에 케이스를 넣는다.
2. **신규 lint 신설** — 영역이 새로 생기면 `lint-ds-<area>.mjs`를 만든다.

lint 없이 정본 1행만 추가하는 것은 [05 · 갱신 절차](./05-update-procedure.md)의 "정본 ≠ 이상형(C6)" 게이트를 통과하지 못한다.

## 관련

- 헌장 — [01 · 정본 헌장](./01-charter.md)
- 영역별 정본 — [02 · 정본 선언](./02-declarations.md)
- 코드 실체 — [03 · Devices](./03-devices.md)
- 갱신 절차 — [05 · 갱신 절차](./05-update-procedure.md)

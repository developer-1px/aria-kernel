# `@p/aria-kernel` — Context

이 repo의 단 하나의 제품. ARIA 행동 인프라 (axes · roving · gesture · patterns).

## 정본 문서

- `INVARIANTS.md` — 헤드리스 invariant (행동 규약, 데이터 형태, 직렬화)
- `PATTERNS.md` — pattern recipe 시그니처 (use*Pattern · *Pattern 두 종류)
- 루트 `CLAUDE.md` — 추구미·코딩 규칙·import 경로 표

## 어휘 출처

W3C/WHATWG spec에 닫혀있다.
1. WAI-ARIA + APG (role taxonomy) — `/patterns` 출처
2. WHATWG HTML Living Standard (semantic element)
3. WCAG
4. W3C Pointer Events Level 3 + UI Events — `/gesture` 출처 (ARIA punt 자리 흡수, #149 §4)

신규 어휘는 spec에서 가져오는 게 아니면 만들지 않는다 — 항상 grep first.

`/gesture` 흡수 경계: "ARIA 의미와 결합된 pointer 어휘"(click → activate, drag → multi-select extend, contextmenu → menu trigger). 순수 pointer raw (스크롤 가속도, 펜 압력 등) 는 scope-out — `@use-gesture` 영역.

## 핵심 어휘 한눈에

- **Axis** — function-with-property hybrid. 호출 시 `KeyMap` 반환, `.chords: readonly string[]` 메타 직렬화 (PRD #38 closed).
- **chord** — tinykeys string syntax (`'Shift+Tab'`, `'$mod+c'`, `'Click'`). 과거의 `KeyChord` 객체/boolean modifier map 은 폐기.
- **INTENT_CHORDS** — 모든 axis 의 chord 정의 SSOT (`'navigate.next'`, `'activate'`, …). 패턴 hook 이 이걸 합성.
- **UiEvent** — ui ↔ headless 통신 단일 어휘. zod schema gate. DOM `Event` 와 분리 위해 `Ui` prefix.
- **NormalizedData** — flat by id + meta. tree/list 무관 통일 표현.
- **데이터 합성** — 컬렉션 패턴은 `use<Pattern>Reducer(items, opts?)` 1:1 sibling hook (canonical). escape 는 React `useReducer(reduceSingleSelect, items, fromList)` 직접.
- **Pattern** — `use*Pattern` (내부 React state) vs `*Pattern` (순수 함수). 데이터성 state는 외부 주입, UI 일시 state는 내부.
- **Gesture** — `use*Gesture` 접미사 통일. `/gesture` subpath 의 단일 명명 어휘 (`useZoomPanGesture` · `useDragGesture` · …, #149).
- **Lab** — W3C spec 출처가 없는 de facto 위젯 (Excel fill handle 등) 은 lab 영역으로 격리. stability 약속 없음. de facto 수렴 증거가 누적되면 graduate.

자세한 의미·invariant는 위 정본 문서.

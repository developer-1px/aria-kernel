/**
 * Operational timing constants — W3C/APG spec 에 없지만 headless 생태계 de facto 인
 * race-window 상수들. 변경은 호스트 패키지(aria-kernel · editable-lifecycle · zod-crud)
 * 공통 동작에 영향 — 반드시 여기 한 곳만 수정.
 */

/**
 * popover/combobox 가 host blur 직후 option mousedown→activate 가 도달할 때까지
 * 기다리는 race window. HeadlessUI · Radix · Reach Combobox de facto 100ms.
 */
export const BLUR_RACE_DELAY_MS = 100

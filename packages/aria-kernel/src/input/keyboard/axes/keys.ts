/**
 * KEYS — KeyboardEvent.key 값의 string SSOT.
 *
 * `e.key === KEYS.Enter` 같은 raw 비교에서 단일 grep target 보장.
 * chord SSOT (modifier 포함, tinykeys 형식) 는 `INTENT_CHORDS` (`./intentChords`).
 */
export const KEYS = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  F2: 'F2',
} as const

export type KeyName = keyof typeof KEYS

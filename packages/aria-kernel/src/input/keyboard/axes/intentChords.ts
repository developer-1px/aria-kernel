/**
 * INTENT_CHORDS — axis 별 intent ↔ `@interactive-os/keyboard` shortcut SSOT.
 *
 * 모든 chord 가 string 형식. 100% 직렬화 가능, devtools/문서 가독.
 * KeyChord object 형식은 폐기됨 — string 만 정본.
 */

import type { Chord } from './axis'

export const INTENT_CHORDS = {
  activate: {
    trigger: ['Enter', 'Space'] as readonly Chord[],
  },
  toggle: {
    trigger: ['Space'] as readonly Chord[],
  },
  escape: {
    close: 'Escape' as Chord,
  },
  expand: {
    open: ['ArrowRight', 'Enter', 'Space'] as readonly Chord[],
    close: 'ArrowLeft' as Chord,
  },
  navigate: {
    vertical:   { prev: 'ArrowUp' as Chord,   next: 'ArrowDown' as Chord  },
    horizontal: { prev: 'ArrowLeft' as Chord, next: 'ArrowRight' as Chord },
    start: 'Home' as Chord,
    end:   'End' as Chord,
  },
  pageNavigate: {
    prev: 'PageUp' as Chord,
    next: 'PageDown' as Chord,
  },
  numericStep: {
    horizontal: {
      inc: ['ArrowRight', 'ArrowUp'] as readonly Chord[],
      dec: ['ArrowLeft', 'ArrowDown'] as readonly Chord[],
    },
    vertical: {
      inc: 'ArrowUp' as Chord,
      dec: 'ArrowDown' as Chord,
    },
    min: 'Home' as Chord,
    max: 'End' as Chord,
    pageInc: 'PageUp' as Chord,
    pageDec: 'PageDown' as Chord,
  },
  gridNavigate: {
    left:      'ArrowLeft' as Chord,
    right:     'ArrowRight' as Chord,
    up:        'ArrowUp' as Chord,
    down:      'ArrowDown' as Chord,
    rowStart:  'Home' as Chord,
    rowEnd:    'End' as Chord,
    gridStart: 'Control+Home' as Chord,
    gridEnd:   'Control+End' as Chord,
  },
  gridMultiSelect: {
    selectColumn: 'Control+Space' as Chord,
    selectRow:    'Shift+Space' as Chord,
    selectAll:    ['Control+a', 'Control+A', 'Meta+a', 'Meta+A'] as readonly Chord[],
    toggle:       'Space' as Chord,
    rangeLeft:    'Shift+ArrowLeft' as Chord,
    rangeRight:   'Shift+ArrowRight' as Chord,
    rangeUp:      'Shift+ArrowUp' as Chord,
    rangeDown:    'Shift+ArrowDown' as Chord,
  },
  multiSelect: {
    toggle:    ['Space'] as readonly Chord[],
    selectAll: ['Control+a', 'Control+A', 'Meta+a', 'Meta+A'] as readonly Chord[],
    rangeUp:   'Shift+ArrowUp' as Chord,
    rangeDown: 'Shift+ArrowDown' as Chord,
    // APG listbox Selection: anchor → 현재 focus 까지 범위 확장(포커스 이동 없음).
    rangeAtFocus:  'Shift+Space' as Chord,
    // APG listbox Selection: focus 를 첫/마지막으로 이동 + 그 사이 전체 선택.
    rangeToFirst:  ['Control+Shift+Home', 'Meta+Shift+Home'] as readonly Chord[],
    rangeToLast:   ['Control+Shift+End',  'Meta+Shift+End']  as readonly Chord[],
  },
  select: {
    toggle: 'Space' as Chord,
  },
  treeNavigate: {
    parent:     'ArrowLeft' as Chord,
    firstChild: 'ArrowRight' as Chord,
    prev:       'ArrowUp' as Chord,
    next:       'ArrowDown' as Chord,
  },
  treeExpand: {
    open:  'ArrowRight' as Chord,
    close: 'ArrowLeft' as Chord,
  },
  /** Tab focus management — focus trap primitive 가 사용. */
  tab: {
    forward:  'Tab' as Chord,
    backward: 'Shift+Tab' as Chord,
  },
} as const

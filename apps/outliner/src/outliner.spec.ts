/**
 * outliner.spec — 앱 declarative SSOT (4 buckets).
 *
 * 앱이 선언해야 하는 것은 4가지뿐:
 *   ① schema   — 자료의 모양과 UI 해석 힌트 (entity · initial · labelField · childField · emptyValue)
 *   ② inputs   — 입력(chord/click/menu) → command 매핑 (앱 어휘의 SSOT)
 *   ③ pattern  — ARIA recipe + options
 *   ④ ui       — 렌더 surface (Outliner.tsx 별도 파일에 위치)
 *
 * 그 외 모든 것(normalize · routing · op 시퀀스 · meta reducer · default keymap)은
 * 라이브러리 IN. 앱은 본 spec 만 read.
 */
import { z } from 'zod'

export type OutlineNode = { text: string; children: OutlineNode[] }

const OutlineNodeSchema: z.ZodType<OutlineNode> = z.object({
  text: z.string(),
  get children() {
    return z.array(OutlineNodeSchema)
  },
})

const SAMPLE: OutlineNode = {
  text: 'Welcome to the outliner',
  children: [
    { text: 'Press Enter to add a sibling', children: [] },
    { text: 'Press Tab to indent, Shift+Tab to outdent', children: [] },
    {
      text: 'Cmd+C / Cmd+X / Cmd+V — clipboard',
      children: [
        { text: 'paste-as-sibling: Cmd+V', children: [] },
        { text: 'paste-as-child:   Cmd+Shift+V', children: [] },
      ],
    },
    { text: 'Cmd+Z / Cmd+Shift+Z — undo / redo', children: [] },
    { text: 'Backspace — delete', children: [] },
  ],
}

export const outlinerSpec = {
  // ── ① Schema — 자료의 모양 ──────────────────────────────────────────────
  schema: {
    /** 재귀 outline node ({text, children[]}). zod-crud 가 schema 로 CRUD 자동 생성. */
    entity: OutlineNodeSchema,
    /** 초기 상태 — 세션 시작 시 보이는 SAMPLE outline. */
    initial: SAMPLE,
    /** insertAfter/appendChild 가 value 없이 올 때의 schema-aware 기본값. */
    emptyValue: { text: '', children: [] } as OutlineNode,
    /** 인라인 편집 시 update target — entity 의 child 노드 key. */
    labelField: 'text' as const,
    /** 트리 자식 배열 필드명 — normalize 의 walk 기준 (이전엔 'children' 하드코딩). */
    childField: 'children' as const,
  },

  // ── ② InputMap — 입력 → command (chord/click/menu 통합 SSOT) ────────────
  /**
   * 한 command 가 여러 surface(chord/menu/palette) 로 노출. label 은 menu/palette 용,
   * chord 는 키보드 dispatcher 용. click/contextmenu 는 후속 추가 예정 (label 만 있으면
   * 메뉴에 자동 노출되는 형태로 확장).
   */
  inputs: [
    { chord: 'Enter',       command: 'editStart',      label: 'Rename',
      effect: { op: 'editStart' } },
    { chord: 'Shift+Enter', command: 'insertAfter',    label: 'Insert sibling',
      effect: { op: 'insertAfter', source: 'self', fallback: { op: 'appendChild', source: 'self' } } },
    { chord: 'Backspace',   command: 'remove',         label: 'Delete',
      effect: { op: 'remove' } },
    { chord: 'Delete',      command: 'remove',         label: 'Delete',
      effect: { op: 'remove' } },
    { chord: 'Tab',         command: 'demote',         label: 'Demote',
      effect: { op: 'move', source: 'self', target: 'prevSibling', mode: 'child' } },
    { chord: 'Shift+Tab',   command: 'promote',        label: 'Promote',
      // Workflowy/Roam 정본 — following siblings → 자식으로 흡수, self → parent 의 sibling-after
      effect: [
        { op: 'move', source: 'followingSiblings', target: 'self', mode: 'child' },
        { op: 'move', source: 'self', target: 'parent', mode: 'sibling-after' },
      ] },
    { chord: 'mod+z',       command: 'undo',           label: 'Undo',
      effect: { op: 'undo' } },
    { chord: 'mod+shift+z', command: 'redo',           label: 'Redo',
      effect: { op: 'redo' } },
    { chord: 'mod+y',       command: 'redo',           label: 'Redo (Win)',
      effect: { op: 'redo' } },
    { chord: 'mod+shift+v', command: 'paste-as-child', label: 'Paste as child',
      effect: { op: 'paste', source: 'self', mode: 'child' } },
  ] as const,

  // ── ③ Pattern — ARIA recipe ─────────────────────────────────────────────
  pattern: {
    /** 따르는 W3C APG recipe. */
    aria: 'tree' as const,
    /** Pattern 옵션 — useTreeviewPattern 에 그대로 패스. */
    options: { label: 'outline' },
  },

  // ── ④ UI — 렌더 surface ─────────────────────────────────────────────────
  // UI 는 Outliner.tsx 컴포넌트 파일에 위치 (정적 데이터가 아닌 JSX surface 라 spec 외부).
} as const

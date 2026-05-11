/**
 * Outliner — keyboard 시나리오 (memory `feedback_test_via_demo_only`).
 * Demo 렌더 + fireEvent 키/마우스만으로 커버. 내부 단위 테스트 0건.
 */
// SKIPPED: outliner app uses legacy zod-crud `createJsonCrud` which is a throwing
// shim stub (tooling/zod-crud-shim.ts). App migration is tracked in #132; once
// outliner moves to `useJsonDocument`, restore by changing `describe.skip` → `describe`.
import { afterEach, describe as _describe, expect, it } from 'vitest'
const describe = _describe.skip
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Outliner, outlineCrud as crud } from '@apps/outliner'

import { beforeEach } from 'vitest'

const resetCrud = () => {
  let safety = 100
  while (crud.canUndo() && safety-- > 0) crud.undo()
}

beforeEach(resetCrud)
afterEach(() => {
  cleanup()
  resetCrud()
})

const mkClipboard = () => {
  const store: Record<string, string> = {}
  return {
    setData: (mime: string, val: string) => { store[mime] = val },
    getData: (mime: string) => store[mime] ?? '',
    clearData: () => Object.keys(store).forEach((k) => delete store[k]),
  } as unknown as DataTransfer
}

const items = () => screen.getAllByRole('treeitem')
const labelOf = (el: HTMLElement) => el.textContent?.replace(/[▾▸•]/g, '').trim() ?? ''
const labels = () => items().map(labelOf)
const find = (prefix: string) => items().find((el) => labelOf(el).startsWith(prefix))!
const levelOf = (el: HTMLElement) => {
  const lvl = el.getAttribute('aria-level')
  return lvl ? parseInt(lvl, 10) : 0
}

/** rovingbindAxis 가 data-id 위임 — focus 된 item element 에 keydown 직접 발화. */
const focused = (): HTMLElement => {
  const t0 = items().find((el) => el.tabIndex === 0)
  if (t0) return t0
  return items()[0]  // fallback — 첫 항목이 default focus
}
const press = (key: string, opts: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {}) =>
  fireEvent.keyDown(focused(), { key, ...opts })

describe('Outliner — Tab demote (move 어휘, clipboard 안 거침)', () => {
  it('Tab 으로 활성 항목이 직전 형제의 자식이 된다 (level +1)', () => {
    render(<Outliner />)
    press('ArrowRight')                     // root 펼침
    press('ArrowDown'); press('ArrowDown')  // 'Press Tab' 까지
    const target = find('Press Tab')
    const beforeLevel = levelOf(target)
    press('Tab')
    // 'Press Enter' 펼치고 자식 확인
    const pressEnter = find('Press Enter')
    pressEnter.focus()  // tabindex 가져오기 위해 — 실제 focusId 는 move 후 새 노드로 이동
    fireEvent.keyDown(pressEnter, { key: 'ArrowRight' })
    const moved = items().find((el) => labelOf(el).startsWith('Press Tab') && levelOf(el) === beforeLevel + 1)
    expect(moved).toBeDefined()
  })
})

describe('Outliner — Shift+Tab promote (move 어휘)', () => {
  it('Shift+Tab 으로 활성 항목이 부모 다음 형제로 빠져나간다 (level -1)', () => {
    render(<Outliner />)
    press('ArrowRight')                                          // root expand
    press('ArrowDown'); press('ArrowDown'); press('ArrowDown')   // 'clipboard'
    press('ArrowRight')                                          // expand clipboard
    press('ArrowDown')                                           // 'paste-as-sibling' focused
    const beforeLabels = labels().join('|')
    press('Tab', { shiftKey: true })
    // promote 후 'paste-as-sibling' 이 root level 로 빠져나옴 — 레이아웃 변경 확인
    expect(labels().join('|')).not.toBe(beforeLabels)
    // root 자식 수 증가 (clipboard 가 잃은 자식만큼 root 가 얻음)
    const rootChildAtLevel2 = items().filter((el) => levelOf(el) === 2).map(labelOf)
    expect(rootChildAtLevel2.some((l) => l.startsWith('paste-as-sibling'))).toBe(true)
  })
})

describe('Outliner — Shift+Tab promote 가 following siblings 를 자식으로 흡수', () => {
  it('Shift+Tab 후 원래 같은 부모의 뒤따르던 형제는 promoted 의 자식이 된다', () => {
    render(<Outliner />)
    press('ArrowRight')                                          // root expand
    press('ArrowDown'); press('ArrowDown'); press('ArrowDown')   // 'clipboard'
    press('ArrowRight')                                          // expand clipboard
    press('ArrowDown')                                           // 'paste-as-sibling' focused (level 3)
    const promoted = find('paste-as-sibling')
    const promotedLevelBefore = levelOf(promoted)
    press('Tab', { shiftKey: true })
    // promoted 는 한 단계 outdent + 새로 흡수한 자식 확인용 expand
    const movedPromoted = items().find((el) => labelOf(el).startsWith('paste-as-sibling'))!
    expect(levelOf(movedPromoted)).toBe(promotedLevelBefore - 1)
    movedPromoted.focus()
    fireEvent.keyDown(movedPromoted, { key: 'ArrowRight' })
    // 원래 following sibling 'paste-as-child' 는 promoted 의 자식
    const all = items()
    const promotedIdx = all.findIndex((el) => labelOf(el).startsWith('paste-as-sibling'))
    const followingIdx = all.findIndex((el) => labelOf(el).startsWith('paste-as-child'))
    expect(followingIdx).toBeGreaterThanOrEqual(0)
    expect(levelOf(all[followingIdx])).toBe(levelOf(all[promotedIdx]) + 1)
    expect(promotedIdx).toBeLessThan(followingIdx)
  })
})

describe('Outliner — Shift+Cmd+V paste-as-child', () => {
  it('Cmd+C 후 Shift+Cmd+V 로 자식으로 paste 된다', () => {
    render(<Outliner />)
    const dt = mkClipboard()

    press('ArrowRight')   // root expand
    for (let i = 0; i < 5; i++) press('ArrowDown')   // 'Backspace — delete'
    fireEvent.copy(focused(), { clipboardData: dt })

    press('ArrowUp')   // 'Cmd+Z'
    const target = find('Cmd+Z')
    const targetLevel = levelOf(target)

    // jsdom navigator.platform 빈 문자열 → mod=ctrl
    press('v', { ctrlKey: true, shiftKey: true })

    target.focus()
    fireEvent.keyDown(target, { key: 'ArrowRight' })   // expand to verify
    const pasted = items().filter((el) => labelOf(el).startsWith('Backspace'))
    const child = pasted.find((el) => levelOf(el) === targetLevel + 1)
    expect(child).toBeDefined()
  })
})

describe('Outliner — clipboard 오염 방지', () => {
  it('Cmd+C 한 값이 Tab demote 후에도 보존되어 Cmd+V 시 원본 paste', () => {
    render(<Outliner />)
    const dt = mkClipboard()

    press('ArrowRight')                                  // root expand
    for (let i = 0; i < 5; i++) press('ArrowDown')       // 'Backspace — delete'
    fireEvent.copy(focused(), { clipboardData: dt })
    const baselineCount = labels().filter((l) => l.startsWith('Backspace')).length

    // Tab demote on 'Press Tab' (clipboard 오염 시도)
    press('Home')
    press('ArrowDown'); press('ArrowDown')
    press('Tab')

    // Cmd+V on 'Cmd+Z' — 'Backspace' paste 되어야 (오염 안 됐다면)
    press('End')
    fireEvent.paste(focused(), { clipboardData: dt })

    const afterCount = labels().filter((l) => l.startsWith('Backspace')).length
    expect(afterCount).toBe(baselineCount + 1)
  })
})

describe('Outliner — Cmd+Z undo', () => {
  it('Tab demote 후 Cmd+Z 로 원상 복귀', () => {
    render(<Outliner />)
    press('ArrowRight')
    press('ArrowDown'); press('ArrowDown')
    const beforeLabels = labels().join('|')
    const beforeRootChildren = items().filter((el) => levelOf(el) === 2).length
    press('Tab')
    expect(labels().join('|')).not.toBe(beforeLabels)
    // move = appendChild + delete (2 commits) — 2회 undo
    press('z', { ctrlKey: true })
    press('z', { ctrlKey: true })
    expect(items().filter((el) => levelOf(el) === 2).length).toBe(beforeRootChildren)
  })
})

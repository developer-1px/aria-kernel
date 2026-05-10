// @ts-nocheck — node:fs/path used in vitest-only file; tsconfig.app excludes node types
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Axis-completeness invariant — EPIC #95 Layer 1.5
 *
 * 모든 demo `.test.tsx` 의 `meta.keys 의 모든 키가 black-box 동작을 일으킨다` 루프에서
 * `skipList` / `skipKeys` / `skipFor*` / `noopIn*` 같은 escape hatch 가 0 이어야 한다.
 *
 * advertise 한 키와 실측 effect 가 어긋나는 demo 는 별도 issue 로 분류 (EPIC #95).
 * 이 invariant 가 깨지면 새 escape hatch 가 들어왔다는 뜻 — 회귀 게이트.
 */
describe('axis-completeness invariant (EPIC #95)', () => {
  const dir = path.resolve(__dirname)
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.test.tsx') && !f.startsWith('_'))

  it('모든 demo test 에 skipKeys / skipFor* / noopIn* 같은 escape hatch 가 없다', () => {
    const violations: { file: string; line: string }[] = []
    const pat = /\b(skipKeys|skipFor[A-Za-z]+|noopIn[A-Za-z]+|skipList)\b/
    for (const f of files) {
      const lines = readFileSync(path.join(dir, f), 'utf8').split('\n')
      for (const line of lines) {
        if (line.trim().startsWith('//')) continue
        if (line.trim().startsWith('*')) continue
        if (pat.test(line)) violations.push({ file: f, line: line.trim() })
      }
    }
    expect(violations).toEqual([])
  })
})

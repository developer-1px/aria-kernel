#!/usr/bin/env node
/**
 * guardChordRegistry — *BuiltinChords descriptor 배열의 (chord, uiEvent) unique invariant 정적 검사.
 *
 * Why: 같은 (chord, uiEvent) descriptor 가 두 번 등록되면 UI 가 chord+uiEvent 키로 list rendering 시
 * React duplicate-key collision 이 터지고, runtime routing 에서 기대치 못한 분기가 생긴다.
 *
 * How: pattern 파일을 읽어 top-level `const X = ['..'] as const` 상수 맵을 만들고,
 * 각 `*BuiltinChords` 배열 entry 의 `chord:` 값(literal 또는 CONST[i])을 resolve 해 (chord, uiEvent) 쌍이
 * 같은 배열에서 두 번 등장하면 fail.
 *
 * 한계: literal 또는 `CONST[idx]` 형태만 resolve. 함수 호출/계산식은 못 잡음.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PATTERNS_DIR = join(__dirname, '..', 'packages', 'aria-kernel', 'src', 'patterns')

const files = readdirSync(PATTERNS_DIR)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
  .map((f) => join(PATTERNS_DIR, f))

const violations = []

for (const file of files) {
  const src = readFileSync(file, 'utf8')

  // 1) 상수 맵: const NAME = ['a', 'b', ...] as const
  const constMap = new Map() // name -> string[]
  const constRe = /(?:^|\n)\s*const\s+(\w+)\s*=\s*\[([^\]]+)\]\s*as\s+const/g
  for (const m of src.matchAll(constRe)) {
    const name = m[1]
    const items = [...m[2].matchAll(/'([^']+)'/g)].map((mm) => mm[1])
    constMap.set(name, items)
  }

  // 2) *BuiltinChords 배열 본문 추출
  const arrRe = /export\s+const\s+(\w*BuiltinChords)\s*:[^=]*=\s*\[([\s\S]*?)\n\]/g
  for (const m of src.matchAll(arrRe)) {
    const arrName = m[1]
    const body = m[2]
    const seen = new Map() // "chord|uiEvent" -> first line snippet

    // entry: { chord: <expr>, uiEvent: '<id>', ... }
    const entryRe = /\{\s*chord:\s*([^,]+?)\s*,\s*uiEvent:\s*'([^']+)'/g
    for (const e of body.matchAll(entryRe)) {
      const chordExpr = e[1].trim()
      const uiEvent = e[2]

      let chord = null
      const litMatch = /^'([^']+)'$/.exec(chordExpr)
      const idxMatch = /^(\w+)\[(\d+)\]$/.exec(chordExpr)
      if (litMatch) chord = litMatch[1]
      else if (idxMatch && constMap.has(idxMatch[1])) {
        chord = constMap.get(idxMatch[1])[Number(idxMatch[2])]
      } else {
        // unresolvable expr — skip with note (보수적: 안 잡음)
        continue
      }

      const key = `${chord}|${uiEvent}`
      if (seen.has(key)) {
        violations.push({
          file,
          arrName,
          chord,
          uiEvent,
          first: seen.get(key),
          dup: e[0],
        })
      } else {
        seen.set(key, e[0])
      }
    }
  }
}

if (violations.length === 0) {
  console.log('✓ guardChordRegistry: 모든 *BuiltinChords 배열에서 (chord, uiEvent) 유일성 OK')
  process.exit(0)
}

console.error('✗ guardChordRegistry: (chord, uiEvent) 중복 descriptor 발견\n')
for (const v of violations) {
  console.error(`  ${v.file}`)
  console.error(`    [${v.arrName}] (chord='${v.chord}', uiEvent='${v.uiEvent}') 중복`)
  console.error(`      first: ${v.first}`)
  console.error(`      dup:   ${v.dup}\n`)
}
process.exit(1)

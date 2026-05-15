/**
 * resolveIntent — AxisIntent → UiEvent[] 변환 layer (PRD #38 phase 3c).
 *
 * /conflict 결과: chord→intent (axis) 와 intent→state (reducer) 사이에
 * "intent + data → 구체 intent" 변환을 담당하는 제3 layer 도입. axis 100%
 * 직렬화 + UiEvent 본질 어휘 보존을 동시 충족.
 *
 * dispatch 흐름:
 *   axis(d, id, trigger): (UiEvent | AxisIntent)[]
 *     ↓
 *   resolveIntent(d, e): UiEvent[]   (AxisIntent → UiEvent[]; UiEvent → 그대로)
 *     ↓
 *   reducer(d, UiEvent): NormalizedData
 */

import type { NormalizedData, UiEvent } from '../intent/events'
import { ROOT, getChildren, getExpanded, isDisabled } from '../intent/events'
import { parentOf, enabledSiblings } from '../axes/index'
import { visibleEnabled } from '../axes/_visibleFlat'
import type { AxisIntent, TreeStepIntent, ExpandSeedIntent, PageStepIntent } from '../axes/intents'
import { isAxisIntent } from '../axes/intents'
import { resolveNavigate } from './resolveNavigate'

const firstEnabled = (d: NormalizedData, ids: string[]) =>
  ids.find((c) => !isDisabled(d, c))

/** treeStep — branch 분기 + leaf nextVisible (de facto VS Code/Finder). */
const resolveTreeStep = (d: NormalizedData, e: TreeStepIntent): UiEvent[] => {
  if (isDisabled(d, e.id)) return []
  const kids = getChildren(d, e.id)
  const isOpen = getExpanded(d).has(e.id)
  const branch: 'leaf' | 'branchOpen' | 'branchClosed' =
    kids.length === 0 ? 'leaf' : isOpen ? 'branchOpen' : 'branchClosed'

  if (e.dir === 'forward') {
    if (branch === 'branchClosed') return [{ type: 'expand', id: e.id, open: true }]
    if (branch === 'branchOpen') {
      const first = firstEnabled(d, kids)
      return first ? [{ type: 'navigate', id: first }] : []
    }
    // leaf → 다음 visible
    const v = visibleEnabled(d)
    const i = v.indexOf(e.id)
    return i >= 0 && i < v.length - 1 ? [{ type: 'navigate', id: v[i + 1] }] : []
  }

  if (e.dir === 'backward') {
    if (branch === 'branchOpen') return [{ type: 'expand', id: e.id, open: false }]
    // branchClosed | leaf → 부모로
    const p = parentOf(d, e.id)
    return p && p !== ROOT ? [{ type: 'navigate', id: p }] : []
  }

  if (e.dir === 'toggle') {
    if (branch === 'branchClosed') return [{ type: 'expand', id: e.id, open: true }]
    if (branch === 'branchOpen')   return [{ type: 'expand', id: e.id, open: false }]
    return []
  }

  return []
}

/** expandSeed — expand + seed 자식 focus. */
const resolveExpandSeed = (d: NormalizedData, e: ExpandSeedIntent): UiEvent[] => {
  if (e.dir === 'open') {
    const kids = getChildren(d, e.id)
    if (kids.length === 0 || isDisabled(d, e.id)) return []
    const out: UiEvent[] = [{ type: 'expand', id: e.id, open: true }]
    const first = firstEnabled(d, kids)
    if (first) out.push({ type: 'navigate', id: first })
    return out
  }
  // close → 부모 닫고 부모 focus
  const p = parentOf(d, e.id)
  if (!p || p === ROOT) return []
  return [
    { type: 'expand', id: p, open: false },
    { type: 'navigate', id: p },
  ]
}

/** pageStep — sibling N 칸 이동. */
const resolvePageStep = (d: NormalizedData, e: PageStepIntent): UiEvent[] => {
  const sibs = enabledSiblings(d, e.id)
  if (!sibs.length) return []
  const i = Math.max(0, sibs.indexOf(e.id))
  const t = e.dir === 'next'
    ? Math.min(sibs.length - 1, i + e.step)
    : Math.max(0, i - e.step)
  return t === i ? [] : [{ type: 'navigate', id: sibs[t] }]
}

/** dispatch 단일 event 를 resolver 통과 — UiEvent 는 패스, AxisIntent 는 풀어냄. */
export const resolveIntent = (d: NormalizedData, e: UiEvent | AxisIntent): UiEvent[] => {
  // navigate intent-form ({type:'navigate', dir, id?}) → result-form ({type:'navigate', id:nextId}).
  // dir 해석을 reducer 직전이 아닌 이 layer 에서 수행해야 sff/customGesture 가 result-form 만 다룸.
  // (PRD #38 phase 9+10 이후 fromKeyMap 이 intent-form 에도 from-id 를 스탬프하므로
  //  sff 가 from-id 로 activate 를 잘못 emit 하던 회귀 차단.)
  const ev = e as { type: string; dir?: unknown; id?: string }
  if (ev.type === 'navigate' && typeof ev.dir === 'string') {
    const next = resolveNavigate(d, ev.dir as never, ev.id)
    return next ? [{ type: 'navigate', id: next } as UiEvent] : []
  }
  if (!isAxisIntent(e as { type: string })) return [e as UiEvent]
  const intent = e as AxisIntent
  if (intent.type === 'treeStep')   return resolveTreeStep(d, intent)
  if (intent.type === 'expandSeed') return resolveExpandSeed(d, intent)
  if (intent.type === 'pageStep')   return resolvePageStep(d, intent)
  return []
}

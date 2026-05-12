import { fromKeyMap, type Axis } from './axis'
import { getChildren, isDisabled } from '../../../intent/events'

/**
 * submenuOpen — leaf-gated ArrowRight. parent menuitem 에서만 fire,
 * leaf 에선 null 반환 — composeAxes 가 다음 axis(activate) 로 흐름 양보.
 *
 * emit: `[{type:'expand', id, open:true}, {type:'navigate', id:firstChild}]`
 *
 * 정본 `expand` axis 가 leaf 에서 expandSeed:[] 로 short-circuit 하는 문제를
 * 회피한 변종. APG menu/menubar/menuButton 공통 사용.
 */
export const submenuOpen: Axis = fromKeyMap([
  ['ArrowRight', (d, id) => {
    const kids = getChildren(d, id).filter((k) => !isDisabled(d, k))
    if (!kids.length) return null
    return [
      { type: 'expand', id, open: true },
      { type: 'navigate', id: kids[0] },
    ]
  }],
])

/**
 * submenuClose — ArrowLeft. submenu 안에서 부모로 복귀 신호.
 * intent layer (pattern) 가 path-stack 을 pop 하고 부모 menuitem 에 refocus.
 *
 * emit: `[{type:'expand', id, open:false}]` — id 는 현재 menuitem (intent 가 부모를 추적).
 */
export const submenuClose: Axis = fromKeyMap([
  ['ArrowLeft', (_d, id) => [{ type: 'expand', id, open: false }]],
])

/**
 * submenuOpenDown — menubar top item ArrowDown 전용.
 * emit: open submenu + first child focus.
 */
export const submenuOpenDown: Axis = fromKeyMap([
  ['ArrowDown', (d, id) => {
    const kids = getChildren(d, id).filter((k) => !isDisabled(d, k))
    if (!kids.length) return null
    return [
      { type: 'expand', id, open: true },
      { type: 'navigate', id: kids[0] },
    ]
  }],
])

/**
 * submenuOpenUp — menubar top item ArrowUp 전용.
 * emit: open submenu + last child focus.
 */
export const submenuOpenUp: Axis = fromKeyMap([
  ['ArrowUp', (d, id) => {
    const kids = getChildren(d, id).filter((k) => !isDisabled(d, k))
    if (!kids.length) return null
    return [
      { type: 'expand', id, open: true },
      { type: 'navigate', id: kids[kids.length - 1] },
    ]
  }],
])

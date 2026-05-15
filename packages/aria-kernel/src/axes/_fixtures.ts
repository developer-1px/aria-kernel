import type { NormalizedData } from '../intent/events'

/**
 * 3×3 grid fixture used by gridNavigate / gridMultiSelect tests.
 *   r1 → c11 c12 c13
 *   r2 → c21 c22 c23
 *   r3 → c31 c32 c33
 */
export const grid3x3 = (): NormalizedData => ({
  entities: {
    r1: {}, r2: {}, r3: {},
    c11: {}, c12: {}, c13: {},
    c21: {}, c22: {}, c23: {},
    c31: {}, c32: {}, c33: {},
  },
  relationships: {
    r1: ['c11', 'c12', 'c13'],
    r2: ['c21', 'c22', 'c23'],
    r3: ['c31', 'c32', 'c33'],
  },
  meta: { root: ['r1', 'r2', 'r3'] },
})

import type { NormalizedData } from '../intent/events'

/**
 * singleReplaceField — 한 entity 만 `field=true`, 나머지 모두 `false`. 단일-of-그룹.
 *
 * `singleSelect` (`field='selected'`) · `singleCheck` (`field='checked'`) ·
 * `singleCurrent` (`field='current'`) · `multiSelectToggle.select` 분기 (focus 무관)
 * 의 공통 알고리즘.
 */
export const singleReplaceField = (field: string) =>
  (d: NormalizedData, targetId: string): { d: NormalizedData; mutated: boolean } => {
    const entities = { ...d.entities }
    let mutated = false
    for (const id of Object.keys(entities)) {
      const ent = entities[id]
      if (!ent) continue
      const wasOn = Boolean(ent[field])
      const willBe = id === targetId
      if (wasOn === willBe) continue
      entities[id] = { ...ent, [field]: willBe }
      mutated = true
    }
    return mutated ? { d: { ...d, entities }, mutated: true } : { d, mutated: false }
  }

/**
 * batchToggleField — 각 id 의 `field` 를 `to` 로 set, undefined 면 토글. 변화 없는 id 는 skip.
 *
 * `multiSelectToggle.select` (`field='selected'`) · `checkToggle.check`
 * (`field='checked'`) 의 공통 알고리즘.
 */
export const batchToggleField = (field: string) =>
  (d: NormalizedData, ids: readonly string[], to: boolean | 'mixed' | undefined): NormalizedData => {
    const entities = { ...d.entities }
    let mutated = false
    for (const id of ids) {
      const ent = entities[id]
      if (!ent) continue
      const next = to === undefined ? !ent[field] : to
      if (ent[field] === next) continue
      entities[id] = { ...ent, [field]: next }
      mutated = true
    }
    return mutated ? { ...d, entities } : d
  }

/**
 * batchReplaceField — ids 만 `field=true`, 나머지 모두 `false`. 다중-replace.
 * `select { ids, to: undefined }` 가 plain-click(replace) 시 호출.
 */
export const batchReplaceField = (field: string) =>
  (d: NormalizedData, ids: readonly string[]): NormalizedData => {
    const target = new Set(ids)
    const entities = { ...d.entities }
    let mutated = false
    for (const id of Object.keys(entities)) {
      const ent = entities[id]
      if (!ent) continue
      const willBe = target.has(id)
      if (Boolean(ent[field]) === willBe) continue
      entities[id] = { ...ent, [field]: willBe }
      mutated = true
    }
    return mutated ? { ...d, entities } : d
  }

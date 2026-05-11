/**
 * DEV-warn: multi-select 옵션과 reducer 페어링 silent bug 검출.
 *
 * 패턴 hook 이 `multiSelectable: true` 로 호출됐는데 host 의 reducer 가 multi-select
 * 이벤트 (`{type: 'select', ids: [id1, id2, ...], to?}`) 를 흡수하지 않으면, axis 는
 * shift-arrow range 를 emit 하는데 entity.selected 가 갱신되지 않는 silent local-maxima
 * 발생. #143 §1.2 / #148 action 10.
 *
 * production 빌드는 NODE_ENV strip.
 */

let warned = false
export const warnMultiSelectPairing = (pattern: string): void => {
  if (warned) return
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV
  if (env === 'production') return
  warned = true
  // eslint-disable-next-line no-console
  console.info(
    `[aria-kernel/${pattern}] multiSelectable: true — reducer 가 multi-select 이벤트를 ` +
    `흡수하는지 확인하세요. Default \`reduceWithDefaults\` 는 single-select 만 처리. ` +
    `\`reduceWithMultiSelect\` 또는 \`composeReducers(reduce, multiSelectToggle, ...)\` 사용.`,
  )
}

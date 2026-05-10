import { useReducer, useMemo } from 'react'
import { fromList, reduceWithDefaults, type UiEvent } from '@p/aria-kernel'
import { useCheckboxGroupPattern } from '@p/aria-kernel/patterns'

const ITEMS = [
  { id: 'apple', label: '사과' },
  { id: 'banana', label: '바나나' },
  { id: 'cherry', label: '체리' },
]

export function CheckboxMixedDemo() {
  const initial = useMemo(() => fromList(ITEMS), [])
  const [data, dispatch] = useReducer(reduceWithDefaults, initial)
  const { groupProps, parentProps, childProps, parentChecked, items } =
    useCheckboxGroupPattern(data, (e: UiEvent) => dispatch(e), {
      label: '과일 선택', parentLabel: '전체',
    })

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.14</span>
          Checkbox group — mixed (tri-state)
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — parent checkbox 의 mixed 상태 derive 와 일괄 토글 의미 implementation-defined.
          kernel 이 자식 enabled 만 집계해 mixed/checked/unchecked 자동.
        </p>
      </header>

      <div {...groupProps} className="rounded border border-neutral-200 bg-white">
        <label className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2 font-medium">
          <span {...parentProps} className="inline-block h-4 w-4 rounded border-2 border-neutral-400 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=mixed]:border-blue-500 data-[state=mixed]:bg-blue-300" />
          <span>전체 ({parentChecked === 'mixed' ? 'mixed' : parentChecked ? 'all' : 'none'})</span>
        </label>
        {items.map((it) => (
          <label key={it.id} className="flex items-center gap-2 px-6 py-2 hover:bg-neutral-50">
            <span {...childProps(it.id)} className="inline-block h-4 w-4 rounded border-2 border-neutral-400 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500" />
            <span className="text-sm">{it.label}</span>
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs text-neutral-400">parent click = 전체 토글. 자식 부분 체크 시 parent = mixed.</p>
    </div>
  )
}

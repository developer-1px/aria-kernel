import { useReducer, useMemo } from 'react'
import { fromList, type UiEvent } from '@p/aria-kernel'
import { reduceWithRadio } from '@p/aria-kernel'
import { useRadioGroupPattern } from '@p/aria-kernel/patterns'

const ITEMS = [
  { id: 'small', label: '소형' },
  { id: 'medium', label: '중형' },
  { id: 'large', label: '대형' },
]

export function RadioGroupSffDemo() {
  const initial = useMemo(() => fromList(ITEMS), [])
  const [data, dispatch] = useReducer(reduceWithRadio, initial)
  const { rootProps, radioProps, items } = useRadioGroupPattern(
    data, (e: UiEvent) => dispatch(e), { label: '사이즈', autoFocus: true },
  )

  const selected = items.find((i) => i.selected)?.label ?? '(없음)'

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.12</span>
          RadioGroup — selection follows focus
        </h1>
        <p className="text-sm text-neutral-500">
          APG 강제 — radio 는 항상 selection-follows-focus. Arrow 이동 = checked 전환.
          consumer 가 click/keydown 분기 ❌.
        </p>
      </header>

      <div {...rootProps} className="rounded border border-neutral-200 bg-white">
        {items.map((it) => (
          <label
            key={it.id}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-neutral-50 data-[selected]:bg-blue-50"
            data-selected={it.selected || undefined}
          >
            <span
              {...radioProps(it.id)}
              className="inline-block h-4 w-4 rounded-full border-2 border-neutral-400 data-[selected]:border-blue-500 data-[selected]:bg-blue-500"
            />
            <span className="text-sm">{it.label}</span>
          </label>
        ))}
      </div>

      <p className="mt-3 text-sm">선택: <strong>{selected}</strong></p>
      <p className="mt-1 text-xs text-neutral-400">↑↓ 또는 Click — focus 따라 자동 체크</p>
    </div>
  )
}

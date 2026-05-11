import { useReducer, useMemo } from 'react'
import { fromList, reduce, type UiEvent } from '@p/aria-kernel'
import { useAccordionPattern } from '@p/aria-kernel/patterns'

const ITEMS = [
  { id: 'q1', label: '주문은 어떻게 하나요?' },
  { id: 'q2', label: '반품 정책이 어떻게 되나요?' },
  { id: 'q3', label: '배송은 얼마나 걸리나요?' },
]

const ANSWERS: Record<string, string> = {
  q1: '카트에 담고 결제하시면 됩니다.',
  q2: '수령 후 7일 이내 무료 반품 가능합니다.',
  q3: '평일 기준 1~3일 소요됩니다.',
}

export function AccordionSingleDemo() {
  const initial = useMemo(() => fromList(ITEMS), [])
  const [data, dispatch] = useReducer(reduce, initial)
  const { rootProps, headingProps, buttonProps, regionProps, items } =
    useAccordionPattern(data, (e: UiEvent) => dispatch(e), { mode: 'single' })

  return (
    <div className="p-6 max-w-xl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.8</span>
          Accordion — single mode (sibling auto-collapse)
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — 동시에 여러 패널 open 허용 여부는 implementation-defined.
          single mode 에서 kernel 이 형제 자동 collapse 를 emit.
        </p>
      </header>

      <div {...rootProps} className="rounded border border-neutral-200 bg-white">
        {items.map((it) => (
          <div key={it.id} className="border-b border-neutral-100 last:border-b-0">
            <div {...headingProps(it.id)}>
              <button
                {...buttonProps(it.id)}
                onClick={() => dispatch({ type: 'activate', id: it.id })}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50"
              >
                <span>{it.label}</span>
                <span className="text-neutral-400 data-[state=open]:rotate-90">›</span>
              </button>
            </div>
            <div {...regionProps(it.id)} className="px-4 pb-3 text-sm text-neutral-600">
              {ANSWERS[it.id]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

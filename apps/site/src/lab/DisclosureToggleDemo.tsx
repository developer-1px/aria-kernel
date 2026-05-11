import type { UiEvent } from '@p/aria-kernel'
import { disclosurePattern, useDisclosureReducer } from '@p/aria-kernel/patterns'

export function DisclosureToggleDemo() {
  const [data, dispatch] = useDisclosureReducer([{ id: 'faq', label: 'FAQ' }])
  const dispatchEv = (e: UiEvent) => dispatch(e)
  const { triggerProps, panelProps } = disclosurePattern(data, 'faq', dispatchEv)

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.20</span>
          Disclosure — meta.expanded SSOT
        </h1>
        <p className="text-sm text-neutral-500">
          APG /disclosure/ — open 상태는 별도 useState 없이 `meta.expanded` set 으로
          표현. activate(click/Enter/Space) → expand 이벤트 emit.
          reduceSingleSelect 가 흡수.
        </p>
      </header>

      <button
        {...triggerProps}
        className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
      >
        FAQ <span className="text-xs">▾</span>
      </button>
      <div
        {...panelProps}
        className="mt-2 rounded border border-neutral-200 bg-white p-3 text-sm text-neutral-700"
      >
        <p>aria-kernel 의 disclosure 는 useState 없이 NormalizedData 의 meta.expanded set 만으로 동작합니다.</p>
        <p className="mt-2">Enter/Space/Click 모두 동일 토글.</p>
      </div>
    </div>
  )
}

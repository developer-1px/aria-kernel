import { useTooltipPattern } from '@interactive-os/aria-kernel/patterns'

export function TooltipDelayDemo() {
  const { triggerProps, tipProps } = useTooltipPattern({ delayShow: 300, delayHide: 100 })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.6</span>
          Tooltip — delayShow/delayHide
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — 보이기/숨기기 timing 은 implementation-defined. kernel 이
          <code> delayShow</code>/<code>delayHide</code> 옵션으로 흡수.
        </p>
      </header>

      <div className="relative inline-block">
        <button
          {...triggerProps}
          className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
        >
          hover 또는 focus 해보기
        </button>
        <div
          {...tipProps}
          className="absolute left-0 top-full mt-2 whitespace-nowrap rounded bg-neutral-800 px-2 py-1 text-xs text-white"
        >
          300ms 뒤 등장, 100ms 뒤 사라짐
        </div>
      </div>
    </div>
  )
}

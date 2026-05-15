import { useState } from 'react'
import { switchPattern } from '@interactive-os/aria-kernel/patterns'

export function SwitchToggleDemo() {
  const [on, setOn] = useState(false)
  const { switchProps } = switchPattern(on, (e) => setOn(e.value), { label: 'Mute' })

  return (
    <div className="p-6 max-w-md">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.11</span>
          Switch — Space + Enter + Click toggle
        </h1>
        <p className="text-sm text-neutral-500">
          WAI-ARIA punt — switch 의 Enter 키 응답 여부는 optional. kernel 의 activate
          axis 가 Space/Enter/Click 셋 모두 동일하게 토글 emit.
        </p>
      </header>

      <button
        {...switchProps}
        className="inline-flex h-7 w-12 items-center rounded-full border-2 border-neutral-300 transition data-[state=on]:bg-blue-500 data-[state=on]:border-blue-500"
      >
        <span className="block h-5 w-5 rounded-full bg-white shadow transition data-[state=on]:translate-x-5 ml-0.5" data-state={on ? 'on' : 'off'} />
      </button>

      <p className="mt-3 text-sm">state: <strong>{on ? 'ON' : 'OFF'}</strong></p>
      <p className="mt-1 text-xs text-neutral-400">Space, Enter, Click 모두 토글</p>
    </div>
  )
}

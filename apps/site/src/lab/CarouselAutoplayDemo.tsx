import { useState } from 'react'
import { useCarouselPattern } from '@interactive-os/aria-kernel/patterns'

const SLIDES = [
  { id: 's1', label: '첫 번째 슬라이드' },
  { id: 's2', label: '두 번째 슬라이드' },
  { id: 's3', label: '세 번째 슬라이드' },
]

export function CarouselAutoplayDemo() {
  const [i, setI] = useState(0)
  const {
    index, playing, prev, next, toggleRotation,
    rootProps, slideProps, prevButtonProps, nextButtonProps, rotationButtonProps,
  } = useCarouselPattern({
    slides: SLIDES, index: i, onIndexChange: setI,
    autoplay: true, intervalMs: 1500, label: 'demo carousel',
  })

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          <span className="text-xs text-neutral-400 font-mono mr-2">§B-ter.7</span>
          Carousel — autoplay + pause rules
        </h1>
        <p className="text-sm text-neutral-500">
          APG punt — autoplay 일시정지 규칙(hover/focus/explicit toggle) kernel 흡수.
        </p>
      </header>

      <div {...rootProps} className="rounded border border-neutral-200 bg-white">
        <div className="relative h-32 overflow-hidden">
          {SLIDES.map((s, idx) => (
            <div
              key={s.id}
              {...slideProps(idx)}
              className="absolute inset-0 flex items-center justify-center text-xl data-[active]:opacity-100 opacity-0"
              data-active={idx === index || undefined}
            >
              {s.label}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-neutral-100 p-2 text-sm">
          <button {...prevButtonProps} onClick={prev} className="rounded px-3 py-1 hover:bg-neutral-100">‹ prev</button>
          <button {...nextButtonProps} onClick={next} className="rounded px-3 py-1 hover:bg-neutral-100">next ›</button>
          <button {...rotationButtonProps} onClick={toggleRotation} className="ml-auto rounded bg-neutral-900 px-3 py-1 text-white">
            {playing ? '⏸ pause' : '▶ play'}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-neutral-400">hover 또는 focus 하면 자동 정지 — explicit toggle 로만 재개.</p>
    </div>
  )
}

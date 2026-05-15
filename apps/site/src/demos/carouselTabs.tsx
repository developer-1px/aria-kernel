import { useCarouselPattern, carouselKeys } from '@interactive-os/aria-kernel/patterns'

export const meta = {
  title: 'Carousel · Tablist',
  apg: 'carousel',
  kind: 'collection' as const,
  blurb: 'Auto-rotating carousel where each slide is selectable via tabs.',
  keys: () => carouselKeys({ control: 'tabs' }),
}

const SLIDES = [
  { id: 's1', label: 'Sunset over the ocean' },
  { id: 's2', label: 'Mountain ridge at dawn' },
  { id: 's3', label: 'Forest in autumn' },
  { id: 's4', label: 'Desert canyon panorama' },
]

const COLORS = ['from-amber-200', 'from-sky-200', 'from-emerald-200', 'from-rose-200']

export default function CarouselTabsDemo() {
  const c = useCarouselPattern({
    slides: SLIDES,
    label: 'Featured photos',
    control: 'tabs',
    autoplay: true,
    intervalMs: 4000,
  })

  return (
    <section
      {...c.rootProps}
      className="w-80 overflow-hidden rounded-md border border-stone-200 bg-white"
    >
      <div className="relative h-40">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            {...c.slideProps(i)}
            className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${COLORS[i % COLORS.length]} to-stone-100 px-4 text-center text-sm font-medium`}
          >
            {slide.label}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-stone-200 px-3 py-2">
        <div {...c.tablistProps} className="flex gap-1">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              {...c.tabProps(i)}
              className="h-2 w-6 rounded-full bg-stone-300 aria-selected:bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            />
          ))}
        </div>
        <button
          {...c.rotationButtonProps}
          className="text-xs text-stone-600 hover:text-stone-900"
        >
          {c.playing ? '❚❚ Pause' : '▶ Play'}
        </button>
      </div>
      <div {...c.liveRegionProps} className="sr-only">
        Slide {c.index + 1} of {SLIDES.length}: {SLIDES[c.index]?.label}
      </div>
    </section>
  )
}

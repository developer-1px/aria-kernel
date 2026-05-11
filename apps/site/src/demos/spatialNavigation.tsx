import { useSpatialNavigation, spatialNavigationKeys } from '@p/aria-kernel/roving'

export const meta = {
  title: 'Spatial Navigation (TV)',
  apg: 'spatial-navigation',
  kind: 'collection' as const,
  blurb:
    '시각 좌표 기반 roving — TV/리모컨 UI. APG 외 W3C `css-nav-1` spatnav. Arrow 키 90° cone 안에서 centroid 거리 최소 element 로 이동.',
  keys: () => spatialNavigationKeys({ orientation: 'both' }),
}

const POSTERS = [
  { title: 'Dune', hue: 'bg-amber-200' },
  { title: 'Arrival', hue: 'bg-sky-200' },
  { title: 'Blade Runner', hue: 'bg-rose-200' },
  { title: 'Interstellar', hue: 'bg-indigo-200' },
  { title: 'Tenet', hue: 'bg-stone-300' },
  { title: 'Inception', hue: 'bg-violet-200' },
  { title: 'Prisoners', hue: 'bg-emerald-200' },
  { title: 'Sicario', hue: 'bg-orange-200' },
  { title: 'Enemy', hue: 'bg-fuchsia-200' },
  { title: 'Joker', hue: 'bg-yellow-200' },
  { title: 'Drive', hue: 'bg-red-200' },
  { title: 'Heat', hue: 'bg-blue-200' },
]

export default function SpatialNavigationDemo() {
  const { ref, onKeyDown } = useSpatialNavigation<HTMLDivElement>(null, {
    orientation: 'both',
    itemSelector: '[data-card]',
  })

  return (
    <div className="space-y-3 text-xs">
      <p className="text-stone-600">
        리모컨 4 방향 키만으로 자유 배치 그리드를 탐색. DOM 순서가 아니라 화면 좌표로 다음 카드를 정한다.
      </p>
      <div
        ref={ref}
        onKeyDown={onKeyDown}
        aria-label="Featured"
        className="grid grid-cols-4 gap-3 rounded border border-stone-300 bg-stone-50 p-3 focus-within:border-stone-500"
      >
        {POSTERS.map((p, i) => (
          <button
            key={p.title}
            data-card
            className={`${p.hue} aspect-[2/3] rounded p-2 text-left text-stone-800 outline-none ring-stone-900 focus:ring-2 ${i === 5 ? 'col-span-2 row-span-2 aspect-auto' : ''}`}
          >
            <div className="text-[10px] uppercase tracking-wide opacity-60">#{i + 1}</div>
            <div className="mt-1 text-sm font-semibold">{p.title}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

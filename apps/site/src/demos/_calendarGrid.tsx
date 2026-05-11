import { useEffect, useRef, useState } from 'react'
import { KEYS } from '@p/aria-kernel'

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** CalendarGrid 가 흡수하는 키 — 내부 mini-axis (commit + 좌표 이동) SSOT. */
export const calendarGridKeys = (): readonly string[] =>
  [KEYS.Enter, KEYS.Space, KEYS.ArrowLeft, KEYS.ArrowRight, KEYS.ArrowUp, KEYS.ArrowDown]

interface CalendarDay { day: number | null; key: string }

export function buildMonth(year: number, month: number): CalendarDay[] {
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: CalendarDay[] = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `d-${d}` })
  while (cells.length % 7 !== 0) cells.push({ day: null, key: `pad-end-${cells.length}` })
  return cells
}

interface CalendarGridProps {
  /** ISO YYYY-MM-DD or '' when no date is committed yet. */
  value: string
  /** Called with ISO date when user commits via Enter/Space/click. */
  onCommit: (iso: string) => void
  /** Triggered to refocus the active day cell after open. */
  open: boolean
}

export function CalendarGrid({ value, onCommit, open }: CalendarGridProps) {
  const today = new Date()
  const [view, setView] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }))
  const [focusDay, setFocusDay] = useState(today.getDate())
  const dayBtnRefs = useRef(new Map<number, HTMLButtonElement | null>())

  const cells = buildMonth(view.y, view.m)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()

  useEffect(() => {
    if (!open) return
    dayBtnRefs.current.get(focusDay)?.focus({ preventScroll: true })
  }, [open, focusDay, view.y, view.m])

  const moveFocus = (delta: number) => {
    const next = focusDay + delta
    if (next < 1) {
      setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: (v.m + 11) % 12 }))
      const prevMonthDays = new Date(view.y, view.m, 0).getDate()
      setFocusDay(prevMonthDays + next)
    } else if (next > daysInMonth) {
      setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: (v.m + 1) % 12 }))
      setFocusDay(next - daysInMonth)
    } else {
      setFocusDay(next)
    }
  }

  const commit = (day: number) => {
    onCommit(`${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: (v.m + 11) % 12 }))}
          aria-label="Previous month"
          className="rounded px-2 py-1 hover:bg-stone-200"
        >‹</button>
        <span className="font-medium">{MONTH_NAMES[view.m]} {view.y}</span>
        <button
          type="button"
          onClick={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: (v.m + 1) % 12 }))}
          aria-label="Next month"
          className="rounded px-2 py-1 hover:bg-stone-200"
        >›</button>
      </div>

      <div role="grid" aria-label={`${MONTH_NAMES[view.m]} ${view.y}`} className="grid grid-cols-7 gap-1">
        <div role="row" className="contents">
          {WEEKDAY_NAMES.map((w) => (
            <span key={w} role="columnheader" className="text-center text-xs text-stone-500">{w}</span>
          ))}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, w) => (
          <div key={w} role="row" className="contents">
            {cells.slice(w * 7, w * 7 + 7).map((cell) => {
              if (cell.day === null) return <span key={cell.key} aria-hidden />
              const day = cell.day
              const isFocus = day === focusDay
              const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = iso === value
              return (
                <button
                  key={cell.key}
                  ref={(el) => {
                    if (el) dayBtnRefs.current.set(day, el)
                    else dayBtnRefs.current.delete(day)
                  }}
                  role="gridcell"
                  type="button"
                  tabIndex={isFocus ? 0 : -1}
                  aria-selected={isSelected || undefined}
                  onClick={() => commit(day)}
                  onKeyDown={(e) => {
                    // local mini-axis (calendar 좌표 산수만, data 의존 없음). KEYS SSOT 사용.
                    switch (e.key) {
                      case KEYS.Enter:
                      case KEYS.Space:
                        e.preventDefault(); commit(day); break
                      case KEYS.ArrowLeft: e.preventDefault(); moveFocus(-1); break
                      case KEYS.ArrowRight: e.preventDefault(); moveFocus(1); break
                      case KEYS.ArrowUp: e.preventDefault(); moveFocus(-7); break
                      case KEYS.ArrowDown: e.preventDefault(); moveFocus(7); break
                    }
                  }}
                  className="rounded p-1 text-center text-sm hover:bg-stone-200 focus:bg-stone-900 focus:text-white focus:outline-none aria-selected:bg-stone-200"
                >
                  {day}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}

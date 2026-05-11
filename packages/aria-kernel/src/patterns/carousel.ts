import { useCallback, useEffect, useRef, useState } from 'react'
import { KEYS } from '../axes'
import type { ItemProps, RootProps } from './types'

/** Carousel slide descriptor — id + label fragment. */
export interface CarouselSlide {
  id: string
  /** aria-label fragment ("Article title"), recipe 가 "Slide N of M: …" 로 합성. */
  label: string
}

/**
 * useCarouselPattern 이 흡수하는 키 — SSOT.
 * control='tabs' 일 때만 tablist 가 ArrowLeft/Right/Home/End 처리.
 * control='buttons' 는 키 흡수 없음 (prev/next 버튼 클릭).
 */
export const carouselKeys = (opts: { control?: 'buttons' | 'tabs' } = {}): readonly string[] =>
  (opts.control ?? 'buttons') === 'tabs'
    ? [KEYS.ArrowRight, KEYS.ArrowLeft, KEYS.Home, KEYS.End]
    : []

/** Options for {@link useCarouselPattern}. */
export interface CarouselOptions {
  slides: CarouselSlide[]
  /** Controlled current slide index. */
  index?: number
  /** Uncontrolled initial index. */
  defaultIndex?: number
  onIndexChange?: (i: number) => void
  /** Auto-rotate. focus/hover/explicit-pause 시 정지. */
  autoplay?: boolean
  intervalMs?: number
  /** loop=true 면 마지막→처음 순환. default true. */
  loop?: boolean
  /** carousel container 의 aria-label. */
  label?: string
  idPrefix?: string
  /**
   * APG 분기. `'buttons'` (default) — prev/next 버튼 + rotation toggle.
   * `'tabs'` — APG `carousel-2-tablist` 변종, 각 슬라이드가 tab 으로 이동. 이 모드는
   * 추가로 `tablistProps`, `tabProps(i)` getter 를 노출한다.
   */
  control?: 'buttons' | 'tabs'
}

/**
 * carousel — APG `/carousel/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 *
 * 자동 회전 정지 규칙 (APG):
 *   1. carousel 내 어떤 요소든 키보드 focus → 정지 (사용자가 rotation control 활성화 전엔 재개 안 함)
 *   2. mouse hover 중 → 정지
 *   3. rotation control 토글 → 명시적 재개/정지
 *
 * roleDescription="carousel"·"slide" 는 APG 권장 — 스크린리더가 "carousel"·"slide" 로 읽음.
 *
 * @example canonical (#148 §4) — opts-only 패턴 (slides 는 props, 라이프사이클은 hook 내부)
 *   const { rootProps, slideProps, prevProps, nextProps } = useCarouselPattern({ slides, label: '…' })
 */
export function useCarouselPattern(opts: CarouselOptions): {
  index: number
  playing: boolean
  prev: () => void
  next: () => void
  goTo: (i: number) => void
  toggleRotation: () => void
  rootProps: RootProps
  slideProps: (slideIndex: number) => ItemProps
  prevButtonProps: ItemProps
  nextButtonProps: ItemProps
  rotationButtonProps: ItemProps
  liveRegionProps: ItemProps
  tablistProps: RootProps
  tabProps: (slideIndex: number) => ItemProps
} {
  const {
    slides,
    index: controlled,
    defaultIndex = 0,
    onIndexChange,
    autoplay = false,
    intervalMs = 5000,
    loop = true,
    label,
    idPrefix = 'carousel',
    control = 'buttons',
  } = opts
  const count = slides.length

  const [uncontrolled, setUncontrolled] = useState(defaultIndex)
  const index = controlled ?? uncontrolled
  const isControlled = controlled !== undefined

  // explicit pause 가 한번이라도 발생하면 hover/blur 만으로는 재개 안 함 (APG 규칙 1).
  const [paused, setPaused] = useState(!autoplay)
  const [hovered, setHovered] = useState(false)
  const [focusedWithin, setFocusedWithin] = useState(false)

  const playing = !paused && !hovered && !focusedWithin

  const setIndex = useCallback(
    (i: number) => {
      const bounded = loop ? ((i % count) + count) % count : Math.max(0, Math.min(count - 1, i))
      if (!isControlled) setUncontrolled(bounded)
      onIndexChange?.(bounded)
    },
    [count, loop, isControlled, onIndexChange],
  )

  const next = useCallback(() => setIndex(index + 1), [index, setIndex])
  const prev = useCallback(() => setIndex(index - 1), [index, setIndex])
  const goTo = setIndex
  const toggleRotation = useCallback(() => setPaused((p) => !p), [])

  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!playing || count <= 1) return
    timer.current = window.setInterval(() => {
      setIndex((isControlled ? (controlled ?? 0) : uncontrolled) + 1)
    }, intervalMs)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, count, intervalMs, controlled, uncontrolled, isControlled])

  const onMouseEnter = useCallback(() => setHovered(true), [])
  const onMouseLeave = useCallback(() => setHovered(false), [])

  // APG 규칙 1: keyboard focus 진입 시 정지. focus 빠져나갈 때 재개하지 않음 — explicit toggle 필요.
  const onFocusCapture = useCallback(() => {
    setFocusedWithin(true)
    setPaused(true)
  }, [])
  const onBlurCapture = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusedWithin(false)
  }, [])

  const containerId = `${idPrefix}-container`
  const slideId = (i: number) => `${idPrefix}-slide-${i}`
  const tabId = (i: number) => `${idPrefix}-tab-${i}`
  const tablistDomId = `${idPrefix}-tablist`

  const rootProps: RootProps = {
    role: 'region',
    id: containerId,
    'aria-roledescription': 'carousel',
    'aria-label': label,
    onMouseEnter,
    onMouseLeave,
    onFocusCapture,
    onBlurCapture,
  } as unknown as RootProps

  const slideProps = (i: number): ItemProps => {
    const slide = slides[i]
    if (control === 'tabs') {
      return {
        role: 'tabpanel',
        id: slideId(i),
        'aria-roledescription': 'slide',
        'aria-labelledby': tabId(i),
        hidden: i !== index,
        tabIndex: 0,
        'data-active': i === index ? '' : undefined,
      } as unknown as ItemProps
    }
    return {
      role: 'group',
      id: slideId(i),
      'aria-roledescription': 'slide',
      'aria-label': slide ? `Slide ${i + 1} of ${count}: ${slide.label}` : `Slide ${i + 1} of ${count}`,
      hidden: i !== index,
      'data-active': i === index ? '' : undefined,
    } as unknown as ItemProps
  }

  const tablistProps: RootProps = {
    role: 'tablist',
    id: tablistDomId,
    'aria-label': label ? `${label} · slides` : 'Slides',
    onKeyDown: (e: React.KeyboardEvent) => {
      if (control !== 'tabs') return
      // switch (e.key) — pattern 내부의 mini-axis. axis 시스템 미통과 (data 없음 — count/index 만으로 동작) 라 fromKeyMap 대신 switch 그대로 유지. KEYS SSOT 사용.
      switch (e.key) {
        case KEYS.ArrowRight: e.preventDefault(); next(); break
        case KEYS.ArrowLeft: e.preventDefault(); prev(); break
        case KEYS.Home: e.preventDefault(); goTo(0); break
        case KEYS.End: e.preventDefault(); goTo(count - 1); break
      }
    },
  } as unknown as RootProps

  const tabProps = (i: number): ItemProps => {
    const slide = slides[i]
    const isActive = i === index
    return {
      role: 'tab',
      id: tabId(i),
      type: 'button',
      tabIndex: isActive ? 0 : -1,
      'aria-selected': isActive,
      'aria-controls': slideId(i),
      'aria-label': slide ? `Slide ${i + 1}: ${slide.label}` : `Slide ${i + 1}`,
      'data-active': isActive ? '' : undefined,
      onClick: () => goTo(i),
    } as unknown as ItemProps
  }

  // APG: prev/next aria-controls references the carousel container, not the active slide.
  const prevButtonProps: ItemProps = {
    'aria-label': 'Previous Slide',
    'aria-controls': containerId,
    onClick: prev,
  } as unknown as ItemProps

  const nextButtonProps: ItemProps = {
    'aria-label': 'Next Slide',
    'aria-controls': containerId,
    onClick: next,
  } as unknown as ItemProps

  const rotationButtonProps: ItemProps = {
    'aria-label': playing ? 'Stop slide rotation' : 'Start slide rotation',
    onClick: toggleRotation,
  } as unknown as ItemProps

  const liveRegionProps: ItemProps = {
    'aria-live': playing ? 'off' : 'polite',
    'aria-atomic': false,
  } as unknown as ItemProps

  return {
    index,
    playing,
    prev,
    next,
    goTo,
    toggleRotation,
    rootProps,
    slideProps,
    prevButtonProps,
    nextButtonProps,
    rotationButtonProps,
    liveRegionProps,
    tablistProps,
    tabProps,
  }
}

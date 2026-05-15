import { useMemo } from 'react'
import type { NormalizedData, UiEvent } from '../intent/events'
import { composeAxes, navigate, pageNavigate } from '../axes'
import { useRovingTabIndex } from '../roving/useRovingTabIndex'
import type { InsideEditableMode } from '../key/insideEditable'
import { usePatternClipboard, type ClipboardOnMiddleware, type ClipboardSerializerOptions } from '../input/clipboard/usePatternClipboard'
import type { KeyDescriptor, ItemProps, RootProps } from './types'

/** Feed 가 등록하는 axis — SSOT. ArrowDown/Up + Home/End (navigate) + PageUp/PageDown (pageNavigate). */
export const feedAxis = () => composeAxes(pageNavigate('vertical', 1), navigate('vertical'))

/** Feed article descriptor — id + optional label. */
export interface FeedItem {
  id: string
  label?: string
}

/** Dispatch event emitted by feed pattern. navigate (article focus) + clipboard/history UiEvents. */
export type FeedEvent = UiEvent

/** Options for {@link useFeedPattern}. */
export interface FeedOptions {
  /** aria-busy — DOM 갱신 중 true. */
  busy?: boolean
  idPrefix?: string
  /** aria-label — ARIA: feed requires accessible name. */
  label?: string
  labelledBy?: string
  autoFocus?: boolean
  /**
   * input/contenteditable 안에서 clipboard/단축키 라우팅 모드. default 'forward'.
   */
  insideEditable?: InsideEditableMode
  /**
   * 사용자 chord 미들웨어. default 와 충돌 시 userFn(event, originalFn) 으로 wrap.
   */
  on?: ClipboardOnMiddleware
  serialize?: ClipboardSerializerOptions['serialize']
  toClipboard?: ClipboardSerializerOptions['toClipboard']
  fromClipboard?: ClipboardSerializerOptions['fromClipboard']
}

/**
 * feed 가 디폴트로 흡수하는 chord 목록 — descriptor SSOT.
 * feed 는 read-only article bundle 이지만 clipboard/history chord 일관 정책상 동일 chord 흡수.
 * 호스트가 read-only 라면 dispatch 에서 해당 UiEvent 를 무시하면 된다.
 */
export const feedKeys: readonly KeyDescriptor[] = [
  { chord: 'mod+z',       uiEvent: 'undo',   description: 'Undo last operation' },
  { chord: 'mod+shift+z', uiEvent: 'redo',   description: 'Redo' },
  { chord: 'mod+y',       uiEvent: 'redo',   description: 'Redo (Windows fallback)' },
  { chord: 'Backspace',   uiEvent: 'remove', description: 'Remove focused article', scope: 'item' },
  { chord: 'Delete',      uiEvent: 'remove', description: 'Remove focused article', scope: 'item' },
  { chord: 'mod+shift+v', uiEvent: 'paste',  description: 'Paste as child of focused article', scope: 'item' },
  // clipboard React events
  { chord: 'clipboard:copy',  uiEvent: 'copy',  description: 'Copy focused article (React onCopy)',   scope: 'item' },
  { chord: 'clipboard:cut',   uiEvent: 'cut',   description: 'Cut focused article (React onCut)',     scope: 'item' },
  { chord: 'clipboard:paste', uiEvent: 'paste', description: 'Paste onto focused article (React onPaste)', scope: 'item' },
]

const ARTICLE_ATTR = 'data-feed-article'

/**
 * feed — APG `/feed/` recipe.
 * https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * N 개 article 의 *bundle* — picker 가 아니므로 NormalizedData 가 아니라
 * `FeedItem[]` 직접 받음. PageUp/PageDown 으로 인접 article 이동.
 *
 * focus 는 article element(tabIndex=-1, 프로그램 focus only) 로 이동. article 내부의
 * focusable 자식이 native Tab 흐름. delegate.onKeyDown 의 `e.target.closest('[data-id]')`
 * 위임이 깊은 자식에서도 article id 추적.
 *
 * Ctrl+Home/End (feed 바깥 first/last focusable) 은 host 책임.
 *
 * @example canonical (#148 §4) — feed 는 FeedItem[] 직접 (NormalizedData 미사용)
 *   const { rootProps, articleProps } = useFeedPattern(items, (e) => { ... })
 */
export function useFeedPattern(
  items: FeedItem[],
  dispatch?: (e: FeedEvent) => void,
  opts: FeedOptions = {},
): {
  rootProps: RootProps
  articleProps: (id: string) => ItemProps
  labelProps: (id: string) => { id: string }
  items: (FeedItem & { posinset: number; setsize: number })[]
} {
  const { busy, idPrefix = 'feed', label, labelledBy, autoFocus, insideEditable = 'forward' } = opts

  const synth: NormalizedData = useMemo(() => ({
    entities: Object.fromEntries(items.map((it) => [it.id, { label: it.label }])),
    relationships: {},
    meta: { root: items.map((it) => it.id) },
  }), [items])

  const intent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) dispatch?.(e)
  }

  const { focusId, bindFocus, delegate } = useRovingTabIndex(feedAxis(), synth, intent, { autoFocus })

  const clipboard = usePatternClipboard({
    onEvent: dispatch,
    activeId: focusId ?? null,
    insideEditable,
    on: opts.on,
    builtinChords: feedKeys,
    serialize: opts.serialize,
    toClipboard: opts.toClipboard,
    fromClipboard: opts.fromClipboard,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    delegate.onKeyDown(e)
    if (e.defaultPrevented) return
    clipboard.handleKeyDown(e)
  }

  const articleId = (id: string) => `${idPrefix}-article-${id}`
  const labelId = (id: string) => `${idPrefix}-article-${id}-label`

  const rootProps: RootProps = {
    role: 'feed',
    'aria-busy': busy || undefined,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...delegate,
    onKeyDown: handleKeyDown,
    onCopy: clipboard.onCopy,
    onCut: clipboard.onCut,
    onPaste: clipboard.onPaste,
  } as unknown as RootProps

  const rendered = items.map((it, i) => ({ ...it, posinset: i + 1, setsize: items.length }))

  const articleProps = (id: string): ItemProps => {
    const it = rendered.find((x) => x.id === id)
    return {
      role: 'article',
      id: articleId(id),
      ref: bindFocus(id) as React.Ref<HTMLElement>,
      tabIndex: -1,
      [ARTICLE_ATTR]: '',
      'data-id': id,
      'aria-labelledby': labelId(id),
      'aria-posinset': it?.posinset,
      'aria-setsize': it?.setsize,
    } as unknown as ItemProps
  }

  const labelProps = (id: string) => ({ id: labelId(id) })

  return { rootProps, articleProps, labelProps, items: rendered }
}

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FeedPageNavDemo } from './FeedPageNavDemo'

afterEach(cleanup)

const feed = () => screen.getByRole('feed')
const articles = () => screen.getAllByRole('article')

describe('Feed page-nav demo — black-box', () => {
  it('role=feed + label + 6 articles', () => {
    render(<FeedPageNavDemo />)
    expect(feed().getAttribute('aria-label')).toBe('뉴스 피드')
    expect(articles()).toHaveLength(6)
  })

  it('각 article: role + posinset + setsize + aria-labelledby', () => {
    render(<FeedPageNavDemo />)
    articles().forEach((a, i) => {
      expect(a.getAttribute('role')).toBe('article')
      expect(a.getAttribute('aria-posinset')).toBe(String(i + 1))
      expect(a.getAttribute('aria-setsize')).toBe('6')
      expect(a.getAttribute('aria-labelledby')).toMatch(/feed-article-/)
    })
  })

  it('article tabIndex=-1 (programmatic focus only — APG punt)', () => {
    render(<FeedPageNavDemo />)
    articles().forEach((a) => expect(a.getAttribute('tabindex')).toBe('-1'))
  })

  it('aria-busy 토글 (load 표시 흡수)', () => {
    render(<FeedPageNavDemo />)
    expect(feed().getAttribute('aria-busy')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /aria-busy/ }))
    expect(feed().getAttribute('aria-busy')).toBe('true')
  })
})

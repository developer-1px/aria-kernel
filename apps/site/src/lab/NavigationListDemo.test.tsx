import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NavigationListDemo } from './NavigationListDemo'

afterEach(cleanup)

const link = (name: string) => screen.getByRole('link', { name })

describe('NavigationList demo — black-box', () => {
  it('role=navigation + label', () => {
    render(<NavigationListDemo />)
    expect(screen.getByRole('navigation', { name: '메인 네비게이션' })).toBeTruthy()
  })

  it('initial: 홈 = aria-current=page', () => {
    render(<NavigationListDemo />)
    expect(link('홈').getAttribute('aria-current')).toBe('page')
    expect(link('문서').getAttribute('aria-current')).toBeNull()
  })

  it('Click 문서 → aria-current 가 문서로 이동 (singleCurrent)', () => {
    render(<NavigationListDemo />)
    fireEvent.click(link('문서'))
    expect(link('홈').getAttribute('aria-current')).toBeNull()
    expect(link('문서').getAttribute('aria-current')).toBe('page')
  })

  it('aria-selected 사용하지 않음 (listbox 안티패턴 차단)', () => {
    render(<NavigationListDemo />)
    expect(link('홈').getAttribute('aria-selected')).toBeNull()
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.queryByRole('option')).toBeNull()
  })
})

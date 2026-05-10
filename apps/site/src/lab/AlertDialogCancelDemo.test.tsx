import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AlertDialogCancelDemo } from './AlertDialogCancelDemo'

afterEach(cleanup)

const openBtn = () => screen.getByRole('button', { name: '파일 삭제' })
const dialog = () => screen.queryByRole('alertdialog')

describe('AlertDialog cancel-first demo — black-box', () => {
  it('role=alertdialog 노출', () => {
    render(<AlertDialogCancelDemo />)
    fireEvent.click(openBtn())
    expect(dialog()).not.toBeNull()
  })

  it('aria-modal=true (modal default)', () => {
    render(<AlertDialogCancelDemo />)
    fireEvent.click(openBtn())
    expect(dialog()!.getAttribute('aria-modal')).toBe('true')
  })

  it('open 시 초기 focus = 취소 버튼 (cancelRef)', () => {
    render(<AlertDialogCancelDemo />)
    fireEvent.click(openBtn())
    expect(document.activeElement?.textContent).toBe('취소')
  })

  it('취소 클릭 → close + 결과=취소됨', () => {
    render(<AlertDialogCancelDemo />)
    fireEvent.click(openBtn())
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(dialog()).toBeNull()
    expect(screen.getByText('취소됨')).toBeTruthy()
  })

  it('Escape → close (escape axis)', () => {
    render(<AlertDialogCancelDemo />)
    fireEvent.click(openBtn())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(dialog()).toBeNull()
  })
})

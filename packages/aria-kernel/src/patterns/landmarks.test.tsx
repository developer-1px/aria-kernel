/**
 * useLandmarks + <Landmark> — Demo render + click cycler only.
 * Verifies: role/aria-label emission, registry snapshot, Cmd+F6 cycle target.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Landmark, LandmarksProvider, useLandmarks } from './landmarks'

afterEach(cleanup)

function Cycler() {
  const landmarks = useLandmarks()
  const [i, setI] = useState(0)
  return (
    <div>
      <button
        data-testid="cycle"
        onClick={() => {
          if (landmarks.length === 0) return
          const next = (i + 1) % landmarks.length
          setI(next)
          landmarks[next].ref.current?.focus()
        }}
      >
        cycle ({landmarks.length})
      </button>
      <ol data-testid="list">
        {landmarks.map((l) => (
          <li key={l.id}>
            {l.role}:{l.label}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Demo() {
  return (
    <LandmarksProvider>
      <Cycler />
      <Landmark role="navigation" label="Primary">
        <button data-testid="nav-btn">nav</button>
      </Landmark>
      <Landmark role="main" label="Editor">
        <button data-testid="main-btn">main</button>
      </Landmark>
      <Landmark role="complementary" label="Sidebar">
        <button data-testid="aside-btn">aside</button>
      </Landmark>
    </LandmarksProvider>
  )
}

describe('useLandmarks + <Landmark>', () => {
  it('emits role + aria-label on each landmark', () => {
    render(<Demo />)
    const nav = screen.getByRole('navigation')
    expect(nav.getAttribute('aria-label')).toBe('Primary')
    const main = screen.getByRole('main')
    expect(main.getAttribute('aria-label')).toBe('Editor')
    const aside = screen.getByRole('complementary')
    expect(aside.getAttribute('aria-label')).toBe('Sidebar')
  })

  it('registers landmarks into the snapshot in DOM order', () => {
    render(<Demo />)
    expect(screen.getByTestId('cycle').textContent).toContain('(3)')
    const items = screen.getByTestId('list').textContent
    expect(items).toBe('navigation:Primarymain:Editorcomplementary:Sidebar')
  })

  it('cycler focuses next landmark', () => {
    render(<Demo />)
    const cycle = screen.getByTestId('cycle')
    fireEvent.click(cycle) // i=1 → main
    expect(document.activeElement).toBe(screen.getByRole('main'))
    fireEvent.click(cycle) // i=2 → complementary
    expect(document.activeElement).toBe(screen.getByRole('complementary'))
  })

  it('useLandmarks returns empty list outside provider', () => {
    render(<Cycler />)
    expect(screen.getByTestId('cycle').textContent).toContain('(0)')
  })

  it('unmounting a Landmark removes it from snapshot', () => {
    function D() {
      const [show, setShow] = useState(true)
      return (
        <LandmarksProvider>
          <Cycler />
          <button data-testid="toggle" onClick={() => setShow((s) => !s)}>t</button>
          <Landmark role="main" label="Editor"><span /></Landmark>
          {show ? <Landmark role="navigation" label="Side" /> : null}
        </LandmarksProvider>
      )
    }
    render(<D />)
    expect(screen.getByTestId('cycle').textContent).toContain('(2)')
    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('cycle').textContent).toContain('(1)')
  })
})

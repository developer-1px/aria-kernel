/**
 * useShortcutRegistry — Demo render + keyboard only.
 * cheatsheet DOM textContent + chord effect 만 검증.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import {
  ShortcutRegistryProvider,
  useShortcutRegistry,
  type CheatsheetGroup,
} from './useShortcutRegistry'

afterEach(() => cleanup())

const isMac = /Mac|iP(hone|od|ad)/.test(navigator.platform)

const fireMod = (key: string, opts: KeyboardEventInit = {}) => {
  fireEvent.keyDown(window, {
    key,
    ...(isMac ? { metaKey: true } : { ctrlKey: true }),
    ...opts,
  })
}

function Cheatsheet({ groups }: { groups: readonly CheatsheetGroup[] }) {
  return (
    <ul data-testid="cheatsheet">
      {groups.map((g) => (
        <li key={g.scope} data-scope={g.scope}>
          <span>{g.scope}</span>
          <ul>
            {g.bindings.map((b) => (
              <li key={b.chord} data-chord={b.chord}>
                <kbd>{b.chord}</kbd> {b.label}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}

function Demo() {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(0)
  const [palette, setPalette] = useState(0)
  const [dirty, setDirty] = useState(true)

  const reg = useShortcutRegistry()
  reg.useRegister({ chord: 'mod+s', scope: 'page', label: 'Save', when: () => dirty, run: () => setSaved((n) => n + 1) })
  reg.useRegister({ chord: 'mod+k', scope: 'page', label: 'Command palette', run: () => setPalette((n) => n + 1) })
  reg.useRegister({ chord: 'Shift+/', scope: 'page', label: 'Open cheatsheet', run: () => setOpen((o) => !o) })

  const groups = reg.useCheatsheet()

  return (
    <div>
      <div data-testid="saved">{saved}</div>
      <div data-testid="palette">{palette}</div>
      <button onClick={() => setDirty((d) => !d)} data-testid="toggle-dirty">{dirty ? 'dirty' : 'clean'}</button>
      {open && <Cheatsheet groups={groups} />}
    </div>
  )
}

describe('useShortcutRegistry', () => {
  it('mod+s runs registered handler', () => {
    render(<ShortcutRegistryProvider><Demo /></ShortcutRegistryProvider>)
    expect(screen.getByTestId('saved').textContent).toBe('0')
    fireMod('s')
    expect(screen.getByTestId('saved').textContent).toBe('1')
  })

  it('mod+k runs palette handler', () => {
    render(<ShortcutRegistryProvider><Demo /></ShortcutRegistryProvider>)
    fireMod('k')
    expect(screen.getByTestId('palette').textContent).toBe('1')
  })

  it('Shift+/ opens cheatsheet listing all registered bindings grouped by scope', () => {
    render(<ShortcutRegistryProvider><Demo /></ShortcutRegistryProvider>)
    expect(screen.queryByTestId('cheatsheet')).toBeNull()
    fireEvent.keyDown(window, { key: '/', shiftKey: true })
    const sheet = screen.getByTestId('cheatsheet')
    expect(sheet.textContent).toContain('Save')
    expect(sheet.textContent).toContain('Command palette')
    expect(sheet.textContent).toContain('Open cheatsheet')
    expect(sheet.querySelector('[data-scope="page"]')).not.toBeNull()
  })

  it('when()=false hides binding from cheatsheet and skips run', () => {
    render(<ShortcutRegistryProvider><Demo /></ShortcutRegistryProvider>)
    fireEvent.click(screen.getByTestId('toggle-dirty'))   // dirty → false
    fireMod('s')
    expect(screen.getByTestId('saved').textContent).toBe('0')   // skipped
    fireEvent.keyDown(window, { key: '/', shiftKey: true })
    expect(screen.getByTestId('cheatsheet').textContent).not.toContain('Save')
    expect(screen.getByTestId('cheatsheet').textContent).toContain('Command palette')
  })

  it('conflict — same chord × scope throws at register time', () => {
    function Conflict() {
      const reg = useShortcutRegistry()
      reg.useRegister({ chord: 'mod+s', scope: 'page', label: 'A', run: () => {} })
      reg.useRegister({ chord: 'mod+s', scope: 'page', label: 'B', run: () => {} })
      return null
    }
    // React surfaces effect throws — supress console + expect
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<ShortcutRegistryProvider><Conflict /></ShortcutRegistryProvider>),
    ).toThrow(/conflict.*mod\+s/)
    spy.mockRestore()
  })

  it('different scopes — same chord coexists without conflict', () => {
    function Multi() {
      const reg = useShortcutRegistry()
      reg.useRegister({ chord: 'mod+s', scope: 'page', label: 'Page save', run: () => {} })
      reg.useRegister({ chord: 'mod+s', scope: 'dialog-modal', label: 'Dialog save', run: () => {} })
      const groups = reg.useCheatsheet()
      return <Cheatsheet groups={groups} />
    }
    render(<ShortcutRegistryProvider><Multi /></ShortcutRegistryProvider>)
    const sheet = screen.getByTestId('cheatsheet')
    expect(sheet.textContent).toContain('Page save')
    expect(sheet.textContent).toContain('Dialog save')
  })

  it('normalizes modifier order — Shift+mod+s conflicts with mod+Shift+s', () => {
    function Norm() {
      const reg = useShortcutRegistry()
      reg.useRegister({ chord: 'Shift+mod+s', scope: 'page', label: 'A', run: () => {} })
      reg.useRegister({ chord: 'mod+Shift+s', scope: 'page', label: 'B', run: () => {} })
      return null
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ShortcutRegistryProvider><Norm /></ShortcutRegistryProvider>)).toThrow(/conflict/)
    spy.mockRestore()
  })

  it('unmount removes binding from registry and unbinds keydown', () => {
    function Outer() {
      const [show, setShow] = useState(true)
      return (
        <ShortcutRegistryProvider>
          <button onClick={() => setShow(false)} data-testid="hide">hide</button>
          {show && <Demo />}
          <Probe />
        </ShortcutRegistryProvider>
      )
    }
    function Probe() {
      const reg = useShortcutRegistry()
      const groups = reg.useCheatsheet()
      return <div data-testid="count">{groups.reduce((n, g) => n + g.bindings.length, 0)}</div>
    }
    render(<Outer />)
    expect(Number(screen.getByTestId('count').textContent)).toBe(3)
    fireEvent.click(screen.getByTestId('hide'))
    expect(Number(screen.getByTestId('count').textContent)).toBe(0)
  })
})
